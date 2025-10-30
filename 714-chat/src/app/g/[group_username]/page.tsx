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
        <a
          key={idx}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline break-words"
        >
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
  const [clientReady, setClientReady] = useState(false);

  useEffect(() => {
    if (group_username) setClientReady(true);
  }, [group_username]);

  if (!clientReady) return null;

  const [group, setGroup] = useState<any | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isMember, setIsMember] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
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
  const [membersOpen, setMembersOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const messageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (replyTo && messageInputRef.current) messageInputRef.current.focus();
  }, [replyTo]);

  // Load session, group, members, and membership status
  useEffect(() => {
    if (!group_username) return;
    let mounted = true;

    const loadEverything = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/dashboard");
        return;
      }
      setCurrentUser(user);

      // group by username
      const { data: grp } = await supabase
        .from("groups")
        .select("*")
        .eq("group_username", group_username)
        .single();

      if (!grp) {
        setGroup(null);
        setLoading(false);
        return;
      }
      if (!mounted) return;
      setGroup(grp);

      // check membership
      const { data: mem } = await supabase
        .from("group_members")
        .select("*")
        .eq("group_id", grp.id)
        .eq("user_id", user.id)
        .single();

      const member = !!mem;
      setIsMember(member);

      // if private and not member → gate
      if (grp.is_private && !member) {
        setLoading(false);
        return;
      }

      // members
      const { data: mems } = await supabase
        .from("group_members")
        .select("user_id, role, joined_at, profiles(id, username, avatar_url)")
        .eq("group_id", grp.id)
        .order("joined_at", { ascending: true });

      if (mems) {
        const normalized = mems.map((m: any) => ({
          id: m.profiles?.id || m.user_id,
          username: m.profiles?.username,
          avatar_url: m.profiles?.avatar_url,
          role: m.role,
          joined_at: m.joined_at,
        }));
        setMembers(normalized);
      }

      // load messages (members only)
      const { data: msgs } = await supabase
        .from("group_messages")
        .select("*")
        .eq("group_id", grp.id)
        .order("created_at", { ascending: true });

      const msgIds = (msgs || []).map((m) => m.id);
      let reactions: any[] = [];
      if (msgIds.length) {
        const { data: r } = await supabase
          .from("group_message_reactions")
          .select("*")
          .in("message_id", msgIds);
        reactions = r || [];
      }

      const mapById = new Map((msgs || []).map((m: any) => [m.id, m]));
      const safeMsgs = (msgs || []).map((m: any) => ({
        ...m,
        reactions: reactions.filter((r) => r.message_id === m.id).map((r) => r.emoji),
        reply_to_message: m.reply_to ? mapById.get(m.reply_to) || null : null,
      }));
      setMessages(safeMsgs);
      setLoading(false);
    };

    loadEverything();
    return () => {
      mounted = false;
    };
  }, [group_username, router]);

  // Realtime subscriptions (only if member)
  useEffect(() => {
    if (!group?.id || !isMember) return;

    const msgChannel = supabase.channel(`group-${group.id}-messages`);
    msgChannel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "group_messages", filter: `group_id=eq.${group.id}` },
      async (payload) => {
        const msg = payload.new as any;
        const old = payload.old as any;

        if (payload.eventType === "INSERT" && msg) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, { ...msg, reactions: [] }];
          });
        } else if (payload.eventType === "UPDATE" && msg) {
          setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, ...msg } : m)));
        } else if (payload.eventType === "DELETE" && old) {
          setMessages((prev) => prev.filter((m) => m.id !== old.id));
        }
      }
    );
    msgChannel.subscribe();

    const reactChannel = supabase.channel(`group-${group.id}-reactions`);
    reactChannel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "group_message_reactions" },
      async (payload) => {
        const r = payload.new as any;
        const old = payload.old as any;
        const messageId = r?.message_id || old?.message_id;
        if (!messageId) return;

        // check if message belongs to this group
        const msg = messages.find((m) => m.id === messageId);
        if (!msg || msg.group_id !== group.id) return;

        const { data: reactionRows } = await supabase
          .from("group_message_reactions")
          .select("emoji")
          .eq("message_id", messageId);
        const emojis = (reactionRows || []).map((e) => e.emoji);
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions: emojis } : m)));
      }
    );
    reactChannel.subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(reactChannel);
    };
}, [group?.id, isMember]); // ✅ remove messages

  useEffect(() => {
  if (messages.length && bottomRef.current) {
    bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }
}, [messages]);


  const currentProfile =
  currentUser && members.length
    ? members.find((m) => m.id === currentUser.id) || null
    : null;

  const isAdmin = currentProfile?.role === "admin" || group?.created_by === currentUser?.id;

  const sendMessage = async (type = "text", content = newMessage) => {
    if (!content?.trim() && type === "text") return;
    if (!group?.id || !currentUser) return;

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
    setMessages((p) => [...p, optimistic]);
    setNewMessage("");
    setReplyTo(null);

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
      console.error(error.message);
      setMessages((p) => p.filter((m) => m.id !== optimistic.id));
      return;
    }
    setMessages((p) => p.map((m) => (m.id === optimistic.id ? { ...inserted, reactions: [] } : m)));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    const ext = file.name.split(".").pop();
    const path = `group-uploads/${group?.id}/${currentUser.id}-${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage.from("chat-uploads").upload(path, file);
    if (error) return console.error(error);

    const { data: publicUrl } = supabase.storage.from("chat-uploads").getPublicUrl(data.path);
    const url = publicUrl.publicUrl;
    if (file.type.startsWith("video")) await sendMessage("video", url);
    else if (file.type.startsWith("audio")) await sendMessage("audio", url);
    else await sendMessage("image", url);
    e.target.value = "";
  };

  const handleVoiceUpload = async (file: File) => {
    if (!currentUser) return;
    const path = `group-uploads/${group?.id}/${currentUser.id}-${Date.now()}.webm`;
    const { data, error } = await supabase.storage.from("chat-uploads").upload(path, file);
    if (error) return console.error(error);
    const { data: publicUrl } = supabase.storage.from("chat-uploads").getPublicUrl(data.path);
    await sendMessage("audio", publicUrl.publicUrl);
  };

  const handleMessageClick = (e: React.MouseEvent, msgId: string) => {
    e.preventDefault();
    setActionPopup({ visible: true, x: e.pageX, y: e.pageY, msgId });
  };

  const handleReact = async (emoji: string) => {
    if (!actionPopup.msgId || !currentUser) return;
    const messageId = actionPopup.msgId;
    const { error } = await supabase
      .from("group_message_reactions")
      .insert({ message_id: messageId, user_id: currentUser.id, emoji });
    if (error) console.error(error.message);
    setMessages((p) =>
      p.map((m) =>
        m.id === messageId ? { ...m, reactions: [...(m.reactions || []), emoji] } : m
      )
    );
    setActionPopup({ visible: false, x: 0, y: 0 });
  };

  const removeReaction = async (messageId: string, emoji: string) => {
    if (!currentUser) return;
    const { error } = await supabase
      .from("group_message_reactions")
      .delete()
      .match({ message_id: messageId, user_id: currentUser.id, emoji });
    if (error) console.error(error.message);
  };

  const deleteMessage = async (messageId: string) => {
    if (!messageId || !currentUser) return;
    const { error } = await supabase.from("group_messages").delete().eq("id", messageId);
    if (error) console.error(error.message);
    setMessages((p) => p.filter((m) => m.id !== messageId));
  };

  const filteredMessages = searchMode
    ? messages.filter((m) =>
        (m.content || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  const profileFor = (senderId: string) =>
    members.find((m) => m.id === senderId) || {
      avatar_url: "/default-avatar.png",
      username: "Unknown",
    };

  // 🚪 Access gate (non-members)
  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-blue-400">
        Loading group...
      </div>
    );

  if (group?.is_private && !isMember)
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center px-4">
        <Image
          src="/default-group.png"
          width={96}
          height={96}
          alt="Group"
          className="rounded-full mb-4 border"
        />
        <h2 className="text-2xl font-semibold mb-2">{group.display_name}</h2>
        <p className="text-blue-400 mb-4">
          You are not a member yet. Ask the admin to invite you!
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          Go Back
        </button>
      </div>
    );

  // ✅ Chat UI (unchanged structure, new behaviors included)
  return (
    <div
      className={`flex h-screen ${
        theme === "dark"
          ? "bg-gradient-to-b from-blue-950 to-blue-900 text-blue-100"
          : "bg-white text-slate-900"
      }`}
    >
            {/* Chat section (messages + input) */}
      <div className="flex-1 flex flex-col relative">
        {/* Top bar */}
        <div
          className={`flex items-center justify-between px-4 py-3 border-b ${
            theme === "dark" ? "border-blue-800" : "border-gray-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/dashboard")}>
              <ArrowLeft size={22} />
            </button>
            <Image
  src={group?.avatar_url || "/default-group.png"}
  alt={group?.display_name || "Group"}
  width={36}
  height={36}
  className="rounded-full border"
/>

            <div>
              <h2 className="font-semibold text-lg">{group.display_name}</h2>
              <p className="text-xs text-blue-400">
                {members.length} members
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setSearchMode(!searchMode)}>
              <Search size={20} />
            </button>
            <button onClick={() => setMembersOpen(!membersOpen)}>
              <Users size={20} />
            </button>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>

        {/* Search bar */}
        {searchMode && (
          <div className="px-3 py-2 border-b border-blue-800">
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-blue-950 text-blue-100 outline-none"
            />
          </div>
        )}

        {/* Messages container */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
          {filteredMessages.map((msg) => {
            const isOwn = msg.sender_id === currentUser?.id;
            const profile = profileFor(msg.sender_id);
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2 ${
                  isOwn ? "justify-end text-right" : "justify-start text-left"
                }`}
                onContextMenu={(e) => handleMessageClick(e, msg.id)}
              >
                {/* Avatar (click to open profile modal) */}
               {!isOwn && (
  <Image
    src={profile?.avatar_url || "/default-avatar.png"}
    alt={profile?.username || "Unknown"}
    width={36}
    height={36}
    className="rounded-full cursor-pointer hover:opacity-80"
    onClick={() => {
      setProfileUserId(msg.sender_id);
      setShowProfile(true);
    }}
  />
)}

                {/* Message bubble */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`max-w-[75%] px-3 py-2 rounded-2xl shadow ${
                    isOwn
                      ? "bg-blue-700 text-blue-50 rounded-br-none"
                      : "bg-blue-950 text-blue-100 rounded-bl-none"
                  }`}
                >
                  {/* Reply preview */}
                  {msg.reply_to_message && (
                    <div className="text-xs text-blue-300 mb-1 border-l-2 border-blue-500 pl-2">
                      Replying to{" "}
                      <span className="font-semibold">
                        {profileFor(msg.reply_to_message.sender_id).username}
                      </span>
                      :{" "}
                      {msg.reply_to_message.content?.slice(0, 50) || "media"}
                    </div>
                  )}

                  {/* Message content */}
                  {msg.type === "text" && (
                    <div className="break-words">{renderMessageContent(msg.content)}</div>
                  )}
                  {msg.type === "image" && msg.image_url && (
                    <Image
                      src={msg.image_url}
                      alt="sent image"
                      width={240}
                      height={240}
                      className="rounded-xl mt-1 cursor-pointer"
                      onClick={() => setShowImage(msg.image_url)}
                    />
                  )}
                  {msg.type === "video" && msg.image_url && (
                    <video
                      src={msg.image_url}
                      controls
                      className="rounded-xl mt-1 max-h-64 cursor-pointer"
                      onClick={() => setShowVideo(msg.image_url)}
                    />
                  )}
                  {msg.type === "audio" && msg.audio_url && (
                    <audio
                      src={msg.audio_url}
                      controls
                      className="mt-1 w-full"
                    />
                  )}

                  {/* Reactions */}
                  {msg.reactions?.length > 0 && (
  <div className="flex gap-1 mt-1">
    {msg.reactions.map((r: string, i: number) => (
      <span
        key={i}
        onClick={() => removeReaction(msg.id, r)}
        className="text-sm bg-blue-800/50 rounded-md px-1 cursor-pointer hover:bg-blue-700/80"
      >
        {r}
      </span>
    ))}
  </div>
)}


                  {/* Timestamp */}
                  <p className="text-[10px] text-blue-300 mt-1">
                    {timeAgo(msg.created_at)}
                  </p>
                </motion.div>

                {isOwn && (
  <Image
    src={profile?.avatar_url || "/default-avatar.png"}
    alt={profile?.username || "Unknown"}
    width={36}
    height={36}
    className="rounded-full cursor-pointer hover:opacity-80"
    onClick={() => {
      setProfileUserId(msg.sender_id);
      setShowProfile(true);
    }}
  />
)}

              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Reply preview bar */}
        {replyTo && (
          <div className="p-2 border-t border-blue-800 bg-blue-950 flex justify-between items-center">
            <div className="text-sm text-blue-300 truncate">
              Replying to {profileFor(replyTo.sender_id).username}:{" "}
              {replyTo.content?.slice(0, 50) || "media"}
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="text-xs text-blue-400 hover:text-blue-200"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Message input */}
        <div
          className={`flex items-center gap-2 p-3 border-t ${
            theme === "dark" ? "border-blue-800" : "border-gray-200"
          }`}
        >
          <button onClick={() => fileInputRef.current?.click()}>
            <Paperclip size={22} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            hidden
            accept="image/*,video/*"
            onChange={handleFileUpload}
          />

          <button onClick={() => cameraInputRef.current?.click()}>
            <Camera size={22} />
          </button>
          <input
            type="file"
            ref={cameraInputRef}
            hidden
            accept="image/*,video/*"
            capture="environment"
            onChange={handleFileUpload}
          />

          <button>
            <Mic size={22} />
          </button>

          <input
            ref={messageInputRef}
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className={`flex-1 px-3 py-2 rounded-md outline-none ${
              theme === "dark"
                ? "bg-blue-950 text-blue-100"
                : "bg-gray-100 text-slate-900"
            }`}
          />
          <button
            onClick={() => sendMessage()}
            className="bg-blue-700 hover:bg-blue-600 text-white rounded-md p-2"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Members sidebar */}
      {membersOpen && (
        <div
          className={`w-64 border-l ${
            theme === "dark" ? "border-blue-800 bg-blue-950" : "border-gray-200 bg-white"
          } overflow-y-auto`}
        >
          <h3 className="text-lg font-semibold px-4 py-3 border-b border-blue-800">
            Members
          </h3>
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-blue-800/40"
              onClick={() => {
                setProfileUserId(m.id);
                setShowProfile(true);
              }}
            >
              <Image
  src={m?.avatar_url || "/default-avatar.png"}
  alt={m?.username || "Unknown"}
  width={32}
  height={32}
  className="rounded-full"
/>

              <div>
                <p className="font-medium">{m.username}</p>
                <p className="text-xs text-blue-400">{m.role}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action popup */}
{actionPopup.visible && (
  <MessageActionsPopup
    visible={actionPopup.visible}
    x={actionPopup.x}
    y={actionPopup.y}
    onClose={() => setActionPopup({ visible: false, x: 0, y: 0 })}
    onReact={handleReact}
    onReply={() => {
      const msg = messages.find((m) => m.id === actionPopup.msgId);
      setReplyTo(msg || null);
      setActionPopup({ visible: false, x: 0, y: 0 });
    }}
    onCopy={() => {
      const msg = messages.find((m) => m.id === actionPopup.msgId);
      if (msg?.content) {
        navigator.clipboard.writeText(msg.content);
      }
      setActionPopup({ visible: false, x: 0, y: 0 });
    }}
    onDelete={() => {
      if (!actionPopup.msgId) return;
      deleteMessage(actionPopup.msgId);
      setActionPopup({ visible: false, x: 0, y: 0 });
    }}
    showDelete={true}
  />
)}


      {/* Modals */}
      {showProfile && profileUserId && (
        <ProfileModal
          userId={profileUserId}
          onClose={() => setShowProfile(false)}
        />
      )}

      {showImage && (
        <ImageViewerModal
          imageUrl={showImage}
          onClose={() => setShowImage(null)}
        />
      )}
      {showVideo && (
        <VideoViewerModal
          videoUrl={showVideo}
          onClose={() => setShowVideo(null)}
        />
      )}
    </div>
  );
}
