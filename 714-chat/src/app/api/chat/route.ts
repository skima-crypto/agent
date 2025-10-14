// app/api/chat/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

// GET → fetch all messages (ordered)
export async function GET() {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST → create a new message
export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('📩 Incoming body:', body) // 🧩 Debug incoming data

    const { user_id, username, avatar_url, content, image_url, audio_url, parent_id } = body

    if (!user_id || (!content && !image_url && !audio_url)) {
      console.error('❌ Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields (user_id or content)' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        user_id,
        username,
        avatar_url,
        content,
        image_url,
        audio_url,
        parent_id,
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Supabase insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Message inserted:', data)
    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    console.error('💥 Server error:', err)
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}
