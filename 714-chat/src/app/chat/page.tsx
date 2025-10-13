'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Image from 'next/image'
import EmojiPicker, { Theme } from 'emoji-picker-react'

type Message = {
  id: string
  user_id: string
  username: string
  avatar_url: string
  content: string
  image_url?: string
  created_at: string
}

export default function ChatPage() {
  const [user, setUser] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [showEmoji, setShowEmoji] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [replyTo, setReplyTo] = useState<Message | null>(null)

  // ⏰ Time formatting
  const timeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return date.toLocaleDateString()
  }

  // 🧠 Get logged in user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session?.user) window.location.href = '/login'
      else setUser(data.session.user)
      setLoading(false)
    }
    getUser()
  }, [])

  // 💬 Fetch + subscribe to messages
  useEffect(() => {
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
      if (!error && data) setMessages(data)
    }
    loadMessages()

    const channel = supabase
      .channel('realtime:messages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          if (payload.eventType === 'INSERT')
            setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
  supabase.removeChannel(channel)
}

  }, [])

  // 🕒 Refresh timestamps
  useEffect(() => {
    const timer = setInterval(() => setMessages((m) => [...m]), 30000)
    return () => clearInterval(timer)
  }, [])

  // 📸 Upload image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)

    const fileName = `${user.id}-${Date.now()}-${file.name}`
    const { error } = await supabase.storage
      .from('chat-uploads')
      .upload(fileName, file, { upsert: true })

    if (!error) {
      const { data: publicUrl } = supabase.storage
        .from('chat-uploads')
        .getPublicUrl(fileName)
      setImageUrl(publicUrl.publicUrl)
    } else {
      alert(error.message)
    }
    setUploading(false)
  }

  // 🚀 Send message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() && !imageUrl) return

    const content = replyTo
      ? `↩️ Replying to ${replyTo.username}: ${replyTo.content}\n${newMessage}`
      : newMessage

    const { error } = await supabase.from('messages').insert({
      user_id: user.id,
      username:
        user.user_metadata.username ||
        user.user_metadata.full_name ||
        user.email.split('@')[0],
      avatar_url: user.user_metadata.avatar_url || '',
      content,
      image_url: imageUrl || null,
    })

    if (error) console.error(error)
    setNewMessage('')
    setImageUrl(null)
    setReplyTo(null)
  }

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-white bg-black">
        Loading chat...
      </div>
    )

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <header className="bg-blue-600 py-3 text-center font-semibold">
        💬 714 Global Chat
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.user_id === user.id ? 'justify-end' : ''
            }`}
          >
            {msg.user_id !== user.id && msg.avatar_url && (
              <img
                src={msg.avatar_url}
                alt={msg.username}
                className="w-8 h-8 rounded-full"
              />
            )}
            <div
              className={`p-3 rounded-xl max-w-xs break-words ${
                msg.user_id === user.id
                  ? 'bg-blue-600 text-white ml-auto'
                  : 'bg-zinc-800 text-gray-100'
              }`}
            >
              {msg.user_id !== user.id && (
                <p className="text-xs font-semibold text-gray-400 mb-1">
                  {msg.username}
                </p>
              )}
              {msg.image_url && (
                <Image
                  src={msg.image_url}
                  alt="upload"
                  width={200}
                  height={200}
                  className="rounded-lg mb-2 object-cover"

                />
              )}
              <p>{msg.content}</p>
              <p className="text-[10px] text-gray-400 mt-1 text-right">
                {timeAgo(msg.created_at)}
              </p>

              {/* Reaction & Reply */}
              <div className="flex gap-3 text-xs text-gray-400 mt-1">
                <button
                  onClick={() => setReplyTo(msg)}
                  className="hover:text-blue-400"
                >
                  💬 Reply
                </button>
                <button className="hover:text-red-400">❤️</button>
                <button className="hover:text-yellow-400">😂</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reply info */}
      {replyTo && (
        <div className="bg-zinc-800 p-2 text-sm text-gray-300">
          Replying to <strong>{replyTo.username}</strong> —{' '}
          <span className="italic">{replyTo.content}</span>
          <button
            className="ml-2 text-red-400"
            onClick={() => setReplyTo(null)}
          >
            ✖ Cancel
          </button>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="p-4 bg-zinc-900 border-t border-zinc-800 flex flex-col gap-2"
      >
        {imageUrl && (
          <div className="relative w-fit">
            <Image
              src={imageUrl}
              alt="preview"
              width={120}
              height={120}
              className="rounded-lg mb-2"
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowEmoji((v) => !v)}
            className="text-2xl"
          >
            😊
          </button>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
            className="text-sm text-gray-400"
          />
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-zinc-800 text-white rounded-lg px-4 py-2 focus:outline-none"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Send
          </button>
        </div>

{showEmoji && (
  <div className="mt-2">
    <EmojiPicker
      onEmojiClick={(emojiData) => setNewMessage((prev) => prev + emojiData.emoji)}
      theme={Theme.DARK}
    />
  </div>
)}

      </form>
    </div>
  )
}

