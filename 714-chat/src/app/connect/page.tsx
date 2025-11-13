"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Search, Loader2, X, PlusCircle } from "lucide-react";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";

// ✅ NEW
import GroupConnect from "./group";

interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  online?: boolean;
}

interface Group {
  id: string;
  group_username: string;
  display_name: string;
  avatar_url: string | null;
  description: string | null;
  created_by: string;
}

interface ChatPreview {
  id: string;
  friend: Profile;
  lastMessage: string;
  unreadCount: number;
}

export default function ConnectPage() {
  const [section, setSection] = useState<"chats" | "groups">("chats");

  const [friends, setFriends] = useState<ChatPreview[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);

  // ✅ Global search
  const [globalSearch, setGlobalSearch] = useState("");
  const [userResults, setUserResults] = useState<Profile[]>([]);
  const [groupResults, setGroupResults] = useState<Group[]>([]);

  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const router = useRouter();

  // ✅ Lazy load create group page
  const CreateGroupPage = dynamic(() => import("@/app/g/create/page"), { ssr: false });

  useEffect(() => {
    loadUserAndChats();
    subscribeToPresence();
  }, []);

  // ✅ Listen for modal close event from inside the CreateGroupPage
  useEffect(() => {
    const closeListener = () => setShowCreateModal(false);
    window.addEventListener("close-create-modal", closeListener);
    return () => window.removeEventListener("close-create-modal", closeListener);
  }, []);

  // ✅ Fetch user + chats
  const loadUserAndChats = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/dashboard");
      return;
    }

    // fetch user profile
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setCurrentUser(userProfile);

    // fetch all messages involving user
    const { data: messages } = await supabase
      .from("direct_messages")
      .select(
        `
      id,
      sender_id,
      receiver_id,
      content,
      type,
      created_at,
      sender:sender_id ( id, username, avatar_url ),
      receiver:receiver_id ( id, username, avatar_url )
      `
      )
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    const chatMap: Record<string, ChatPreview> = {};

    for (const msg of messages || []) {
      const sender = Array.isArray(msg.sender) ? msg.sender[0] : msg.sender;
      const receiver = Array.isArray(msg.receiver) ? msg.receiver[0] : msg.receiver;

      const isSender = msg.sender_id === user.id;
      const friend = isSender ? receiver : sender;

      if (!friend) continue;

      if (!chatMap[friend.id]) {
        chatMap[friend.id] = {
          id: friend.id,
          friend,
          lastMessage:
            msg.type === "text"
              ? msg.content
              : msg.type === "image"
              ? "📷 Photo"
              : msg.type === "audio"
              ? "🎤 Audio"
              : msg.type === "video"
              ? "🎞️ Video"
              : "Message",
          unreadCount: 0,
        };
      }
    }

    setFriends(Object.values(chatMap));
    setLoading(false);
  };

  // ✅ Presence tracking
  const subscribeToPresence = async () => {
    supabase.channel("presence").subscribe();
  };

  // ✅ GLOBAL SEARCH: Users + Groups
  const handleGlobalSearch = async (query: string) => {
    setGlobalSearch(query);

    if (query.trim().length < 2) {
      setUserResults([]);
      setGroupResults([]);
      return;
    }

    // 🔎 search profiles
    const { data: users } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .ilike("username", `%${query}%`)
      .limit(20);

    setUserResults(users || []);

    // 🔎 search groups
    const { data: groups } = await supabase
      .from("groups")
      .select("id, group_username, display_name, avatar_url, created_by, description")
      .ilike("display_name", `%${query}%`)
      .limit(20);

    setGroupResults(groups || []);
  };

  const openChat = (username: string) => {
    router.push(`/connect/dm/${username}`);
  };

  const openGroup = (groupUsername: string) => {
    router.push(`/g/${groupUsername}`);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-blue-950 to-blue-900 text-blue-100">
      <Sidebar />

      <main className="flex-1 overflow-y-auto px-6 py-8 lg:ml-64">
        <h1 className="text-3xl font-extrabold mb-6 text-white tracking-tight">
          Connect
        </h1>

        {/* ✅ Section Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setSection("chats")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition 
            ${section === "chats" ? "bg-blue-700 text-white" : "bg-blue-950/40"}`}
          >
            Chats
          </button>

          <button
            onClick={() => setSection("groups")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition 
            ${section === "groups" ? "bg-blue-700 text-white" : "bg-blue-950/40"}`}
          >
            Groups
          </button>
        </div>

        {/* ✅ Global Search */}
        <div className="relative mb-8">
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => handleGlobalSearch(e.target.value)}
            placeholder="Search users or groups..."
            className="w-full rounded-xl bg-blue-950/40 border border-blue-700/30 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder:text-blue-300"
          />
          <Search className="absolute right-4 top-3.5 text-blue-400" size={18} />
        </div>

        {/* ✅ GLOBAL SEARCH RESULTS */}
        {globalSearch.length > 1 && (
          <div className="mb-10 space-y-8">
            {/* Users */}
            <div>
              <h2 className="text-lg font-semibold text-blue-300 mb-2">Users</h2>

              {userResults.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userResults.map((u) => (
                    <motion.div
                      key={u.id}
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center justify-between p-4 bg-blue-950/40 border border-blue-700/40 rounded-xl hover:bg-blue-800/40 cursor-pointer"
                      onClick={() => openChat(u.username)}
                    >
                      <div className="flex items-center gap-3">
                        <Image
                          src={u.avatar_url || "/default-avatar.png"}
                          width={40}
                          height={40}
                          alt={u.username}
                          className="rounded-full"
                        />
                        <span>{u.username}</span>
                      </div>
                      <span className="text-xs text-blue-400">Chat</span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-blue-300 italic">No matching users.</p>
              )}
            </div>

            {/* Groups */}
            <div>
              <h2 className="text-lg font-semibold text-blue-300 mb-2">Groups</h2>

              {groupResults.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupResults.map((g) => (
                    <motion.div
                      key={g.id}
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center justify-between p-4 bg-blue-950/40 border border-blue-700/40 rounded-xl hover:bg-blue-800/40 cursor-pointer"
                      onClick={() => openGroup(g.group_username)}
                    >
                      <div className="flex items-center gap-3">
                        <Image
                          src={g.avatar_url || "/default-group.png"}
                          width={40}
                          height={40}
                          alt={g.display_name}
                          className="rounded-xl"
                        />
                        <span>{g.display_name}</span>
                      </div>
                      <span className="text-xs text-blue-400">Open</span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-blue-300 italic">No matching groups.</p>
              )}
            </div>
          </div>
        )}

        {/* ✅ MAIN SECTIONS */}
        {section === "chats" && (
          <div>
            <h2 className="text-lg font-semibold text-blue-300 mb-3">
              Recent Chats
            </h2>

            {loading ? (
              <div className="flex justify-center mt-10">
                <Loader2 className="animate-spin text-blue-400" size={28} />
              </div>
            ) : friends.length > 0 ? (
              <div className="space-y-3">
                {friends.map((chat) => (
                  <motion.div
                    key={chat.id}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center justify-between p-4 bg-blue-950/40 border border-blue-700/40 rounded-xl hover:bg-blue-800/40 cursor-pointer"
                    onClick={() => openChat(chat.friend.username)}
                  >
                    <div className="flex items-center gap-4">
                      <Image
                        src={chat.friend.avatar_url || "/default-avatar.png"}
                        width={50}
                        height={50}
                        alt={chat.friend.username}
                        className="rounded-full"
                      />
                      <div>
                        <p className="font-semibold text-white text-sm">
                          {chat.friend.username}
                        </p>
                        <p className="text-xs text-blue-300 truncate w-40">
                          {chat.lastMessage}
                        </p>
                      </div>
                    </div>
                    {chat.unreadCount > 0 && (
                      <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                        {chat.unreadCount}
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-blue-300 italic">You haven't chatted yet.</p>
            )}
          </div>
        )}

        {section === "groups" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-blue-300">Groups</h2>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white"
              >
                <PlusCircle size={16} />
                Create
              </Button>
            </div>
            <GroupConnect />
          </div>
        )}
      </main>

      {/* ✅ Modal for CreateGroupPage */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-lg bg-blue-950 border border-blue-700/50 rounded-2xl shadow-xl overflow-y-auto max-h-[90vh] p-6"
          >
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-3 right-3 text-blue-200 hover:text-white"
            >
              <X size={20} />
            </button>

            <CreateGroupPage />
          </motion.div>
        </div>
      )}
    </div>
  );
}
