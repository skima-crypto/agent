// app/api/reactions/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

// GET → fetch all reactions
export async function GET() {
  const { data, error } = await supabase
    .from('message_reactions')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST → create or toggle a reaction
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { message_id, user_id, emoji } = body

    // Check if this reaction already exists for this user
    const { data: existing, error: checkErr } = await supabase
      .from('message_reactions')
      .select('*')
      .eq('message_id', message_id)
      .eq('user_id', user_id)
      .eq('emoji', emoji)
      .maybeSingle()

    if (checkErr) throw checkErr

    if (existing) {
      // remove reaction (toggle off)
      const { error: delErr } = await supabase
        .from('message_reactions')
        .delete()
        .eq('id', existing.id)
      if (delErr) throw delErr
      return NextResponse.json({ removed: true })
    }

    // add reaction
    const { data, error } = await supabase
      .from('message_reactions')
      .insert({ message_id, user_id, emoji })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}
