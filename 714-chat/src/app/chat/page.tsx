"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import ProfileModal from "@/components/ProfileModal";
import ChatHeader from "@/components/ChatHeader";
import ThemeToggle from "@/components/ThemeToggle";
import ImageViewerModal from "@/components/ImageViewerModal";
import EmojiPicker, { Theme } from "emoji-picker-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import styles from "./chat.module.css";
dayjs.extend(relativeTime);

// --- Types ---
type Message = {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  content: string;
  image_url?: string | null;
  audio_url?: string | null;
  parent_id?: string | null;
  created_at: string;
};

type Reaction = {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
};

// --- Component ---
export default function ChatPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [reactions, setReactions] = useState<Record<string, Reaction[]>>({});
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [gifResults, setGifResults] = useState<any[]>([]);
  const [showGifPicker, setShowGifPicker] = useState(false);

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0); // seconds
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<any>(null); // holds profile object from openUserProfile
  const [imageViewerUrl, setImageViewerUrl] = useState<string | null>(null);
  const recordingTimerRef = useRef<number | null>(null);

  const timeAgo = (d: string) => dayjs(d).fromNow();

  // --- openUserProfile uses existing logic (fetches profile object and sets selectedProfile) ---
  const openUserProfile = async (userId: string) => {
    try {
      if (!userId) {
        console.warn("⚠️ No userId provided to openUserProfile");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, wallet_address")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Supabase error:", error.message || error);
        return;
      }

      if (!data) {
        console.warn("⚠️ No profile found for userId:", userId);
        return;
      }

      setSelectedProfile(data);
    } catch (err: any) {
      console.error("Unexpected error loading profile:", err.message || err);
    }
  };

  const handleOpenProfile = useCallback(
    (id: string | null) => {
      if (id) openUserProfile(id);
    },
    [openUserProfile]
  );

  // --- Ensure buckets exist ---
  const ensureBucket = async (bucket: string) => {
    try {
      await supabase.storage.createBucket(bucket, { public: true });
    } catch {
      // ignore; bucket likely already exists
    }
  };

  // --- Initialize user & profile ---
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user;
      if (!sessionUser) {
        window.location.href = "/home";
        return;
      }
      setUser(sessionUser);

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", sessionUser.id)
        .single();
      setProfile(prof || null);

      await ensureBucket("chat-uploads");
      await ensureBucket("avatars");
      setLoading(false);
    };
    init();
  }, []);

  // --- Load messages & subscribe to realtime updates ---
  useEffect(() => {
    if (!user) return;

    const loadAndSubscribe = async () => {
      try {
        // Load initial messages
        const res = await fetch("/api/chat");
        if (!res.ok) throw new Error("Failed to fetch messages");
        const data = await res.json();
        setMessages(data || []);
        setFilteredMessages(data || []);
      } catch (err) {
        console.error("Error loading messages:", err);
      }

      // Realtime listener
      const channel = supabase
        .channel("public:messages") // Must match schema:table
        .on(
          "postgres_changes",
          {
            event: "*", // listen to INSERT, UPDATE, DELETE
            schema: "public",
            table: "messages",
          },
          (payload) => {
            const newMsg = payload.new as Message;
            const oldMsg = payload.old as Message;

            setMessages((prev) => {
              let updated = prev;
              switch (payload.eventType) {
                case "INSERT":
                  if (prev.some((m) => m.id === newMsg.id)) return prev;
                  updated = [...prev, newMsg];
                  break;
                case "UPDATE":
                  updated = prev.map((m) => (m.id === newMsg.id ? newMsg : m));
                  break;
                case "DELETE":
                  updated = prev.filter((m) => m.id !== oldMsg.id);
                  break;
                default:
                  updated = prev;
              }
              // Also keep filteredMessages in sync
              setFilteredMessages((fm) => {
                const input = (document.querySelector<HTMLInputElement>('[data-chat-search="true"]')?.value || "").trim();
                if (!input) return updated;
                const lower = input.toLowerCase();
                return updated.filter(
                  (msg) =>
                    (msg.username || "").toLowerCase().includes(lower) ||
                    (msg.content || "").toLowerCase().includes(lower)
                );
              });
              return updated;
            });

            // Auto-scroll when a new message appears
            setTimeout(() => {
              messagesRef.current?.scrollTo({
                top: messagesRef.current.scrollHeight,
                behavior: "smooth",
              });
            }, 100);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    loadAndSubscribe();
  }, [user]);

  // --- Load and subscribe to reactions ---
  useEffect(() => {
    if (!user) return;

    const loadReactions = async () => {
      const res = await fetch("/api/reactions");
      if (!res.ok) return;
      const data: Reaction[] = await res.json();

      const grouped = data.reduce((acc: Record<string, Reaction[]>, r) => {
        acc[r.message_id] = acc[r.message_id] || [];
        acc[r.message_id].push(r);
        return acc;
      }, {});
      setReactions(grouped);
    };
    loadReactions();

    const channel = supabase
      .channel("chat-reactions")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reactions" },
        (payload) => {
          const newReaction = payload.new as Reaction;
          setReactions((prev) => {
            const current = prev[newReaction.message_id] || [];
            return {
              ...prev,
              [newReaction.message_id]: [...current, newReaction],
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // --- Send Message ---
  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;
    if (!newMessage.trim() && !imageUrl && !audioUrl) return;

    const content = replyTo
      ? `↩️ ${replyTo.username}: ${replyTo.content}\n${newMessage}`
      : newMessage;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          username:
            profile?.username ||
            user.user_metadata?.full_name ||
            user.email.split("@")[0],
          avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || "",
          content,
          image_url: imageUrl || null,
          audio_url: audioUrl || null,
          parent_id: replyTo?.id || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Send message error:", err);
        return;
      }

      const newMsg = await res.json();
      setMessages((prev) => [...prev, newMsg]);
      setFilteredMessages((prev) => [...prev, newMsg]);
      setNewMessage("");
      setImageUrl(null);
      setAudioUrl(null);
      setReplyTo(null);
      setShowEmoji(false);
    } catch (err) {
      console.error("Send message failed:", err);
    }
  };

  // --- Image Upload ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);

    try {
      const bucket = "chat-uploads";
      await ensureBucket(bucket);
      const fileName = `${user.id}-${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from(bucket).upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      setImageUrl(data.publicUrl);
    } catch (err: any) {
      alert("Upload failed: " + (err?.message || err));
    } finally {
      setUploading(false);
    }
  };

  // --- Voice Recording (improved flow) ---
  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Microphone access not supported in this browser.");
      return;
    }

    try {
      // Try using permissions API if available (graceful fallback if not supported)
      if ((navigator as any).permissions && (navigator as any).permissions.query) {
        try {
          const perm = await (navigator as any).permissions.query({ name: "microphone" });
          if (perm.state === "denied") {
            alert("Microphone permission is blocked. Please enable it in your browser settings.");
            return;
          }
          // if prompt or granted, continue to request getUserMedia
        } catch {
          // ignore -- continue to getUserMedia
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!stream) {
        alert("Microphone not found or permission denied.");
        return;
      }

      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        // stop recording timer
        if (recordingTimerRef.current) {
          window.clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        setRecordingTime(0);

        // assemble blob
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });

        // small UX: create a local preview so user hears it while upload is happening
        const objectUrl = URL.createObjectURL(blob);

        // upload to supabase and set audioUrl (preserve existing send flow)
        const fileName = `${user.id}-voice-${Date.now()}.webm`;
        const bucket = "chat-uploads";

        try {
          setUploading(true);
          await ensureBucket(bucket);

          // supabase client can accept Blob directly
          const { error } = await supabase.storage.from(bucket).upload(fileName, blob, { upsert: true });
          if (error) throw error;
          const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
          setAudioUrl(data.publicUrl);

          // Send message now that audio_url is available (keep previous behavior)
          await sendMessage();
        } catch (err: any) {
          console.error("Voice upload failed", err);
          alert("Voice upload failed: " + (err?.message || err));
        } finally {
          setUploading(false);
          // revoke local object url after a short delay to avoid leaks
          setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
        }
      };

      // start recorder
      mr.start();
      setIsRecording(true);
      setRecordingTime(0);

      // start visual timer
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingTime((s) => s + 1);
      }, 1000);
    } catch (err: any) {
      console.error("startRecording error:", err);
      alert("Microphone access failed. Please allow microphone permissions.");
    }
  };

  const stopRecording = () => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    try {
      mr.stop();
      // stop all tracks (release mic)
      const tracks = (mr as any).stream?.getTracks?.();
      if (tracks && tracks.length) tracks.forEach((t: MediaStreamTrack) => t.stop());
    } catch (err) {
      console.warn("stopRecording error:", err);
    } finally {
      mediaRecorderRef.current = null;
      setIsRecording(false);
    }
  };

  // --- Play Audio ---
  const playAudio = (url: string) => {
    const audio = new Audio(url);
    audio.play().catch((e) => console.error(e));
  };

  // --- Scroll to bottom on new messages ---
  useEffect(() => {
    setTimeout(() => {
      messagesRef.current?.scrollTo({
        top: messagesRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 150);
  }, [messages.length]);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-white bg-black">
        Loading chat...
      </div>
    );

  const handleAddReaction = async (messageId: string) => {
    const emoji = prompt("React with emoji (e.g. 😍, 😂, 👍):");
    if (!emoji) return;

    const res = await fetch("/api/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message_id: messageId, user_id: user.id, emoji }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("Failed to add reaction:", err);
    }
  };

  // --- Search handler for ChatHeader ---
  const handleSearch = (term: string) => {
    const t = term.trim();
    if (!t) {
      setFilteredMessages(messages);
      return;
    }
    const lower = t.toLowerCase();
    const filtered = messages.filter(
      (m) =>
        (m.username || "").toLowerCase().includes(lower) ||
        (m.content || "").toLowerCase().includes(lower)
    );
    setFilteredMessages(filtered);
  };

  // small helper to format recording timer mm:ss
  const formatTime = (s: number) => {
    const mm = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const ss = Math.floor(s % 60)
      .toString()
      .padStart(2, "0");
    return `${mm}:${ss}`;
  };

  return (
    <div className={`min-h-screen flex flex-col bg-slate-900 text-white ${styles.chatContainer}`}>
      {/* Header */}
      <div className="w-full sticky top-0 z-30 backdrop-blur-sm bg-white/5 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <ChatHeader
            setSelectedProfile={(id: string | null) => {
              if (id) openUserProfile(id);
            }}
            currentUserId={user?.id}
            onSearch={handleSearch}
          />
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-6xl mx-auto h-full flex flex-col lg:flex-row gap-4 px-4 py-6">
          {/* Left / Chat panel */}
          <div className="flex-1 flex flex-col rounded-2xl overflow-hidden shadow-xl bg-[linear-gradient(180deg,_rgba(255,255,255,0.02),_rgba(255,255,255,0.01))]">
            {/* Messages area */}
            <div
              ref={messagesRef}
              className={`flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-700 ${styles.chatSpace}`}
              style={{ minHeight: 0 }}
            >
              {filteredMessages.length === 0 && (
                <div className="text-center text-gray-400 mt-12">
                  No messages yet — start the conversation!
                </div>
              )}

              {filteredMessages.map((msg) => {
                const mine = msg.user_id === user?.id;
                return (
                  <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`flex max-w-[85%] items-end gap-3 ${mine ? "flex-row-reverse text-right" : ""}`}>
                      {/* Avatar */}
                      <button
                        onClick={() => openUserProfile(msg.user_id)}
                        aria-label={`Open ${msg.username}'s profile`}
                        className="w-10 h-10 flex-shrink-0 rounded-full overflow-hidden ring-1 ring-white/5"
                      >
                        <img
                          src={msg.avatar_url || "/default-avatar.png"}
                          alt={`${msg.username || "User"} avatar`}
                          className="w-full h-full object-cover"
                        />
                      </button>

                      <div
                        className={`relative p-4 rounded-2xl shadow-md ${mine ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-br-none" : "bg-white/5 text-gray-100 rounded-bl-none"}`}
                        style={{ backdropFilter: "blur(8px)" }}
                      >
                        {!mine && (
                          <div
                            className="text-xs text-gray-300 font-semibold mb-1 cursor-pointer hover:text-blue-300"
                            onClick={() => openUserProfile(msg.user_id)}
                            role="button"
                          >
                            {msg.username}
                          </div>
                        )}

                        {/* Image (click to open viewer) */}
                        {msg.image_url && (
                          <div className="mb-2">
                            <Image
                              src={msg.image_url}
                              alt="upload"
                              width={360}
                              height={240}
                              className="rounded-lg mb-2 object-cover cursor-pointer"
                              onClick={() => setImageViewerUrl(msg.image_url || null)}
                            />
                          </div>
                        )}

                        {/* Audio */}
                        {msg.audio_url && (
                          <div className="mb-2 flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => playAudio(msg.audio_url!)}
                                className="px-3 py-1 rounded-md bg-white/6 hover:bg-white/10"
                              >
                                ▶️ Play
                              </button>
                              <span className="text-xs text-gray-300">Voice note</span>
                            </div>
                          </div>
                        )}

                        {/* Text */}
                        {msg.content && (
                          <p className="text-sm leading-snug whitespace-pre-wrap">
                            {msg.content}
                          </p>
                        )}

                        {/* Reactions */}
                        <div className="mt-3 flex items-center gap-2">
                          {(reactions[msg.id] || []).map((r) => (
                            <span key={r.id} className="text-lg">
                              {r.emoji}
                            </span>
                          ))}
                          <button onClick={() => handleAddReaction(msg.id)} className="text-gray-300 hover:text-yellow-400 text-sm">
                            ➕
                          </button>
                        </div>

                        <div className="mt-2 text-[11px] text-gray-400">
                          {timeAgo(msg.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sticky input area */}
            <div className="bg-white/3 border-t border-zinc-800 p-4">
              {replyTo && (
                <div className="bg-white/5 p-2 rounded-md mb-2 text-sm flex items-center justify-between">
                  <div>
                    Replying to <strong>{replyTo.username}</strong> —{" "}
                    <span className="italic">{replyTo.content.slice(0, 120)}</span>
                  </div>
                  <button className="ml-2 text-red-400 hover:text-red-300" onClick={() => setReplyTo(null)}>
                    ✖ Cancel
                  </button>
                </div>
              )}

              {/* preview image */}
              {imageUrl && (
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative w-28 h-20 rounded-md overflow-hidden">
                    <Image src={imageUrl} alt="preview" width={112} height={80} className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setImageUrl(null)}
                      className="absolute top-1 right-1 bg-black/60 text-white px-1 rounded"
                      aria-label="Remove image preview"
                    >
                      ✖
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={(e) => sendMessage(e)} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEmoji((v) => !v)}
                    className="p-2 rounded-md hover:bg-white/5"
                    aria-label="Emoji picker"
                  >
                    😊
                  </button>

                  <label className="cursor-pointer px-3 py-2 bg-white/5 rounded-md text-sm flex items-center gap-2">
                    Upload
                    <input type="file" accept="image/*,video/*" onChange={handleImageUpload} className="hidden" />
                  </label>

                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-500"
                      title="Start recording"
                    >
                      ◉
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="px-3 py-2 bg-red-400 text-white rounded-md hover:bg-red-300 flex items-center gap-2"
                      title="Stop recording"
                    >
                      ■ <span className="text-xs">{formatTime(recordingTime)}</span>
                    </button>
                  )}

                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-transparent border border-zinc-800 text-white rounded-full px-4 py-2 focus:outline-none"
                  />

                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-full font-semibold">
                    Send
                  </button>
                </div>

                {/* Recording indicator */}
                {isRecording && (
                  <div className="flex items-center gap-3 text-sm text-red-400">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                      Recording... <span className="ml-2 font-mono">{formatTime(recordingTime)}</span>
                    </div>
                  </div>
                )}

                {showEmoji && (
                  <div className="mt-2">
                    <EmojiPicker
                      onEmojiClick={(emojiData) => setNewMessage((prev) => prev + emojiData.emoji)}
                      theme={Theme.DARK}
                    />
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Right panel (optional: user list / info) - collapses on small screens */}
          <aside className="w-full lg:w-80 flex-shrink-0 hidden lg:flex flex-col gap-4">
            <div className="p-4 rounded-2xl bg-white/4 shadow-inner">
              <h4 className="text-sm text-gray-300 font-semibold mb-2">Active users</h4>
              {/* Placeholder - if you have presence logic, map it here */}
              <p className="text-xs text-gray-400">Online presence not configured</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/4">
              <h4 className="text-sm text-gray-300 font-semibold mb-2">Chat tips</h4>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Use <strong>↩️ reply</strong> to refer to messages</li>
                <li>• Press ◉ to record voice notes</li>
                <li>• Click avatars to view profiles</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>

      {/* Profile modal */}
      {selectedProfile && (
        <ProfileModal userId={selectedProfile.id} onClose={() => setSelectedProfile(null)} />
      )}

      {/* Image viewer overlay */}
      {imageViewerUrl && <ImageViewerModal imageUrl={imageViewerUrl} onClose={() => setImageViewerUrl(null)} />}
    </div>
  );
}
