import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseServer";

// Use environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🔐 Create a user-scoped Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    // ✅ Get the user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Parse body
    const { group_username, display_name, description, avatar_url } =
      await req.json();

    if (!group_username || !display_name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ✅ 1. Create group (admin client bypasses RLS safely)
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

    // ✅ 2. Add creator as admin and member automatically
    const { error: memberError } = await supabaseAdmin
      .from("group_members")
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: "admin", // 👑 mark as admin
      });

    if (memberError) {
      console.error("Member insert error:", memberError);
      throw memberError;
    }

    // ✅ 3. Return both group and route
    return NextResponse.json(
      {
        group,
        group_url: `/g/${group.group_username}`,
        message: "Group created successfully!",
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Group creation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create group" },
      { status: 500 }
    );
  }
}
