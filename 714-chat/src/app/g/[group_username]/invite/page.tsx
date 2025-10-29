"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Loader2 } from "lucide-react";

interface Group {
  id: string;
  display_name: string;
  description?: string;
  avatar_url?: string;
  invite_code: string;
  group_username: string;
}

export default function GroupInvitePage({
  params,
}: {
  params: { group_username: string };
}) {
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const username = params.group_username;

  // Fetch group data
  useEffect(() => {
    const fetchGroup = async () => {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .eq("group_username", username)
        .single();

      if (error) setError(error.message);
      else setGroup(data);
      setLoading(false);
    };

    fetchGroup();
  }, [username]);

  // Handle join via API route
  const handleJoin = async () => {
    if (!group) return;
    try {
      setJoining(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/signin");
        return;
      }

      // Call our API route securely
      const res = await fetch("/api/group/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_code: group.invite_code }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to join group");

      router.push(`/g/${data.group.group_username}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setJoining(false);
    }
  };

  // --- UI States ---
  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin h-6 w-6 text-blue-500" />
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        Error: {error}
      </div>
    );

  if (!group)
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Group not found
      </div>
    );

  // --- Page UI ---
  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-slate-900">
      <Card className="w-full max-w-md p-6 text-center shadow-lg">
        <CardHeader>
          {group.avatar_url && (
            <div className="flex justify-center mb-4">
              <Image
                src={group.avatar_url}
                alt={group.display_name}
                width={80}
                height={80}
                className="rounded-full border"
              />
            </div>
          )}
          <CardTitle className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">
            {group.display_name}
          </CardTitle>
        </CardHeader>

        <CardContent>
          {group.description && (
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              {group.description}
            </p>
          )}

          <Button
            onClick={handleJoin}
            disabled={joining}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-all"
          >
            {joining ? (
              <span className="flex items-center justify-center">
                <Loader2 className="animate-spin h-4 w-4 mr-2" /> Joining...
              </span>
            ) : (
              "Join Group"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
