"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import Image from "next/image";
import { Loader2, Users } from "lucide-react";
import { useRouter } from "next/navigation";

interface Group {
  id: string;
  group_username: string;
  display_name: string;
  avatar_url: string | null;
  description: string | null;
  created_by: string;
}

export default function GroupConnect() {
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    loadUserAndGroups();
  }, []);

  // ✅ Load currently signed-in user + their groups
  const loadUserAndGroups = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/dashboard");
      return;
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, group_username, display_name, avatar_url, description, created_by")
      .eq("id", user.id)
      .single();

    setCurrentUser(profile);

    // ✅ Fetch groups user created
    const { data: created, error: createdErr } = await supabase
      .from("groups")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });

    if (createdErr) console.warn("Load my groups error:", createdErr.message);

    setMyGroups(created || []);

    // ✅ Fetch groups user joined
    // requires group_members table
    const { data: membership, error: joinErr } = await supabase
      .from("group_members")
      .select(
        `
        group_id,
        groups (
          id,
          group_username,
          display_name,
          avatar_url,
          description,
          created_by
        )
      `
      )
      .eq("user_id", user.id);

    if (joinErr) console.warn("Joined groups error:", joinErr.message);

    const joined = (membership || [])
      .map((m: any) => m.groups)
      .filter(Boolean);

    setJoinedGroups(joined);

    setLoading(false);
  };

  // ✅ Open group chat or group page
  const openGroup = (groupUsername: string) => {
    router.push(`/connect/group/${groupUsername}`);
  };

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold text-blue-100 mb-4">Groups</h2>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-blue-400" size={30} />
        </div>
      ) : (
        <>
          {/* ========================== */}
          {/* ✅ Section 1: My Groups */}
          {/* ========================== */}
          <div className="mb-10">
            <h3 className="text-lg font-semibold text-blue-300 mb-3">
              My Groups
            </h3>

            {myGroups.length > 0 ? (
              <div className="space-y-3">
                {myGroups.map((group) => (
                  <motion.div
                    key={group.id}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center justify-between bg-blue-950/40 border border-blue-700/40 rounded-xl p-4 hover:bg-blue-800/40 cursor-pointer transition"
                    onClick={() => openGroup(group.group_username)}
                  >
                    <div className="flex items-center gap-4">
                      <Image
                        src={group.avatar_url || "/default-group.png"}
                        width={50}
                        height={50}
                        alt={group.display_name}
                        className="rounded-xl border border-blue-600/40"
                      />

                      <div>
                        <p className="font-semibold text-white text-sm">
                          {group.display_name}
                        </p>
                        <p className="text-xs text-blue-300 truncate w-48">
                          @{group.group_username}
                        </p>
                      </div>
                    </div>

                    <Users className="text-blue-400" size={18} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-blue-300 italic">You haven't created any groups.</p>
            )}
          </div>

          {/* ========================== */}
          {/* ✅ Section 2: Groups I Joined */}
          {/* ========================== */}
          <div className="mb-10">
            <h3 className="text-lg font-semibold text-blue-300 mb-3">
              Groups You Joined
            </h3>

            {joinedGroups.length > 0 ? (
              <div className="space-y-3">
                {joinedGroups.map((group) => (
                  <motion.div
                    key={group.id}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center justify-between bg-blue-950/40 border border-blue-700/40 rounded-xl p-4 hover:bg-blue-800/40 cursor-pointer transition"
                    onClick={() => openGroup(group.group_username)}
                  >
                    <div className="flex items-center gap-4">
                      <Image
                        src={group.avatar_url || "/default-group.png"}
                        width={50}
                        height={50}
                        alt={group.display_name}
                        className="rounded-xl border border-blue-600/40"
                      />

                      <div>
                        <p className="font-semibold text-white text-sm">
                          {group.display_name}
                        </p>
                        <p className="text-xs text-blue-300 truncate w-48">
                          @{group.group_username}
                        </p>
                      </div>
                    </div>

                    <Users className="text-blue-400" size={18} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-blue-300 italic">
                You haven't joined any groups yet.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
