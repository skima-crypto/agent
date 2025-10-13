'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import EmojiPicker, { Theme } from 'emoji-picker-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)

type Message = {
  id: string
  user_id: string
  username: string
  avatar_url?: string
  content: string
  image_url?: string | null
  audio_url?: string | null
  parent_id?: string | null
  created_at: string
}

type Reaction = {
  id: string
  message_id: string
  user_id: string
  emoji: string
  created_at: string
}

export default function ChatPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [reactions, setReactions] = useState<Record<string, Reaction[]>>({})
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [showEmoji, setShowEmoji] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [gifResults, setGifResults] = useState<any[]>([])
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const messagesRef = useRef<HTMLDivElement | null>(null)

  // util: relative time
  const timeAgo = (d: string) => dayjs(d).fromNow()

  // --- helper: ensure buckets exist (avatars, chat-uploads)
  const ensureBucket = async (bucket: string) => {
    try {
      // listBuckets may require elevated privileges; we attempt create (if exists, createBucket will error)
      const { error } = await supabase.storage.createBucket(bucket, { public: true })
      // if error && message contains 'already exists' ignore; otherwise continue
      // supabase returns error if exists — ignore silently
    } catch (e) {
      // ignore
    }
  }

  // --- init user + profile
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      const sessionUser = data.session?.user
      if (!sessionUser) {
        window.location.href = '/login'
        return
      }
      setUser(sessionUser)

      // load profile from `profiles` table
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', sessionUser.id).single()
      setProfile(prof || null)

      // ensure storage buckets exist (silent)
      await ensureBucket('chat-uploads')
      await ensureBucket('avatars')

      setLoading(false)
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- load messages + subscribe (realtime)
  useEffect(() => {
    let channel: any = null

    const loadAndSubscribe = async () => {
      const { data, error } = await supabase.from<Message>('messages').select('*').order('created_at', { ascending: true })
      if (!error && data) setMessages(data)

      channel = supabase
        .channel('public:messages')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as Message])
            // scroll to bottom
            setTimeout(() => messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' }), 100)
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'messages' },
          (payload) => {
            setMessages((prev) => prev.map((m) => (m.id === payload.new.id ? payload.new : m)))
          }
        )
        .subscribe()

      // subscribe to reactions
      const reactChannel = supabase
        .channel('public:reactions')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' }, (p) => {
          // reload reactions for the message_id
          const mid = p.new?.message_id ?? p.old?.message_id
          if (!mid) return
          loadReactions(mid)
        })
        .subscribe()

      // initial load reactions for existing messages
      data?.forEach((m) => loadReactions(m.id))
    }

    loadAndSubscribe()

    return () => {
      try {
        if (channel) supabase.removeChannel(channel)
      } catch (e) {
        // ignore
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, user])

  // load reactions for a message
  const loadReactions = async (messageId: string) => {
    const { data } = await supabase.from<Reaction>('message_reactions').select('*').eq('message_id', messageId)
    setReactions((prev) => ({ ...prev, [messageId]: data || [] }))
  }

  // refresh timestamps (force rerender) every 30s
  useEffect(() => {
    const t = setInterval(() => setMessages((m) => [...m]), 30000)
    return () => clearInterval(t)
  }, [])

  // --- handle image upload (auto-create bucket if missing)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)

    try {
      const bucket = 'chat-uploads'
      // try to create silently
      try {
        await supabase.storage.createBucket(bucket, { public: true })
      } catch (err) {
        // ignore
      }

      const fileName = `${user.id}-${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from(bucket).upload(fileName, file, { upsert: true })
      if (error) throw error

      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
      setImageUrl(data.publicUrl)
    } catch (err: any) {
      alert('Upload failed: ' + (err?.message || err))
    } finally {
      setUploading(false)
    }
  }

  // --- handle gif search (Tenor)
  const searchGifs = async (q: string) => {
    setGifResults([])
    try {
      const key = process.env.NEXT_PUBLIC_TENOR_API_KEY
      if (!key) {
        alert('No TENOR API key set. Add NEXT_PUBLIC_TENOR_API_KEY in .env.local')
        return
      }
      const res = await fetch(`https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(q)}&key=${key}&limit=24`)
      const json = await res.json()
      setGifResults(json.results || [])
    } catch (e) {
      console.error(e)
      setGifResults([])
    }
  }

  // --- send gif by url
  const sendGif = async (gifUrl: string) => {
    if (!user) return
    const { error } = await supabase.from('messages').insert({
      user_id: user.id,
      username: profile?.username || user.user_metadata?.full_name || user.email.split('@')[0],
      avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || '',
      content: '',
      image_url: gifUrl,
    })
    if (error) console.error(error)
  }

  // --- start / stop voice recording (MediaRecorder)
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      audioChunksRef.current = []

      mr.ondataavailable = (ev) => {
        if (ev.data.size > 0) audioChunksRef.current.push(ev.data)
      }
      mr.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        // upload
        const bucket = 'chat-uploads'
        const fileName = `${user.id}-voice-${Date.now()}.webm`
        try {
          await supabase.storage.createBucket(bucket, { public: true }).catch(() => {})
          const { error } = await supabase.storage.from(bucket).upload(fileName, blob, { upsert: true })
          if (error) throw error
          const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
          // save message with audio_url
          const { error: err2 } = await supabase.from('messages').insert({
            user_id: user.id,
            username: profile?.username || user.user_metadata?.full_name || user.email.split('@')[0],
            avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || '',
            content: '', // optional text
            audio_url: data.publicUrl,
          })
          if (err2) console.error(err2)
        } catch (err: any) {
          alert('Voice upload failed: ' + (err.message || err))
        }
      }

      mr.start()
      setIsRecording(true)
    } catch (err: any) {
      alert('Microphone access denied or unavailable.')
    }
  }

  const stopRecording = () => {
    const mr = mediaRecorderRef.current
    if (!mr) return
    mr.stop()
    setIsRecording(false)
  }

  // --- send message with image/audio
  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!user) return
    if (!newMessage.trim() && !imageUrl && !audioUrl) {
      return
    }

    const content = replyTo ? `↩️ ${replyTo.username}: ${replyTo.content}\n${newMessage}` : newMessage

    const { error } = await supabase.from('messages').insert({
      user_id: user.id,
      username: profile?.username || user.user_metadata?.full_name || user.email.split('@')[0],
      avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || '',
      content,
      image_url: imageUrl || null,
      audio_url: audioUrl || null,
      parent_id: replyTo?.id || null,
    })

    if (error) {
      console.error('send error', error)
      alert('Message send failed.')
      return
    }

    setNewMessage('')
    setImageUrl(null)
    setAudioUrl(null)
    setReplyTo(null)
    setShowEmoji(false)
    // scroll down
    setTimeout(() => messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' }), 100)
  }

  // --- add/remove reaction (toggle)
  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!user) return
    // check if user already reacted
    const existing = (reactions[messageId] || []).find((r) => r.user_id === user.id && r.emoji === emoji)
    if (existing) {
      // delete
      const { error } = await supabase.from('message_reactions').delete().match({ id: existing.id })
      if (error) console.error(error)
      return
    }
    // insert
    const { error } = await supabase.from('message_reactions').insert({
      message_id: messageId,
      user_id: user.id,
      emoji,
    })
    if (error) console.error(error)
  }

  // --- helper: play audio (simple)
  const playAudio = (url: string) => {
    const audio = new Audio(url)
    audio.play().catch((e) => console.error(e))
  }

  // --- auto-scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => messagesRef.current?.scrollTo({ top: messagesRef.current?.scrollHeight, behavior: 'smooth' }), 150)
  }, [messages.length])

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-white bg-black">
        Loading chat...
      </div>
    )

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* background overlay - if you upload /public/714BG.* and want it behind chat */}
      <div className="absolute inset-0 -z-10">
        <Image src="/714BG.jpg" alt="bg" fill className="object-cover opacity-10" />
      </div>

      <header className="relative z-10 bg-[#1a1a1a] border-b border-zinc-800 py-3 text-center font-semibold text-lg shadow-md">
        💬 714 Global Chat
      </header>

      {/* Messages Area */}
      <div
        ref={messagesRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-700 relative"
      >
        {messages.map((msg) => {
          const mine = msg.user_id === user.id
          const msgReacts = reactions[msg.id] || []

          // aggregate reactions into {emoji: {count, reactedByMe}}
          const agg: Record<
            string,
            { count: number; reactedByMe: boolean }
          > = {}
          msgReacts.forEach((r) => {
            if (!agg[r.emoji]) agg[r.emoji] = { count: 0, reactedByMe: false }
            agg[r.emoji].count += 1
            if (r.user_id === user.id) agg[r.emoji].reactedByMe = true
          })

          return (
            <div
              key={msg.id}
              className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex max-w-[75%] items-end gap-2 ${
                  mine ? 'flex-row-reverse text-right' : ''
                }`}
              >
                {/* avatar on left for others */}
                {!mine && (
                  <div className="flex-shrink-0">
                    <img
                      src={
                        msg.avatar_url ||
                        profile?.avatar_url ||
                        '/default-avatar.png'
                      }
                      alt={msg.username}
                      className="w-8 h-8 rounded-full shadow-md object-cover"
                    />
                  </div>
                )}

                <div
                  className={`p-3 rounded-2xl shadow-md transition-transform ${
                    mine
                      ? 'bg-blue-600 hover:bg-blue-700 text-white rounded-br-none'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-gray-100 rounded-bl-none'
                  }`}
                >
                  {/* username for others */}
                  {!mine && (
                    <p className="text-xs text-gray-400 font-semibold mb-1">
                      {msg.username}
                    </p>
                  )}

                  {/* image or gif */}
                  {msg.image_url && (
                    <div className="mb-2">
                      <Image
                        src={msg.image_url}
                        alt="upload"
                        width={360}
                        height={240}
                        className="rounded-lg object-cover"
                      />
                    </div>
                  )}

                  {/* audio */}
                  {msg.audio_url && (
                    <div className="mb-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => playAudio(msg.audio_url!)}
                        className="px-2 py-1 bg-zinc-900 rounded-md"
                      >
                        ▶️ Play
                      </button>
                      <span className="text-xs text-gray-400">Voice note</span>
                    </div>
                  )}

                  {/* message content */}
                  {msg.content && (
                    <p className="text-sm leading-snug whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  )}

                  {/* reactions row */}
                  <div className="mt-2 flex items-center gap-2">
                    {Object.keys(agg).map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => toggleReaction(msg.id, emoji)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                          agg[emoji].reactedByMe
                            ? 'bg-white text-black'
                            : 'bg-zinc-900 text-gray-200'
                        }`}
                      >
                        <span>{emoji}</span>
                        <span>{agg[emoji].count}</span>
                      </button>
                    ))}

                    {/* reply & add reaction quick buttons */}
                    <div className="ml-2 flex items-center gap-2">
                      <button
                        onClick={() => setReplyTo(msg)}
                        className="text-xs text-gray-400 hover:text-blue-300"
                      >
                        💬 Reply
                      </button>

                      {/* quick reaction suggestions */}
                      <div className="flex gap-1">
                        {['❤️', '😂', '👍', '🔥'].map((e) => (
                          <button
                            key={e}
                            onClick={() => toggleReaction(msg.id, e)}
                            className="text-sm"
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="ml-auto text-[11px] text-gray-400">
                      {timeAgo(msg.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div className="bg-zinc-900 p-2 text-sm text-gray-300 border-t border-zinc-800">
          Replying to <strong>{replyTo.username}</strong> —{' '}
          <span className="italic">{replyTo.content.slice(0, 120)}</span>
          <button
            className="ml-2 text-red-400 hover:text-red-300"
            onClick={() => setReplyTo(null)}
          >
            ✖ Cancel
          </button>
        </div>
      )}

      {/* GIF picker modal / panel */}
      {showGifPicker && (
        <div className="absolute bottom-28 left-4 z-30 w-[calc(100%-2rem)] max-w-2xl bg-zinc-900 border border-zinc-800 rounded-lg p-3 shadow-lg">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Search GIFs..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  searchGifs((e.target as HTMLInputElement).value)
                }
              }}
              className="flex-1 px-3 py-2 rounded bg-zinc-800 text-white"
            />
            <button
              onClick={() => setShowGifPicker(false)}
              className="px-3 py-2 bg-zinc-700 rounded"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 max-h-64 overflow-auto">
            {gifResults.length === 0 ? (
              <div className="col-span-4 text-center text-sm text-gray-400">
                No GIFs. Search above.
              </div>
            ) : (
              gifResults.map((g) => {
                // Tenor v2 returns different shapes; pick a best guess
                const url =
                  g.media?.[0]?.gif?.url ||
                  g.media_formats?.gif?.url ||
                  g.url ||
                  g.content_url
                return (
                  <button
                    key={g.id || url}
                    onClick={() => {
                      sendGif(url)
                      setShowGifPicker(false)
                    }}
                    className="rounded overflow-hidden"
                  >
                    <img src={url} alt="gif" className="w-full h-24 object-cover" />
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Input area */}
      <form
        onSubmit={(e) => sendMessage(e)}
        className="p-4 bg-zinc-950 border-t border-zinc-800 flex flex-col gap-3 z-10"
      >
        {/* image preview */}
        {imageUrl && (
          <div className="relative w-fit">
            <Image src={imageUrl} alt="preview" width={140} height={140} className="rounded-lg mb-2 object-cover" />
            <button
              type="button"
              onClick={() => setImageUrl(null)}
              className="absolute top-0 right-0 bg-black/60 text-white px-1 rounded"
            >
              ✖
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowEmoji((v) => !v)}
            className="text-2xl hover:scale-110 transition-transform"
            title="Emoji"
          >
            😊
          </button>

          <button
            type="button"
            onClick={() => setShowGifPicker((v) => !v)}
            className="px-3 py-2 bg-zinc-900 rounded"
            title="GIFs"
          >
            GIF
          </button>

          <label className="text-sm text-gray-300 cursor-pointer px-2 py-1 bg-zinc-900 rounded">
            Upload
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>

          {/* voice record toggle */}
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="px-3 py-2 bg-red-600 rounded text-white"
              title="Record voice"
            >
              ◉
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="px-3 py-2 bg-red-400 rounded text-white"
              title="Stop"
            >
              ■
            </button>
          )}

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-2 focus:outline-none"
          />

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl font-semibold"
          >
            Send
          </button>
        </div>

        {/* emoji picker */}
        {showEmoji && (
          <div className="mt-2">
            <EmojiPicker
              onEmojiClick={(emojiData) =>
                setNewMessage((prev) => prev + emojiData.emoji)
              }
              theme={Theme.DARK}
            />
          </div>
        )}
      </form>
    </div>
  )
}

