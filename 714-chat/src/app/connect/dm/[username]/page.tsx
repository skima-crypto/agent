"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Send,
  Paperclip,
  Mic,
  Camera,
  Sun,
  Moon,
  ArrowLeft,
  Search,
} from "lucide-react";
import dynamic from "next/dynamic";

import ProfileModal from "@/components/ProfileModal";
import ImageViewerModal from "@/components/ImageViewerModal";
import VideoViewerModal from "@/components/VideoViewerModal";
import MessageActionsPopup from "@/components/MessageActionsPopup";
import VoiceRecorder from "@/components/VoiceRecorder";

// Lazy-load emoji picker to prevent SSR errors
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

// ⏱️ Utility to format relative time
const timeAgo = (timestamp: string) => {
  const now = new Date();
  const past = new Date(timestamp);
  const diff = (now.getTime() - past.getTime()) / 1000;

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo ago`;
  return `${Math.floor(diff / 31536000)}y ago`;
};

// Regex to detect URLs (simple, robust enough for messages)
const urlRegex = /((https?:\/\/|www\.)[^\s/$.?#].[^\s]*)/gi;

// Renders message text, converting urls to clickable links
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
    } else {
      return <span key={idx}>{part}</span>;
    }
  });
};

export default function DMPage() {
  const router = useRouter();
  const { username } = useParams<{ username: string }>();
  const [reactions, setReactions] = useState<any[]>([]);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [friend, setFriend] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showImage, setShowImage] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionPopup, setActionPopup] = useState<{
    visible: boolean;
    x: number;
    y: number;
    msgId?: string;
  }>({ visible: false, x: 0, y: 0 });

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const messageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
  if (replyTo && messageInputRef.current) {
    messageInputRef.current.focus();
  }
}, [replyTo]);


  // ✅ Session check & load user + friend
  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/home");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setCurrentUser(profile);

      const { data: friendProfile } = await supabase
  .from("profiles")
  .select("*")
  .eq("username", username)
  .single();

      setFriend(friendProfile);
    };
    loadUser();
  }, [username]);

// ---------- realtime subscription for messages (replace the messages realtime useEffect) ----------
useEffect(() => {
  if (!currentUser?.id || !friend?.id) return;

  // subscribe only to rows where either participant is sender or receiver (filter on both columns)
  const filter = `sender_id=in.(${currentUser.id},${friend.id}),receiver_id=in.(${currentUser.id},${friend.id})`;
  const channelName = `dm-${[currentUser.id, friend.id].sort().join("-")}`;

  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "direct_messages",
        // use filter expression to reduce noise; fallback works if your DB/user policy allows
        filter: `sender_id=eq.${currentUser.id}`
      },
      (payload) => {
        // payload.eventType is like "INSERT", "UPDATE", "DELETE"
        const msg = (payload.new || payload.old) as any;

        // only handle direct messages between the two parties
        if (
          !msg ||
          !(
            (msg.sender_id === currentUser.id && msg.receiver_id === friend.id) ||
            (msg.sender_id === friend.id && msg.receiver_id === currentUser.id)
          )
        ) {
          return;
        }

        if (payload.eventType === "INSERT") {
          setMessages((prev) =>
            prev.some((m) => m.id === msg.id) ? prev : [...prev, { ...msg, reactions: msg.reactions || [] }]
          );
        } else if (payload.eventType === "UPDATE") {
          setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, ...msg } : m)));
        } else if (payload.eventType === "DELETE") {
          setMessages((prev) => prev.filter((m) => m.id !== (payload.old as any)?.id));
        }
      }
    )
    .subscribe();

  return () => {
    // safer: unsubscribe this channel explicitly
    try {
      channel.unsubscribe();
    } catch (e) {
      // fallback
      supabase.removeChannel(channel);
    }
  };
}, [currentUser?.id, friend?.id]);

// ---------- realtime subscription for reactions (replace existing reactions useEffect) ----------
useEffect(() => {
  if (!currentUser?.id || !friend?.id) return;

  const channel = supabase
    .channel("dm-reactions-global")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "direct_message_reactions",
      },
      async (payload) => {
        const reactionNew = payload.new as any;
        const reactionOld = payload.old as any;

        if (payload.eventType === "INSERT" && reactionNew?.message_id) {
          const messageId = reactionNew.message_id;

          // If we already have the message in memory, update it
          let found = false;
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id === messageId) {
                found = true;
                return { ...m, reactions: [...(m.reactions || []), reactionNew.emoji] };
              }
              return m;
            })
          );

          // If we didn't have the message (maybe the other user's UI didn't fetch messages yet), fetch that single message and append it
          if (!found) {
            const { data: msgRows, error } = await supabase
              .from("direct_messages")
              .select(`
                *,
                reply_to_message:direct_messages!direct_messages_reply_to_fkey (
                  id, content, type, sender_id, created_at
                )
              `)
              .eq("id", messageId)
              .single();
            if (!error && msgRows) {
              setMessages((prev) => [...prev, { ...msgRows, reactions: [reactionNew.emoji] }]);
            }
          }
        } else if (payload.eventType === "DELETE" && reactionOld?.message_id) {
          const messageId = reactionOld.message_id;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId
                ? { ...m, reactions: (m.reactions || []).filter((r: string) => r !== reactionOld.emoji) }
                : m
            )
          );
        }
      }
    )
    .subscribe();

  return () => {
    try {
      channel.unsubscribe();
    } catch (e) {
      supabase.removeChannel(channel);
    }
  };
}, [currentUser?.id, friend?.id]);


  // ✅ Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Send message
// ---------- sendMessage (replace the existing function) ----------
const sendMessage = async (type = "text", content = newMessage) => {
  if (type === "text" && !content?.trim()) return;

  if (!currentUser?.id || !friend?.id) {
    console.warn("Missing participant IDs, abort send");
    return;
  }

  // Build insert object
  const insertObj: any = {
    sender_id: currentUser.id,
    receiver_id: friend.id,
    type,
    reply_to: replyTo?.id || null,
    sender_username: currentUser.username || null,
    receiver_username: friend.username || null,
  };
  if (type === "text") insertObj.content = content;
  if (type === "image" || type === "video") insertObj.image_url = content;
  if (type === "audio") insertObj.audio_url = content;

  // Insert but request the same joined reply_to fields so the shape matches loadMessages
  const { data: inserted, error } = await supabase
    .from("direct_messages")
    .insert(insertObj)
    .select(`
      *,
      reply_to_message:direct_messages!direct_messages_reply_to_fkey (
        id, content, type, sender_id, created_at
      )
    `)
    .single();

  if (error) {
    console.error("Send error:", error);
    return;
  }

  // Inserted should be a full message row (with reply_to_message if present)
  setMessages((prev) => [...prev, { ...inserted, reactions: inserted.reactions || [] }]);
  setNewMessage("");
  setReplyTo(null);
};


  // ✅ Upload file/video/image
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    const ext = file.name.split(".").pop();
    const path = `${currentUser.id}/${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from("chat-uploads")
      .upload(path, file);

    if (error) return console.error(error);

    const { data: publicUrl } = supabase.storage
      .from("chat-uploads")
      .getPublicUrl(data.path);

    await sendMessage(file.type.startsWith("video") ? "video" : "image", publicUrl.publicUrl);
    // reset input
    if (e.target) e.target.value = "";
  };

  // ✅ Voice message upload (called by VoiceRecorder)
  const handleVoiceUpload = async (file: File) => {
    const path = `${currentUser.id}/${Date.now()}.webm`;
    const { data, error } = await supabase.storage
      .from("chat-uploads")
      .upload(path, file);
    if (error) return console.error(error);
    const { data: publicUrl } = supabase.storage
      .from("chat-uploads")
      .getPublicUrl(data.path);
    await sendMessage("audio", publicUrl.publicUrl);
  };

  // ✅ Camera capture using input capture (works well on mobile)
  const handleCameraCaptureClick = () => {
    // trigger hidden input that has capture="environment"
    cameraInputRef.current?.click();
  };

  // ✅ Reaction & reply actions
  const handleMessageClick = (e: React.MouseEvent, msgId: string) => {
    e.preventDefault();
    setActionPopup({ visible: true, x: e.pageX, y: e.pageY, msgId });
  };

  const handleReact = async (emoji: string) => {
  if (!actionPopup.msgId || !currentUser) return;
  const messageId = actionPopup.msgId;

  // ✅ Save to Supabase
  const { error } = await supabase
    .from("direct_message_reactions")
    .insert({
      message_id: messageId,
      user_id: currentUser.id,
      emoji,
    });

  if (error) {
    console.error("Reaction error:", error.message);
    return;
  }

  // ✅ Update UI instantly
  setMessages((prev) =>
    prev.map((m) =>
      m.id === messageId
        ? { ...m, reactions: [...(m.reactions || []), emoji] }
        : m
    )
  );

  setActionPopup({ visible: false, x: 0, y: 0 });
};


  const filteredMessages = searchMode
    ? messages.filter((m) =>
        (m.content || "")
          .toString()
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    : messages;

  // convenience to get avatar for a message sender (only two participants)
  const avatarFor = (senderId: string) =>
    senderId === currentUser?.id ? currentUser?.avatar_url : friend?.avatar_url;

  return (
    <div
      className={`flex flex-col min-h-screen ${
        theme === "dark"
          ? "bg-gradient-to-b from-blue-950 to-blue-900 text-blue-100"
          : "bg-gray-50 text-gray-800"
      }`}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-blue-700/30">
        <div className="flex items-center gap-3">
          <ArrowLeft
            onClick={() => router.back()}
            className="cursor-pointer hover:text-blue-400"
          />
          <Image
            src={friend?.avatar_url || "/default-avatar.png"}
            alt={friend?.username || ""}
            width={40}
            height={40}
            className="rounded-full cursor-pointer border border-blue-500/40"
            onClick={() => setShowProfile(true)}
          />
          <h2 className="font-semibold text-lg">{friend?.username}</h2>
        </div>

        <div className="flex items-center gap-3">
          <Search
            onClick={() => setSearchMode((s) => !s)}
            className="cursor-pointer hover:text-blue-400"
          />
          {theme === "dark" ? (
            <Sun
              onClick={() => setTheme("light")}
              className="cursor-pointer hover:text-yellow-400"
            />
          ) : (
            <Moon
              onClick={() => setTheme("dark")}
              className="cursor-pointer hover:text-blue-500"
            />
          )}
        </div>
      </div>

      {/* SEARCH BAR */}
      {searchMode && (
        <div className="p-3 border-b border-blue-700/20">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm bg-blue-950/30 border border-blue-700/30 focus:ring focus:ring-blue-600"
          />
        </div>
      )}

     {/* MESSAGES */}
<div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
  {filteredMessages.map((msg) => {
    const isMe = msg.sender_id === currentUser?.id;
    const repliedMsg = msg.reply_to_message; // 🆕 the message being replied to

    return (
      <motion.div
        key={msg.id}
        onContextMenu={(e) => handleMessageClick(e, msg.id)}
        className={`flex items-start gap-3 ${
          isMe ? "justify-end" : "justify-start"
        }`}
      >
        {/* avatar left for friend, right for me */}
        {!isMe && (
          <div className="w-10 h-10 shrink-0">
            <Image
              src={avatarFor(msg.sender_id) || "/default-avatar.png"}
              alt="avatar"
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
          </div>
        )}

        {/* message bubble */}
        <div className={`flex flex-col max-w-[70%]`}>
          
          {/* 🧩 REPLY PREVIEW (if this message replies to another) */}
          {repliedMsg && (
            <div
              className={`text-xs p-2 mb-1 rounded-lg border-l-4 ${
                isMe
                  ? "border-blue-300 bg-blue-700/30 text-blue-100"
                  : "border-blue-500 bg-blue-950/40 text-blue-200"
              }`}
            >
              <span className="opacity-70">
                Replying to{" "}
                <span className="font-semibold">
                  {repliedMsg.sender_id === currentUser?.id
                    ? "You"
                    : friend?.username}
                </span>
              </span>
              <div className="truncate italic mt-1 opacity-80">
                {repliedMsg.content
                  ? repliedMsg.content
                  : `[${repliedMsg.type}]`}
              </div>
            </div>
          )}

          {/* 💬 The main message bubble */}
          {msg.type === "text" && (
            <div
              className={`px-4 py-2 rounded-2xl break-words ${
                isMe
                  ? "bg-blue-600 text-white self-end"
                  : "bg-blue-950/50 text-blue-100"
              }`}
            >
              {renderMessageContent(msg.content)}
            </div>
          )}

          {msg.type === "image" && msg.image_url && (
            <div className="rounded-xl overflow-hidden">
              <Image
                src={msg.image_url}
                alt="image"
                width={300}
                height={300}
                className="rounded-xl cursor-pointer object-cover"
                onClick={() => setShowImage(msg.image_url)}
              />
            </div>
          )}

          {msg.type === "video" && msg.image_url && (
            <div className="rounded-xl overflow-hidden cursor-pointer">
              <video
                src={msg.image_url}
                className="rounded-xl max-w-full"
                onClick={() => setShowVideo(msg.image_url)}
                controls={false}
                muted
                playsInline
              />
            </div>
          )}

          {msg.type === "audio" && msg.audio_url && (
            <audio controls src={msg.audio_url} className="rounded-md mt-1" />
          )}

          {/* 💟 Reactions */}
          {msg.reactions && (
            <div className="flex gap-1 mt-1 text-lg">
              {msg.reactions.map((r: string, i: number) => (
                <span key={i}>{r}</span>
              ))}
            </div>
          )}

          {/* ⏱️ Time */}
          <span className="text-xs opacity-60 mt-1">
            {timeAgo(msg.created_at)}
          </span>
        </div>

        {/* avatar right for me */}
        {isMe && (
          <div className="w-10 h-10 shrink-0">
            <Image
              src={avatarFor(msg.sender_id) || "/default-avatar.png"}
              alt="avatar"
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
          </div>
        )}
      </motion.div>
    );
  })}

  <div ref={bottomRef} />
</div>


      {/* ✅ Reply Preview Bar */}
{replyTo && (
  <div className="p-2 bg-blue-900/40 text-sm border-l-4 border-blue-400 mb-1 rounded-md flex justify-between items-center mx-3">
    <span className="truncate">
      Replying to: {replyTo.content || replyTo.type}
    </span>
    <button
      onClick={() => setReplyTo(null)}
      className="text-xs text-blue-300 hover:underline"
    >
      cancel
    </button>
  </div>
)}


      {/* INPUT AREA (unified bubble) */}
      <div className="p-3 border-t border-blue-700/30">
        <div className="flex items-center gap-2 w-full">
          <div className="flex items-center gap-2 flex-1 bg-blue-950/20 border border-blue-700/40 rounded-full px-3 py-2">
            {/* camera (hidden input with capture) */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*,video/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
              id="cameraCapture"
            />
            <button
              type="button"
              onClick={handleCameraCaptureClick}
              aria-label="Open camera"
              className="p-2 rounded-full hover:bg-blue-900/40"
            >
              <Camera className="text-blue-300" />
            </button>

            {/* attachment input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,audio/*"
              onChange={handleFileUpload}
              className="hidden"
              id="fileUpload"
            />
            <label htmlFor="fileUpload" className="p-2 rounded-full hover:bg-blue-900/40 cursor-pointer">
              <Paperclip className="text-blue-300" />
            </label>

            {/* mic recorder */}
            <VoiceRecorder onRecorded={handleVoiceUpload} />

            {/* message text field (grows) */}
            <input
  ref={messageInputRef}
  type="text"
  placeholder="Type a message..."
  value={newMessage}
  onChange={(e) => setNewMessage(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }}
  className="flex-1 bg-transparent outline-none px-3 text-sm"
/>


            {/* send button */}
            <button
              onClick={() => {
                sendMessage();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full"
              aria-label="Send"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* PROFILE MODAL */}
      {showProfile && (
        <ProfileModal userId={friend?.id || null} onClose={() => setShowProfile(false)} />
      )}

      {/* IMAGE VIEWER */}
      {showImage && (
        <ImageViewerModal imageUrl={showImage} onClose={() => setShowImage(null)} />
      )}

      {/* VIDEO VIEWER */}
      {showVideo && (
        <VideoViewerModal videoUrl={showVideo} onClose={() => setShowVideo(null)} />
      )}

      {/* MESSAGE ACTIONS */}
      <MessageActionsPopup
  visible={actionPopup.visible}
  x={actionPopup.x}
  y={actionPopup.y}
  onClose={() =>
    setActionPopup({ visible: false, x: 0, y: 0, msgId: undefined })
  }
  onReact={handleReact}
  onReply={() => {
    const msg = messages.find((m) => m.id === actionPopup.msgId);
    if (msg) setReplyTo(msg);
    setActionPopup({ visible: false, x: 0, y: 0 });
  }}
  onCopy={() => navigator.clipboard.writeText("Message copied")}
/>
    </div>
  );
}
