import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  // ✅ Get current session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user;
  const body = await req.json();
  const { group_username, display_name, description, avatar_url } = body;

  if (!group_username || !display_name) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const invite_code = nanoid(8);

  try {
    // ✅ 1. Create group
    const { data: group, error: groupError } = await supabaseAdmin
      .from("groups")
      .insert({
        group_username,
        display_name,
        description,
        avatar_url,
        created_by: user.id,
        invite_code,
      })
      .select()
      .single();

    if (groupError) throw groupError;

    // ✅ 2. Add creator as admin
    const { error: memberError } = await supabaseAdmin
      .from("group_members")
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: "admin",
      });

    if (memberError) throw memberError;

    return NextResponse.json({ group }, { status: 201 });
  } catch (err: any) {
    console.error("Group creation error:", err);
    return NextResponse.json({ error: err.message || "Failed to create group" }, { status: 500 });
  }
}
