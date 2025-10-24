"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import { motion } from "framer-motion";

interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  online?: boolean;
}

interface ChatPreview {
  id: string;
  friend: Profile;
  lastMessage: string;
  unreadCount: number;
}

export default function ConnectPage() {
  const [friends, setFriends] = useState<ChatPreview[]>([]);
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [globalSearch, setGlobalSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadUserAndChats();
    subscribeToPresence();
  }, []);

  // ✅ Fetch user profile and all people you’ve chatted with
const loadUserAndChats = async () => {
  setLoading(true);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    router.push("/home");
    return;
  }

  // get current user profile
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  setCurrentUser(userProfile);

  // 🧠 find all users you’ve chatted with
  const { data: messages, error } = await supabase
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

  if (error) {
    console.error("Chat load failed:", error.message);
    setLoading(false);
    return;
  }

  // 🔎 group messages by the other user
  const chatMap: Record<string, ChatPreview> = {};

  for (const msg of messages) {
    // 🧩 handle array responses safely
    const sender = Array.isArray(msg.sender) ? msg.sender[0] : msg.sender;
    const receiver = Array.isArray(msg.receiver) ? msg.receiver[0] : msg.receiver;
    const isSender = msg.sender_id === user.id;

    const friend = isSender ? receiver : sender;
    if (!friend) continue;

    if (!chatMap[friend.id]) {
      chatMap[friend.id] = {
        id: friend.id,
        friend: {
          id: friend.id,
          username: friend.username,
          avatar_url: friend.avatar_url,
        },
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

  const chats = Object.values(chatMap);
  setFriends(chats);
  setLoading(false);
};


  // ✅ Presence tracking (realtime online/offline)
  const subscribeToPresence = async () => {
    const channel = supabase.channel("presence");

    channel
      .on("presence", { event: "sync" }, () => {
        console.log("Presence updated");
      })
      .subscribe(async (status) => {
        console.log("Realtime status:", status);
      });
  };

  // ✅ Search users globally by username
  const handleGlobalSearch = async (query: string) => {
    setGlobalSearch(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .ilike("username", `%${query}%`)
      .limit(20);

    if (error) {
      console.warn("Search error:", error.message);
      return;
    }

    setSearchResults(data);
  };

  const handleOpenChat = (friendUsername: string) => {
  router.push(`/connect/dm/${friendUsername}`);
};


  return (
    <div className="flex min-h-screen bg-gradient-to-b from-blue-950 to-blue-900 text-blue-100">
      <Sidebar />

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto px-6 py-8 lg:ml-64">
        <h1 className="text-3xl font-extrabold mb-6 text-white tracking-tight">
          Connect & Chat
        </h1>

        {/* Search bar */}
        <div className="relative mb-8">
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => handleGlobalSearch(e.target.value)}
            placeholder="Search by username..."
            className="w-full rounded-xl bg-blue-950/40 border border-blue-700/30 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder:text-blue-300"
          />
          <Search className="absolute right-4 top-3.5 text-blue-400" size={18} />
        </div>

        {/* Search Results */}
        {globalSearch.length > 1 && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-blue-300 mb-3">
              Global Search Results
            </h2>
            {searchResults.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((user) => (
                  <motion.div
                    key={user.id}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center justify-between bg-blue-950/40 border border-blue-700/40 rounded-xl p-4 hover:bg-blue-800/40 transition cursor-pointer"
                    onClick={() => handleOpenChat(user.username)}

                  >
                    <div className="flex items-center gap-3">
                      <Image
                        src={user.avatar_url || "/default-avatar.png"}
                        alt={user.username}
                        width={40}
                        height={40}
                        className="rounded-full border border-blue-500/30"
                      />
                      <span className="font-medium">{user.username}</span>
                    </div>
                    <span className="text-xs text-blue-400">Connect</span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-blue-300 italic">
                No users found matching “{globalSearch}”
              </p>
            )}
          </div>
        )}

        {/* Recent chats */}
        <div>
          <h2 className="text-lg font-semibold text-blue-300 mb-3">
  Chats
</h2>

          {loading ? (
            <div className="flex items-center justify-center mt-10">
              <Loader2 className="animate-spin text-blue-400" size={28} />
            </div>
          ) : friends.length > 0 ? (
            <div className="space-y-3">
              {friends.map((chat) => (
                <motion.div
                  key={chat.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleOpenChat(chat.friend.username)}

                  className="flex items-center justify-between bg-blue-950/40 border border-blue-700/40 rounded-xl p-4 hover:bg-blue-800/40 transition cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Image
                        src={chat.friend.avatar_url || "/default-avatar.png"}
                        alt={chat.friend.username}
                        width={50}
                        height={50}
                        className="rounded-full border border-blue-500/40"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border border-blue-950 ${
                          chat.friend.online
                            ? "bg-green-400 animate-pulse"
                            : "bg-gray-500"
                        }`}
                      />
                    </div>
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
            <p className="text-blue-300 italic mt-6">
              You haven’t chatted with anyone yet.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
