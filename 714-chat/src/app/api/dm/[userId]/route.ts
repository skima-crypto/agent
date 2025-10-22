import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";

// GET: fetch all messages between logged-in user and [userId]
export async function GET(req: Request, { params }: { params: { userId: string } }) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = session.user.id;
  const other = params.userId;

  const { data, error } = await supabase
    .from("direct_messages")
    .select("*")
    .or(`and(sender_id.eq.${me},receiver_id.eq.${other}),and(sender_id.eq.${other},receiver_id.eq.${me})`)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// POST: send a new message
export async function POST(req: Request, { params }: { params: { userId: string } }) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sender = session.user.id;
  const receiver = params.userId;
  const body = await req.json();

  const { content, image_url, audio_url } = body;

  const { data, error } = await supabase
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
