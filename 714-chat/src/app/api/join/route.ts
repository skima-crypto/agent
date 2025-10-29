import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user;
  const body = await req.json();
  const { invite_code } = body;

  if (!invite_code)
    return NextResponse.json({ error: "Missing invite code" }, { status: 400 });

  try {
    // ✅ 1. Find group by invite code
    const { data: group, error: groupError } = await supabaseAdmin
      .from("groups")
      .select("id, display_name, group_username")
      .eq("invite_code", invite_code)
      .single();

    if (groupError || !group)
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });

    // ✅ 2. Check if already a member
    const { data: existing } = await supabaseAdmin
      .from("group_members")
      .select("id")
      .eq("group_id", group.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing)
      return NextResponse.json({ message: "Already a member", group }, { status: 200 });

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
