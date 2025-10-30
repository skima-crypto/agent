import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseServer";

// Use env vars (make sure these exist)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: Request) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ✅ Create a client scoped to this user
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  // Get user from token
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { group_username, display_name, description, avatar_url } = body;

  if (!group_username || !display_name) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

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
    return NextResponse.json(
      { error: err.message || "Failed to create group" },
      { status: 500 }
    );
  }
}
