'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import EmojiPicker, { Theme } from 'emoji-picker-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)

// --- Types ---
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

// --- Component ---
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
  const [selectedProfile, setSelectedProfile] = useState<any>(null)

  

  const timeAgo = (d: string) => dayjs(d).fromNow()

  // --- Ensure buckets exist ---
  const ensureBucket = async (bucket: string) => {
    try {
      await supabase.storage.createBucket(bucket, { public: true })
    } catch {}
  }

  // --- Initialize user & profile ---
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      const sessionUser = data.session?.user
      if (!sessionUser) {
        window.location.href = '/login'
        return
      }
      setUser(sessionUser)

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .single()
      setProfile(prof || null)

      await ensureBucket('chat-uploads')
      await ensureBucket('avatars')
      setLoading(false)
    }
    init()
  }, [])

  const openUserProfile = async (userId: string) => {
  try {
    if (!userId) {
      console.warn('⚠️ No userId provided to openUserProfile')
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, wallet_address')
      .eq('id', userId)
      .maybeSingle() // ✅ instead of .single()

    if (error) {
      console.error('Supabase error:', error)
      return
    }

    if (!data) {
      console.warn('⚠️ No profile found for userId:', userId)
      return
    }

    setSelectedProfile(data)
  } catch (err: any) {
    console.error('Error loading profile:', err.message || err)
  }
}

const closeProfile = () => setSelectedProfile(null)


// --- Load messages & subscribe to realtime updates ---
useEffect(() => {
  if (!user) return

  const loadAndSubscribe = async () => {
    try {
      // Load initial messages
      const res = await fetch('/api/chat')
      if (!res.ok) throw new Error('Failed to fetch messages')
      const data = await res.json()
      setMessages(data)
    } catch (err) {
      console.error('Error loading messages:', err)
    }

    // ✅ Proper realtime listener
    const channel = supabase
      .channel('public:messages') // Must match schema:table
      .on(
        'postgres_changes',
        {
          event: '*', // listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMsg = payload.new as Message
          const oldMsg = payload.old as Message

          setMessages((prev) => {
            switch (payload.eventType) {
              case 'INSERT':
                if (prev.some((m) => m.id === newMsg.id)) return prev
                return [...prev, newMsg]
              case 'UPDATE':
                return prev.map((m) => (m.id === newMsg.id ? newMsg : m))
              case 'DELETE':
                return prev.filter((m) => m.id !== oldMsg.id)
              default:
                return prev
            }
          })

          // Auto-scroll when a new message appears
          setTimeout(() => {
            messagesRef.current?.scrollTo({
              top: messagesRef.current.scrollHeight,
              behavior: 'smooth',
            })
          }, 100)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  loadAndSubscribe()
}, [user])


  // --- Load and subscribe to reactions ---
useEffect(() => {
  if (!user) return

  const loadReactions = async () => {
    const res = await fetch('/api/reactions')
    if (!res.ok) return
    const data: Reaction[] = await res.json()

    const grouped = data.reduce((acc: Record<string, Reaction[]>, r) => {
      acc[r.message_id] = acc[r.message_id] || []
      acc[r.message_id].push(r)
      return acc
    }, {})
    setReactions(grouped)
  }
  loadReactions()

  const channel = supabase
    .channel('chat-reactions')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'reactions' },
      (payload) => {
        const newReaction = payload.new as Reaction
        setReactions((prev) => {
          const current = prev[newReaction.message_id] || []
          return {
            ...prev,
            [newReaction.message_id]: [...current, newReaction],
          }
        })
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [user])


  // --- Send Message ---
  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!user) return
    if (!newMessage.trim() && !imageUrl && !audioUrl) return

    const content = replyTo
      ? `↩️ ${replyTo.username}: ${replyTo.content}\n${newMessage}`
      : newMessage

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          username:
            profile?.username ||
            user.user_metadata?.full_name ||
            user.email.split('@')[0],
          avatar_url:
            profile?.avatar_url || user.user_metadata?.avatar_url || '',
          content,
          image_url: imageUrl || null,
          audio_url: audioUrl || null,
          parent_id: replyTo?.id || null,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        console.error('Send message error:', err)
        return
      }

      const newMsg = await res.json()
      setMessages((prev) => [...prev, newMsg])
      setNewMessage('')
      setImageUrl(null)
      setAudioUrl(null)
      setReplyTo(null)
      setShowEmoji(false)
    } catch (err) {
      console.error('Send message failed:', err)
    }
  }

  // --- Image Upload ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)

    try {
      const bucket = 'chat-uploads'
      await ensureBucket(bucket)
      const fileName = `${user.id}-${Date.now()}-${file.name}`
      const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
      setImageUrl(data.publicUrl)
    } catch (err: any) {
      alert('Upload failed: ' + (err?.message || err))
    } finally {
      setUploading(false)
    }
  }

  // --- Voice Recording ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (!stream) return alert('Microphone not found')

      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      audioChunksRef.current = []

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mr.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const fileName = `${user.id}-voice-${Date.now()}.webm`
        const bucket = 'chat-uploads'

        try {
          await ensureBucket(bucket)
          const { error } = await supabase.storage
            .from(bucket)
            .upload(fileName, blob, { upsert: true })
          if (error) throw error
          const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
          setAudioUrl(data.publicUrl)
          await sendMessage()
        } catch (err: any) {
          alert('Voice upload failed: ' + (err.message || err))
        }
      }

      mr.start()
      setIsRecording(true)
    } catch (err: any) {
      console.error(err)
      alert('Microphone access failed.')
    }
  }

  const stopRecording = () => {
    const mr = mediaRecorderRef.current
    if (!mr) return
    mr.stop()
    setIsRecording(false)
  }

  // --- Play Audio ---
  const playAudio = (url: string) => {
    const audio = new Audio(url)
    audio.play().catch((e) => console.error(e))
  }

  // --- Scroll to bottom on new messages ---
  useEffect(() => {
    setTimeout(() => {
      messagesRef.current?.scrollTo({
        top: messagesRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }, 150)
  }, [messages.length])

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-white bg-black">
        Loading chat...
      </div>
    )


    const handleAddReaction = async (messageId: string) => {
  const emoji = prompt('React with emoji (e.g. 😍, 😂, 👍):')
  if (!emoji) return

  const res = await fetch('/api/reactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message_id: messageId, user_id: user.id, emoji }),
  })

  if (!res.ok) {
    const err = await res.json()
    console.error('Failed to add reaction:', err)
  }
}


const ProfileModal = () =>
  selectedProfile && (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-zinc-900 p-6 rounded-2xl w-[90%] max-w-sm text-center shadow-lg relative">
        <button
          onClick={closeProfile}
          className="absolute top-3 right-4 text-gray-400 hover:text-white"
        >
          ✖
        </button>

        <img
          src={selectedProfile.avatar_url || '/default-avatar.png'}
          alt="avatar"
          className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-blue-500 object-cover"
        />
        <h2 className="text-xl font-semibold mb-2">
          {selectedProfile.username}
        </h2>

        {selectedProfile.wallet_address ? (
          <p className="text-sm text-gray-400 mb-2">
            Wallet: {selectedProfile.wallet_address}
          </p>
        ) : (
          <p className="text-sm text-gray-500 mb-2 italic">
            Wallet not connected
          </p>
        )}

        {selectedProfile.id === user.id ? (
          <button
            onClick={() => (window.location.href = '/profile')}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white mt-3"
          >
            Go to My Profile
          </button>
        ) : (
          <button
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white mt-3"
            onClick={() => alert('💸 Tip feature coming soon!')}
          >
            Tip User 💸
          </button>
        )}
      </div>
    </div>
  )


  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <div className="absolute inset-0 -z-10">
        <Image src="/714BG.jpg" alt="bg" fill className="object-cover opacity-10" />
      </div>

      <header className="relative z-10 bg-[#1a1a1a] border-b border-zinc-800 py-3 text-center font-semibold text-lg shadow-md">
        💬 714 Global Chat
      </header>

      {/* --- Messages List --- */}
<div
  ref={messagesRef}
  className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-700 relative"
>
  {messages.map((msg) => {
  const mine = msg.user_id === user.id
  return (
    <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[75%] items-end gap-2 ${mine ? 'flex-row-reverse text-right' : ''}`}>
        {/* Avatar - now shown for both mine and others and clickable */}
        <img
          src={msg.avatar_url || '/default-avatar.png'}
          alt={`${msg.username || 'User'} avatar`}
          role="button"
          onClick={() => openUserProfile(msg.user_id)}
          className="w-8 h-8 rounded-full shadow-md object-cover cursor-pointer"
        />

        <div
          className={`p-3 rounded-2xl shadow-md ${
            mine ? 'bg-blue-600 rounded-br-none' : 'bg-zinc-800 rounded-bl-none'
          }`}
        >
          {!mine && (
  <p
    className="text-xs text-gray-400 font-semibold mb-1 cursor-pointer hover:text-blue-400"
    onClick={() => openUserProfile(msg.user_id)}
  >
    {msg.username}
  </p>
)}


          {msg.image_url && (
            <Image
              src={msg.image_url}
              alt="upload"
              width={360}
              height={240}
              className="rounded-lg mb-2 object-cover"
            />
          )}

          {msg.audio_url && (
            <div className="mb-2 flex items-center gap-2">
              <button
                onClick={() => playAudio(msg.audio_url!)}
                className="px-2 py-1 bg-zinc-900 rounded-md"
              >
                ▶️ Play
              </button>
              <span className="text-xs text-gray-400">Voice note</span>
            </div>
          )}

          {msg.content && (
            <p className="text-sm leading-snug whitespace-pre-wrap">
              {msg.content}
            </p>
          )}

          {/* --- Reactions Section --- */}
          <div className="mt-2 flex flex-wrap gap-2 items-center">
            {(reactions[msg.id] || []).map((r) => (
              <span key={r.id} className="text-lg">
                {r.emoji}
              </span>
            ))}
            <button
              onClick={() => handleAddReaction(msg.id)}
              className="text-gray-400 hover:text-yellow-400 text-sm"
            >
              ➕
            </button>
          </div>

          <div className="mt-1 text-[11px] text-gray-400">
            {timeAgo(msg.created_at)}
          </div>
        </div>
      </div>
    </div>
  )
})}
</div>

       

      {/* --- Reply preview --- */}
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

           {/* --- Input area --- */}
      <form
        onSubmit={(e) => sendMessage(e)}
        className="p-4 bg-zinc-950 border-t border-zinc-800 flex flex-col gap-3 z-10"
      >
        {imageUrl && (
          <div className="relative w-fit">
            <Image
              src={imageUrl}
              alt="preview"
              width={140}
              height={140}
              className="rounded-lg mb-2 object-cover"
            />
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
            className="text-2xl"
          >
            😊
          </button>

          <label className="cursor-pointer px-2 py-1 bg-zinc-900 rounded">
            Upload
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>

          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="px-3 py-2 bg-red-600 rounded text-white"
            >
              ◉
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="px-3 py-2 bg-red-400 rounded text-white"
            >
              ■
            </button>
          )}

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-2"
          />

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl font-semibold"
          >
            Send
          </button>
        </div>

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
{/* --- Profile Modal --- */}
<ProfileModal />
</div>
)
}
