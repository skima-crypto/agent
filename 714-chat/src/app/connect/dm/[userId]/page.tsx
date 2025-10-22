"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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

export default function DMPage() {
  const router = useRouter();
  const { userId } = useParams<{ userId: string }>();

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [friend, setFriend] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showImage, setShowImage] = useState<string | null>(null);
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
        .eq("id", userId)
        .single();
      setFriend(friendProfile);
    };
    loadUser();
  }, [userId]);

  // ✅ Load messages
  useEffect(() => {
    const loadMessages = async () => {
      if (!currentUser) return;
      const { data } = await supabase
        .from("direct_messages")
        .select("*")
        .or(
          `and(sender_id.eq.${currentUser.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUser.id})`
        )
        .order("created_at", { ascending: true });
      setMessages(data || []);
    };
    loadMessages();
  }, [currentUser, userId]);

// ✅ Subscribe realtime for direct messages
useEffect(() => {
  if (!currentUser) return;

  const channel = supabase
    .channel("direct_messages") // channel name can match the table name
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "direct_messages",
      },
      (payload) => {
        const msg = payload.new as any;

        // Only push messages related to this chat
        if (
          (msg.sender_id === userId && msg.receiver_id === currentUser.id) ||
          (msg.sender_id === currentUser.id && msg.receiver_id === userId)
        ) {
          setMessages((prev) => [...prev, msg]);
        }
      }
    )
    .subscribe();

  // Cleanup on unmount
  return () => {
    supabase.removeChannel(channel);
  };
}, [currentUser, userId]);


  // ✅ Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Send message
  const sendMessage = async (type = "text", content = newMessage) => {
    if (!content.trim()) return;
   const { error } = await supabase.from("direct_messages").insert({
      sender_id: currentUser.id,
      receiver_id: userId,
      content,
      type,
    });
    if (!error) setNewMessage("");
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
  };

  // ✅ Voice message upload
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

  // ✅ Camera capture
  const handleCameraCapture = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/*";
    (input as any).capture = "environment";
    input.onchange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target?.files?.[0]) {
    handleFileUpload({
      target,
    } as unknown as React.ChangeEvent<HTMLInputElement>);
  }
};

    input.click();
  };

  // ✅ Reaction & reply actions
  const handleMessageClick = (e: React.MouseEvent, msgId: string) => {
    e.preventDefault();
    setActionPopup({ visible: true, x: e.pageX, y: e.pageY, msgId });
  };

  const handleReact = (emoji: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === actionPopup.msgId
          ? { ...m, reactions: [...(m.reactions || []), emoji] }
          : m
      )
    );
    setActionPopup({ visible: false, x: 0, y: 0 });
  };

  const filteredMessages = searchMode
    ? messages.filter((m) =>
        m.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

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
        {filteredMessages.map((msg) => (
          <motion.div
            key={msg.id}
            onContextMenu={(e) => handleMessageClick(e, msg.id)}
            className={`flex flex-col ${
              msg.sender_id === currentUser?.id
                ? "items-end"
                : "items-start"
            }`}
          >
            {msg.type === "text" && (
              <div
                className={`max-w-xs px-4 py-2 rounded-2xl ${
                  msg.sender_id === currentUser?.id
                    ? "bg-blue-600 text-white"
                    : "bg-blue-950/50"
                }`}
              >
                {msg.content}
              </div>
            )}
            {msg.type === "image" && (
              <Image
                src={msg.content}
                alt="image"
                width={200}
                height={200}
                className="rounded-xl cursor-pointer"
                onClick={() => setShowImage(msg.content)}
              />
            )}
            {msg.type === "video" && (
              <video
                src={msg.content}
                controls
                className="rounded-xl max-w-xs"
              />
            )}
            {msg.type === "audio" && (
              <audio controls src={msg.content} className="rounded-md" />
            )}

            {msg.reactions && (
              <div className="flex gap-1 mt-1 text-lg">
                {msg.reactions.map((r: string, i: number) => (
                  <span key={i}>{r}</span>
                ))}
              </div>
            )}

            <span className="text-xs opacity-60 mt-1">
              {timeAgo(msg.created_at)}
            </span>
          </motion.div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* INPUT AREA */}
      <div className="flex items-center gap-2 p-3 border-t border-blue-700/30">
        <button onClick={handleCameraCapture}>
          <Camera className="text-blue-400" />
        </button>

        <input
          type="file"
          accept="image/*,video/*"
          onChange={handleFileUpload}
          className="hidden"
          id="fileUpload"
        />
        <label htmlFor="fileUpload">
          <Paperclip className="text-blue-400 cursor-pointer" />
        </label>

        <VoiceRecorder onRecorded={handleVoiceUpload} />

        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 rounded-full px-4 py-2 text-sm bg-blue-950/30 border border-blue-700/30 focus:ring focus:ring-blue-600"
        />
        <button
          onClick={() => sendMessage()}
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full"
        >
          <Send size={18} />
        </button>
      </div>

      {/* PROFILE MODAL */}
     {showProfile && (
  <ProfileModal
    userId={friend?.id || null}
    onClose={() => setShowProfile(false)}
  />
)}


      {/* IMAGE VIEWER */}
      {showImage && (
        <ImageViewerModal
          imageUrl={showImage}
          onClose={() => setShowImage(null)}
        />
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
        onReply={() => console.log("Reply clicked")}
        onCopy={() => navigator.clipboard.writeText("Message copied")}
      />
    </div>
  );
}
