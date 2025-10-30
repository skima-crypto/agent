import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseServer";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: Request) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ✅ Decode user from token
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { invite_code } = body;

  if (!invite_code) {
    return NextResponse.json({ error: "Missing invite code" }, { status: 400 });
  }

  try {
    // ✅ 1. Find group by group_username (invite)
    const { data: group, error: groupError } = await supabaseAdmin
      .from("groups")
      .select("id, display_name, group_username")
      .eq("group_username", invite_code)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: "Invalid invite" }, { status: 404 });
    }

    // ✅ 2. Check if already member
    const { data: existing } = await supabaseAdmin
      .from("group_members")
      .select("id")
      .eq("group_id", group.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ message: "Already a member", group }, { status: 200 });
    }

    // ✅ 3. Add member
    const { error: joinError } = await supabaseAdmin
      .from("group_members")
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: "member",
      });

    if (joinError) throw joinError;

    return NextResponse.json({ message: "Joined group", group }, { status: 200 });
  } catch (err: any) {
    console.error("Join error:", err);
    return NextResponse.json({ error: err.message || "Failed to join group" }, { status: 500 });
  }
}
