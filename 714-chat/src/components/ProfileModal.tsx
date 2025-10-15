'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'

export default function ProfileModal({
  userId,
  onClose,
}: {
  userId: string | null
  onClose: () => void
}) {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  useEffect(() => {
    if (!userId) return
    const load = async () => {
      const { data } = await supabase.auth.getUser()
      const currentUser = data?.user
      if (!currentUser) return

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      setProfile(profileData)
      setUsername(profileData?.username || '')
      setAvatarUrl(profileData?.avatar_url || '')
      setLoading(false)
    }
    load()
  }, [userId])

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    setUploading(true)
    try {
      const fileName = `${userId}-${Date.now()}-${file.name}`
      const { error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
      setAvatarUrl(data.publicUrl)
    } finally {
      setUploading(false)
    }
  }

  const saveProfile = async () => {
    if (!userId) return
    setSaving(true)
    const updates = {
      id: userId,
      username,
      avatar_url: avatarUrl,
      updated_at: new Date(),
    }
    await supabase.from('profiles').upsert(updates)
    setSaving(false)
    alert('Profile updated!')
    onClose()
  }

  if (!userId) return null
  if (loading)
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/60 text-white">
        Loading profile...
      </div>
    )

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <div className="bg-zinc-900 rounded-2xl shadow-lg p-8 w-full max-w-md text-center relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-400 hover:text-white"
        >
          ✖
        </button>

        <h2 className="text-xl font-bold mb-4">Profile</h2>

        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt="avatar"
            width={100}
            height={100}
            className="rounded-full mx-auto mb-3 border-4 border-blue-500 object-cover"
          />
        ) : (
          <div className="w-24 h-24 bg-gray-700 rounded-full mx-auto mb-3 flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}

        <label
          htmlFor="avatar-upload"
          className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition"
        >
          {uploading ? 'Uploading...' : 'Upload Avatar'}
        </label>
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={uploadAvatar}
          className="hidden"
          disabled={uploading}
        />

        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
          className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 mt-4"
        />

        <button
          onClick={saveProfile}
          disabled={saving}
          className="w-full bg-green-600 hover:bg-green-700 transition text-white px-4 py-2 rounded-lg mt-2"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
