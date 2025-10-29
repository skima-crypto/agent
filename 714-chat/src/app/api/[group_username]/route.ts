import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(
  req: Request,
  { params }: { params: { group_username: string } }
) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: group, error } = await supabaseAdmin
    .from("groups")
    .select("*, group_members(role, user_id)")
    .eq("group_username", params.group_username)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ group });
}
