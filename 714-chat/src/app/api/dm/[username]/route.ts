import { supabase } from "@/lib/supabaseClient";
import { supabaseAdmin } from "@/lib/supabaseServer"; // ✅ add this
import { NextResponse } from "next/server";

// GET: fetch all messages between logged-in user and [username]
export async function GET(req: Request, { params }: { params: { username: string } }) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = session.user.id;

  // fetch the friend's user id using the username (this part stays anon-safe)
  const { data: friend, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", params.username)
    .single();

  if (profileError || !friend)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const other = friend.id;

  // ✅ Now use supabaseAdmin for reading messages (bypasses RLS)
  const { data, error } = await supabaseAdmin
    .from("direct_messages")
    .select("*")
    .or(`and(sender_id.eq.${me},receiver_id.eq.${other}),and(sender_id.eq.${other},receiver_id.eq.${me})`)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// POST: send a new message
export async function POST(req: Request, { params }: { params: { username: string } }) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sender = session.user.id;
  const body = await req.json();

  // find receiver ID by username (still anon client, safe)
  const { data: friend, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", params.username)
    .single();

  if (profileError || !friend)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const receiver = friend.id;
  const { content, image_url, audio_url } = body;

  // ✅ Use supabaseAdmin for inserting messages (bypasses RLS)
  const { data, error } = await supabaseAdmin
    .from("direct_messages")
    .insert({
      sender_id: sender,
      receiver_id: receiver,
      content,
      image_url,
      audio_url,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
