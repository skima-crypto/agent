"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import {
  Send,
  Paperclip,
  Mic,
  Camera,
  Sun,
  Moon,
  ArrowLeft,
  Search,
  Users,
  MoreHorizontal,
} from "lucide-react";

import ProfileModal from "@/components/ProfileModal";
import ImageViewerModal from "@/components/ImageViewerModal";
import VideoViewerModal from "@/components/VideoViewerModal";
import MessageActionsPopup from "@/components/MessageActionsPopup";
import VoiceRecorder from "@/components/VoiceRecorder";

// Lazy-load emoji picker to prevent SSR issues
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

// Utility: time ago
const timeAgo = (timestamp: string) => {
  const now = new Date();
  const past = new Date(timestamp);
  const diff = (now.getTime() - past.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2593600)}mo ago`;
  return `${Math.floor(diff / 31536000)}y ago`;
};

// URL detection
const urlRegex = /((https?:\/\/|www\.)[^\s/$.?#].[^\s]*)/gi;
const renderMessageContent = (text: string) => {
  if (!text) return null;
  const parts = text.split(urlRegex).filter(Boolean);
  return parts.map((part, idx) => {
    if (part.match(urlRegex)) {
      const href = part.startsWith("http") ? part : `https://${part}`;
      return (
        <a key={idx} href={href} target="_blank" rel="noopener noreferrer" className="underline break-words">
          {part}
        </a>
      );
    }
    return <span key={idx}>{part}</span>;
  });
};

export default function GroupPage() {
  const router = useRouter();
  const { group_username } = useParams<{ group_username: string }>();
  const [group, setGroup] = useState<any | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [replyTo, setReplyTo] = useState<any | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [showImage, setShowImage] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionPopup, setActionPopup] = useState<{ visible: boolean; x: number; y: number; msgId?: string }>({
    visible: false,
    x: 0,
    y: 0,
  });
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [membersOpen, setMembersOpen] = useState(false);

  // refs
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const messageInputRef = useRef<HTMLInputElement | null>(null);

  // focus when reply set
  useEffect(() => {
    if (replyTo && messageInputRef.current) messageInputRef.current.focus();
  }, [replyTo]);

  // Load session, group, members, messages
  useEffect(() => {
    if (!group_username) return;

    let mounted = true;

    const loadEverything = async () => {
      // session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/dashboard");
        return;
      }
      setCurrentUser(user);

      // group by username
      const { data: grp, error: grpErr } = await supabase
        .from("groups")
        .select("*")
        .eq("group_username", group_username)
        .single();
      if (grpErr || !grp) {
        setGroup(null);
        return;
      }
      if (!mounted) return;
      setGroup(grp);

      // members
      const { data: mems } = await supabase
        .from("group_members")
        .select("user_id, role, joined_at, profiles(id, username, avatar_url)")
        .eq("group_id", grp.id)
        .order("joined_at", { ascending: true });

      // normalize member objects
      if (mems) {
        const normalized = (mems as any[]).map((m) => ({
          id: m.profiles?.id || m.user_id,
          username: m.profiles?.username,
          avatar_url: m.profiles?.avatar_url,
          role: m.role,
          joined_at: m.joined_at,
        }));
        setMembers(normalized);
      }

      // load messages
      const { data: msgs } = await supabase
        .from("group_messages")
        .select("*")
        .eq("group_id", grp.id)
        .order("created_at", { ascending: true });

      // load reactions for those messages
      const msgIds = (msgs || []).map((m: any) => m.id);
      let reactions: any[] = [];
      if (msgIds.length) {
        const { data: r } = await supabase
          .from("group_message_reactions")
          .select("*")
          .in("message_id", msgIds);
        reactions = r || [];
      }

      // map reply_to
      const mapById = new Map((msgs || []).map((m: any) => [m.id, m]));
      const safeMsgs = (msgs || []).map((m: any) => ({
        ...m,
        reactions: reactions.filter((r) => r.message_id === m.id).map((r) => r.emoji),
        reply_to_message: m.reply_to ? mapById.get(m.reply_to) || null : null,
      }));
      setMessages(safeMsgs);
    };

    loadEverything();

    return () => {
      mounted = false;
    };
  }, [group_username, router]);

  // Realtime: messages in this group
  useEffect(() => {
    if (!group?.id) return;

    const channel = supabase.channel(`group-${group.id}`);

    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "group_messages",
        filter: `group_id=eq.${group.id}`,
      },
      async (payload) => {
        const msg = payload.new as any;
        const old = payload.old as any;

        if (payload.eventType === "INSERT" && msg) {
          let replyToMessage = null;
          if (msg.reply_to) {
            const { data: replyData } = await supabase.from("group_messages").select("*").eq("id", msg.reply_to).single();
            replyToMessage = replyData || null;
          }
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, { ...msg, reactions: [], reply_to_message: replyToMessage }]));
        } else if (payload.eventType === "UPDATE" && msg) {
          setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, ...msg } : m)));
        } else if (payload.eventType === "DELETE" && old) {
          setMessages((prev) => prev.filter((m) => m.id !== old.id));
        }
      }
    );

    channel.subscribe();

    return () => {
      try {
        channel.unsubscribe();
      } catch (e) {
        supabase.removeChannel(channel);
      }
    };
  }, [group?.id]);

  // Realtime: reactions
  useEffect(() => {
    if (!group?.id) return;

    const channel = supabase
      .channel(`group-${group.id}-reactions`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_message_reactions",
          // we can't filter by group here directly, but we'll react only to messages in this group (we can check message's group via local messages or re-query)
        },
        async (payload) => {
          const reaction = payload.new as any;
          const old = payload.old as any;
          const affectedMessageId = reaction?.message_id || old?.message_id;
          if (!affectedMessageId) return;

          // fetch all reactions for that message and update
          const { data: reactionRows } = await supabase.from("group_message_reactions").select("emoji").eq("message_id", affectedMessageId);
          const emojis = (reactionRows || []).map((r: any) => r.emoji);
          setMessages((prev) => prev.map((m) => (m.id === affectedMessageId ? { ...m, reactions: emojis } : m)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [group?.id]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // convenience: current user's profile object if exists in members
  const currentProfile = members.find((m) => m.id === currentUser?.id) || null;
  const isAdmin = currentProfile?.role === "admin" || group?.created_by === currentUser?.id;

  // send message
  const sendMessage = async (type = "text", content = newMessage) => {
    if (type === "text" && !content?.trim()) return;
    if (!group?.id || !currentUser) return;

    // optimistic reply message object for immediate UI
    const optimistic = {
      id: `temp-${Date.now()}`,
      group_id: group.id,
      sender_id: currentUser.id,
      content: type === "text" ? content : null,
      type,
      image_url: type === "image" || type === "video" ? content : null,
      audio_url: type === "audio" ? content : null,
      reply_to: replyTo?.id || null,
      created_at: new Date().toISOString(),
      reactions: [],
      reply_to_message: replyTo || null,
    };

    setMessages((prev) => [...prev, optimistic]);
    setNewMessage("");
    setReplyTo(null);

    // write to DB (RLS permits members insert)
    const { data: inserted, error } = await supabase
      .from("group_messages")
      .insert({
        group_id: group.id,
        sender_id: currentUser.id,
        content: type === "text" ? content : null,
        type,
        image_url: type === "image" || type === "video" ? content : null,
        audio_url: type === "audio" ? content : null,
        reply_to: replyTo?.id || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Send error:", error.message);
      // revert optimistic (simple approach: remove temp msg)
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      return;
    }

    // replace optimistic with inserted (match temp id by timestamp not available; we'll append and rely on realtime for final update)
    setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? { ...inserted, reactions: [] } : m)));
  };

  // file upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    const ext = file.name.split(".").pop();
    const path = `group-uploads/${group?.id}/${currentUser.id}-${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage.from("chat-uploads").upload(path, file);
    if (error) {
      console.error("Upload error:", error);
      return;
    }
    const { data: publicUrl } = supabase.storage.from("chat-uploads").getPublicUrl(data.path);
    const url = publicUrl.publicUrl;

    if (file.type.startsWith("video")) {
      await sendMessage("video", url);
    } else if (file.type.startsWith("audio")) {
      await sendMessage("audio", url);
    } else {
      await sendMessage("image", url);
    }

    if (e.target) e.target.value = "";
  };

  // voice recorder callback
  const handleVoiceUpload = async (file: File) => {
    if (!currentUser) return;
    const path = `group-uploads/${group?.id}/${currentUser.id}-${Date.now()}.webm`;
    const { data, error } = await supabase.storage.from("chat-uploads").upload(path, file);
    if (error) {
      console.error(error);
      return;
    }
    const { data: publicUrl } = supabase.storage.from("chat-uploads").getPublicUrl(data.path);
    await sendMessage("audio", publicUrl.publicUrl);
  };

  const handleCameraCaptureClick = () => cameraInputRef.current?.click();

  // message actions popup
  const handleMessageClick = (e: React.MouseEvent, msgId: string) => {
    e.preventDefault();
    setActionPopup({ visible: true, x: e.pageX, y: e.pageY, msgId });
  };

  // react to message
  const handleReact = async (emoji: string) => {
    if (!actionPopup.msgId || !currentUser) return;
    const messageId = actionPopup.msgId;
    // insert reaction (unique constraint prevents duplicates same emoji by same user)
    const { error } = await supabase.from("group_message_reactions").insert({
      message_id: messageId,
      user_id: currentUser.id,
      emoji,
    });
    if (error) {
      console.error("Reaction error:", error.message);
      return;
    }
    // update UI optimistically
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions: [...(m.reactions || []), emoji] } : m)));
    setActionPopup({ visible: false, x: 0, y: 0 });
  };

  // remove reaction (current user removing their reaction)
  const removeReaction = async (messageId: string, emoji: string) => {
    if (!currentUser) return;
    const { error } = await supabase
      .from("group_message_reactions")
      .delete()
      .match({ message_id: messageId, user_id: currentUser.id, emoji });
    if (error) console.error("Remove reaction error:", error.message);
    else {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions: (m.reactions || []).filter((e: string) => e !== emoji) } : m)));
    }
  };

  // delete message (sender or admin allowed by RLS)
  const deleteMessage = async (messageId: string) => {
    if (!messageId || !currentUser) return;
    try {
      // We'll perform delete via supabase client. RLS allows sender or admin deletes per policy.
      const { error } = await supabase.from("group_messages").delete().eq("id", messageId);
      if (error) throw error;
      // remove from UI
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err: any) {
      console.error("Delete error:", err.message);
    } finally {
      setActionPopup({ visible: false, x: 0, y: 0 });
    }
  };

  // filtered messages for search
  const filteredMessages = searchMode
    ? messages.filter((m) => (m.content || "").toString().toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  // helper to get member avatar / username
  const profileFor = (senderId: string) => members.find((m) => m.id === senderId) || { avatar_url: "/default-avatar.png", username: "Unknown" };

  return (
    <div className={`flex h-screen ${theme === "dark" ? "bg-gradient-to-b from-blue-950 to-blue-900 text-blue-100" : "bg-white text-slate-900"}`}>
      {/* Left: Chat */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-blue-700/30">
          <div className="flex items-center gap-3">
            <ArrowLeft onClick={() => router.back()} className="cursor-pointer hover:text-blue-400" />
            <div className="flex items-center gap-3">
              <Image src={group?.avatar_url || "/default-group.png"} alt={group?.display_name || ""} width={44} height={44} className="rounded-full border" />
              <div>
                <div className="font-semibold">{group?.display_name}</div>
                <div className="text-xs opacity-70">{members.length} members</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setMembersOpen((s) => !s)} className="p-2 rounded-full hover:bg-blue-900/20">
              <Users />
            </button>

            <Search onClick={() => setSearchMode((s) => !s)} className="cursor-pointer hover:text-blue-400" />
            {theme === "dark" ? (
              <Sun onClick={() => setTheme("light")} className="cursor-pointer hover:text-yellow-400" />
            ) : (
              <Moon onClick={() => setTheme("dark")} className="cursor-pointer hover:text-blue-500" />
            )}
            <button className="p-2 rounded-full hover:bg-blue-900/20">
              <MoreHorizontal />
            </button>
          </div>
        </div>

        {/* Search input */}
        {searchMode && (
          <div className="p-3 border-b border-blue-700/20">
            <input type="text" placeholder="Search messages..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm bg-blue-950/10 border border-blue-700/20 focus:ring focus:ring-blue-600" />
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth">
          {filteredMessages.map((msg) => {
            const isMe = msg.sender_id === currentUser?.id;
            const repliedMsg = msg.reply_to_message;
            const senderProfile = profileFor(msg.sender_id);
            return (
              <motion.div key={msg.id} id={`msg-${msg.id}`} onContextMenu={(e) => handleMessageClick(e, msg.id)} className={`flex items-start gap-3 ${isMe ? "justify-end" : "justify-start"}`}>
                {/* avatar left for others */}
                {!isMe && (
                  <div className="w-10 h-10 shrink-0">
                    <Image src={senderProfile.avatar_url || "/default-avatar.png"} alt={senderProfile.username || ""} width={40} height={40} className="rounded-full object-cover" />
                  </div>
                )}

                <div className="flex flex-col max-w-[70%]">
                  {/* sender name for others */}
                  {!isMe && <div className="text-xs font-semibold mb-1">{senderProfile.username}</div>}

                  {/* Reply preview */}
                  {repliedMsg && (
                    <div onClick={() => { const el = document.getElementById(`msg-${repliedMsg.id}`); if (el) el.scrollIntoView({ behavior: "smooth", block: "center" }); }} className={`text-xs p-2 mb-1 rounded-lg border-l-4 cursor-pointer transition hover:bg-blue-800/20 ${isMe ? "border-blue-300 bg-blue-700/20 text-blue-100" : "border-blue-500 bg-blue-950/10 text-blue-200"}`}>
                      <span className="opacity-70">Replying to <span className="font-semibold">{repliedMsg.sender_id === currentUser?.id ? "You" : profileFor(repliedMsg.sender_id).username}</span></span>
                      <div className="truncate italic mt-1 opacity-80">{repliedMsg.content ? repliedMsg.content : `[${repliedMsg.type}]`}</div>
                    </div>
                  )}

                  {/* message bubble */}
                  {msg.type === "text" && (
                    <div className={`px-4 py-2 rounded-2xl break-words ${isMe ? "bg-blue-600 text-white self-end" : "bg-blue-950/20 text-blue-100"}`}>
                      {renderMessageContent(msg.content)}
                    </div>
                  )}

                  {msg.type === "image" && msg.image_url && (
                    <div className="rounded-xl overflow-hidden">
                      <Image src={msg.image_url} alt="image" width={300} height={300} className="rounded-xl cursor-pointer object-cover" onClick={() => setShowImage(msg.image_url)} />
                    </div>
                  )}

                  {msg.type === "video" && msg.image_url && (
                    <div className="rounded-xl overflow-hidden cursor-pointer">
                      <video src={msg.image_url} className="rounded-xl max-w-full" onClick={() => setShowVideo(msg.image_url)} controls={false} muted playsInline />
                    </div>
                  )}

                  {msg.type === "audio" && msg.audio_url && <audio controls src={msg.audio_url} className="rounded-md mt-1" />}

                  {/* reactions */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="flex gap-1 mt-1 text-lg">
                      {msg.reactions.map((r: string, i: number) => {
                        const userReacted = false; // optional: could compute if current user reacted same emoji
                        return (
                          <button key={i} onClick={() => removeReaction(msg.id, r)} className="px-2 py-1 rounded-md bg-slate-200/20">
                            {r}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* time */}
                  <span className="text-xs opacity-60 mt-1">{timeAgo(msg.created_at)}</span>
                </div>

                {/* avatar right for me */}
                {isMe && (
                  <div className="w-10 h-10 shrink-0">
                    <Image src={profileFor(msg.sender_id).avatar_url || "/default-avatar.png"} alt="avatar" width={40} height={40} className="rounded-full object-cover" />
                  </div>
                )}
              </motion.div>
            );
          })}

          <div ref={bottomRef} />
        </div>

        {/* Reply preview bar */}
        {replyTo && (
          <div className="p-2 bg-blue-900/40 text-sm border-l-4 border-blue-400 mb-1 rounded-md flex justify-between items-center mx-3">
            <span className="truncate">Replying to: {replyTo.content || replyTo.type}</span>
            <button onClick={() => setReplyTo(null)} className="text-xs text-blue-300 hover:underline">cancel</button>
          </div>
        )}

        {/* Input area */}
        <div className="p-3 border-t border-blue-700/30 bg-blue-950/60 backdrop-blur-md fixed bottom-0 left-0 right-0 z-20">
          <div className="flex items-center gap-2 w-full">
            <div className="flex items-center gap-2 flex-1 bg-blue-950/20 border border-blue-700/40 rounded-full px-3 py-3 min-h-[56px]">
              <input ref={cameraInputRef} type="file" accept="image/*,video/*" capture="environment" onChange={handleFileUpload} className="hidden" id="cameraCapture" />
              <button type="button" onClick={handleCameraCaptureClick} aria-label="Open camera" className="p-2 rounded-full hover:bg-blue-900/40"><Camera className="text-blue-300" /></button>

              <input ref={fileInputRef} type="file" accept="image/*,video/*,audio/*" onChange={handleFileUpload} className="hidden" id="fileUpload" />
              <label htmlFor="fileUpload" className="p-2 rounded-full hover:bg-blue-900/40 cursor-pointer"><Paperclip className="text-blue-300" /></label>

              <VoiceRecorder onRecorded={handleVoiceUpload} />

              <input ref={messageInputRef} type="text" placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} className="flex-1 bg-transparent outline-none px-3 text-sm" />

              <button onClick={() => sendMessage()} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full" aria-label="Send">
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Reusable modals */}
        {showProfile && profileUserId && <ProfileModal userId={profileUserId} onClose={() => { setShowProfile(false); setProfileUserId(null); }} />}

        {showImage && <ImageViewerModal imageUrl={showImage} onClose={() => setShowImage(null)} />}
        {showVideo && <VideoViewerModal videoUrl={showVideo} onClose={() => setShowVideo(null)} />}

        <MessageActionsPopup
          visible={actionPopup.visible}
          x={actionPopup.x}
          y={actionPopup.y}
          onClose={() => setActionPopup({ visible: false, x: 0, y: 0, msgId: undefined })}
          onReact={(emoji) => handleReact(emoji)}
          onReply={() => {
            const msg = messages.find((m) => m.id === actionPopup.msgId);
            if (msg) setReplyTo(msg);
            setActionPopup({ visible: false, x: 0, y: 0 });
          }}
          onCopy={() => {
            const msg = messages.find((m) => m.id === actionPopup.msgId);
            if (msg) navigator.clipboard.writeText(msg.content || "");
            setActionPopup({ visible: false, x: 0, y: 0 });
          }}
          onDelete={() => {
            const msg = messages.find((m) => m.id === actionPopup.msgId);
            if (!msg) return setActionPopup({ visible: false, x: 0, y: 0 });
            // allow delete only if admin or sender
            if (msg.sender_id === currentUser?.id || isAdmin) {
              deleteMessage(msg.id);
            } else {
              alert("Only the sender or group admin can delete this message for everyone.");
            }
          }}
        />
      </div>

      {/* Right: Members / Group Info */}
      <div className={`w-80 border-l border-blue-700/20 h-full transition-transform ${membersOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"} bg-white dark:bg-slate-900 hidden lg:block`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Members</h3>
            <span className="text-sm opacity-70">{members.length}</span>
          </div>

          <div className="space-y-3">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-blue-50/30 cursor-pointer" onClick={() => { setProfileUserId(m.id); setShowProfile(true); }}>
                <Image src={m.avatar_url || "/default-avatar.png"} alt={m.username} width={40} height={40} className="rounded-full" />
                <div className="flex-1">
                  <div className="font-medium">{m.username}</div>
                  <div className="text-xs opacity-60">{m.role}</div>
                </div>

                {/* admin actions (if current user is admin and clicking other members, you could show more actions — not implemented here) */}
                {isAdmin && m.id !== currentUser?.id && (
                  <div className="text-xs text-blue-500">admin</div>
                )}
              </div>
            ))}
          </div>

          {/* group settings (only for admin) */}
          {isAdmin && (
            <div className="mt-6">
              <h4 className="font-semibold mb-2">Group Settings</h4>
              <button className="w-full py-2 rounded-md bg-blue-600 text-white mb-2" onClick={() => router.push(`/g/${group_username}/settings`)}>
                Edit Group
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
