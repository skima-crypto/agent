// app/api/testFetch/route.ts
import { supabaseAdmin } from "@/lib/supabaseServer";
import { NextResponse } from "next/server";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("direct_messages")
    .select("*");

  return NextResponse.json({ data, error });
}
