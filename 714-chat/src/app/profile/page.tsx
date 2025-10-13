'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Image from 'next/image'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        window.location.href = '/login'
        return
      }
      setUser(data.user)

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profile) {
        setUsername(profile.username || '')
        setAvatarUrl(profile.avatar_url || '')
      }
    }
    loadUser()
  }, [])

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      const file = e.target.files?.[0]
      if (!file || !user) return

      // ✅ Allow all image formats
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
      if (!validTypes.includes(file.type)) {
        alert('Please upload a valid image (png, jpg, jpeg, webp, or gif).')
        return
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (error) throw error

      const { data: publicUrl } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      setAvatarUrl(publicUrl.publicUrl)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setUploading(false)
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    const updates = {
      id: user.id,
      username,
      avatar_url: avatarUrl,
      updated_at: new Date(),
    }

    const { error } = await supabase.from('profiles').upsert(updates)
    setSaving(false)
    if (!error) {
      alert('Profile updated!')
      window.location.href = '/chat'
    } else {
      alert(error.message)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-blue-950 text-white px-6">
      <div className="bg-gray-900 rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4">Customize Your Profile 🎨</h2>

        {/* Avatar */}
        <div className="mb-4">
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

          {/* Hidden file input */}
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
        </div>

        {/* Username */}
        <input
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Email (readonly) */}
        <p className="text-gray-400 text-sm mb-4">{user?.email}</p>

        <button
          onClick={saveProfile}
          disabled={saving}
          className="w-full bg-green-600 hover:bg-green-700 transition text-white px-4 py-2 rounded-lg"
        >
          {saving ? 'Saving...' : 'Save & Go to Chat'}
        </button>
      </div>
    </div>
  )
}
