"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { Upload, Users, Loader2, Link, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

export default function CreateGroupPage() {
  const [groupUsername, setGroupUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return alert("You must be signed in");

    const fileExt = file.name.split(".").pop();
    const fileName = `group-avatars/${session.user.id}-${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file);

    if (uploadError) {
      console.error(uploadError);
      setError("Failed to upload avatar");
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    setAvatarUrl(publicUrlData.publicUrl);
  };

  const handleCreateGroup = async () => {
    if (!groupUsername || !displayName) {
      setError("Group username and display name are required");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/group/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_username: groupUsername,
          display_name: displayName,
          description,
          avatar_url: avatarUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create group");
      }

      const link = `${window.location.origin}/invite/${data.group.invite_code}`;
      setInviteLink(link);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-screen p-6 bg-background"
    >
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          className="mb-4 flex items-center gap-2"
          onClick={() => router.back()}
        >
          <ArrowLeft size={18} /> Back
        </Button>

        <Card className="p-6 shadow-lg rounded-2xl">
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col items-center">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Group Avatar"
                  width={80}
                  height={80}
                  className="rounded-full object-cover border"
                />
              ) : (
                <div className="w-20 h-20 rounded-full border flex items-center justify-center text-gray-400">
                  <Users size={32} />
                </div>
              )}

              <label className="mt-2 text-sm text-blue-600 cursor-pointer flex items-center gap-1">
                <Upload size={16} />
                Upload Avatar
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </label>
            </div>

            <Input
              placeholder="Group username (e.g. ancientoracle)"
              value={groupUsername}
              onChange={(e) => setGroupUsername(e.target.value)}
            />

            <Input
              placeholder="Display name (e.g. The Ancient Oracle)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />

            <Textarea
              placeholder="Group description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <Button
              onClick={handleCreateGroup}
              disabled={creating}
              className="w-full mt-2"
            >
              {creating ? (
                <Loader2 size={18} className="animate-spin mr-2" />
              ) : null}
              Create Group
            </Button>

            {error && (
              <p className="text-red-500 text-sm text-center mt-2">{error}</p>
            )}

            {inviteLink && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 bg-muted p-3 rounded-xl text-center"
              >
                <p className="text-sm mb-1">🎉 Group Created!</p>
                <p className="text-xs text-muted-foreground">
                  Share this invite link:
                </p>
                <div className="flex items-center justify-center mt-2">
                  <code className="text-xs bg-background px-2 py-1 rounded border flex items-center gap-1">
                    <Link size={14} />
                    <span>{inviteLink}</span>
                  </code>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
