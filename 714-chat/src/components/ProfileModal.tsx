'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

export default function ProfileModal({
  userId,
  onClose,
}: {
  userId: string | null
  onClose: () => void
}) {
  const [username, setUsername] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // --- Fetch current logged-in user ---
  useEffect(() => {
    const loadCurrentUser = async () => {
      const { data } = await supabase.auth.getUser()
      setCurrentUserId(data?.user?.id || null)
    }
    loadCurrentUser()
  }, [])

  const isOwner = currentUserId === userId

  // --- Load profile info ---
  useEffect(() => {
    if (!userId) return
    const loadProfile = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, wallet_address')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('❌ Error loading profile:', error)
      } else if (data) {
        setUsername(data.username || '')
        setWalletAddress(data.wallet_address || '')
        setAvatarUrl(data.avatar_url || null)
      }

      setLoading(false)
    }

    loadProfile()
  }, [userId])

  // --- Upload avatar ---
  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      const file = event.target.files?.[0]
      if (!file) return

      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      if (publicUrlData?.publicUrl) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrlData.publicUrl })
          .eq('id', userId)

        if (updateError) throw updateError
        setAvatarUrl(publicUrlData.publicUrl)
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
    } finally {
      setUploading(false)
    }
  }

  // --- Save Profile Changes ---
  const saveProfile = async () => {
    try {
      setSaving(true)
      const { error } = await supabase
        .from('profiles')
        .update({
          username,
          wallet_address: walletAddress,
          updated_at: new Date(),
        })
        .eq('id', userId)

      if (error) throw error
      console.log('✅ Profile updated!')
      onClose()
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setSaving(false)
    }
  }

  // --- Loading state ---
  if (!userId) return null
  if (loading)
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/60 text-white z-50">
        Loading profile...
      </div>
    )

  // --- Main modal UI ---
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-zinc-900 rounded-2xl shadow-2xl p-8 w-full max-w-md text-center relative border border-zinc-800"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-4 text-gray-400 hover:text-white text-lg"
          >
            ✖
          </button>

          <h2 className="text-xl font-bold mb-5 text-white">
            {isOwner ? 'Your Profile' : 'User Profile'}
          </h2>

          {/* Avatar */}
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

          {/* Upload Button (Owner only) */}
          {isOwner && (
            <>
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
            </>
          )}

          {/* Username */}
          {isOwner ? (
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white mb-4 mt-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <p className="text-lg font-semibold text-white mt-4 mb-2">
              {username || 'No username set'}
            </p>
          )}

          {/* Wallet Address */}
          {isOwner ? (
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="Enter your wallet address"
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          ) : (
            <p className="text-sm text-gray-400 break-words mb-4">
              {walletAddress ? (
                <>
                  <span className="font-semibold text-gray-300">
                    Wallet Address:
                  </span>{' '}
                  {walletAddress}
                </>
              ) : (
                'No wallet address provided'
              )}
            </p>
          )}

          {/* Save Button (Owner only) */}
          {isOwner && (
            <button
              onClick={saveProfile}
              disabled={saving}
              className="w-full bg-green-600 hover:bg-green-700 transition text-white px-4 py-2 rounded-lg mt-2"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
