'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ethers } from 'ethers'

// ✅ Tipper contract details
const TIPPER_ADDRESS = '0xd6cD246C2207eda9b75779F03677de4a8DBa2309'
const TIPPER_ABI = [
  'function tipNative(address payable recipient) external payable',
  'function tipERC20(address token, address recipient, uint256 amount) external',
]

// ✅ Base Mainnet token addresses
const TOKENS = [
  { symbol: 'ETH', address: ethers.ZeroAddress, decimals: 18 },
  { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7c32D4f71b54bdA02913', decimals: 6 },
]

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

  // tip state
  const [showTipModal, setShowTipModal] = useState(false)
  const [selectedToken, setSelectedToken] = useState(TOKENS[0])
  const [amount, setAmount] = useState('')
  const [sending, setSending] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)

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

      if (!error && data) {
        setUsername(data.username || '')
        setWalletAddress(data.wallet_address || '')
        setAvatarUrl(data.avatar_url || null)
      } else console.error(error)
      setLoading(false)
    }

    loadProfile()
  }, [userId])

  // --- Upload Avatar ---
  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      const file = event.target.files?.[0]
      if (!file) return

      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true })
      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
      const publicUrl = publicUrlData?.publicUrl
      if (publicUrl) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', userId)
        if (updateError) throw updateError
        setAvatarUrl(publicUrl)
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
    } finally {
      setUploading(false)
    }
  }

  // --- Save Profile ---
  const saveProfile = async () => {
    try {
      setSaving(true)
      const { error } = await supabase
        .from('profiles')
        .update({
          username,
          wallet_address: walletAddress.trim(),
          updated_at: new Date(),
        })
        .eq('id', userId)
      if (error) throw error
      alert('✅ Profile updated!')
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setSaving(false)
    }
  }

  // --- Tip Function ---
  const sendTip = async () => {
    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      alert('User does not have a valid wallet address.')
      return
    }
    if (!amount || parseFloat(amount) <= 0) {
      alert('Enter a valid amount.')
      return
    }

    try {
      setSending(true)
      setTxHash(null)

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(TIPPER_ADDRESS, TIPPER_ABI, signer)
      const amt = ethers.parseUnits(amount, selectedToken.decimals)

      let tx
      if (selectedToken.symbol === 'ETH') {
        tx = await contract.tipNative(walletAddress, { value: amt })
      } else {
        tx = await contract.tipERC20(selectedToken.address, walletAddress, amt)
      }

      const receipt = await tx.wait()
      setTxHash(receipt.hash)
      alert('🎉 Tip sent successfully!')
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`)
    } finally {
      setSending(false)
    }
  }

  // --- Render ---
  if (!userId) return null
  if (loading)
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/60 text-white z-50">
        Loading profile...
      </div>
    )

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <motion.div className="bg-zinc-900 rounded-2xl shadow-2xl p-8 w-full max-w-md text-center border border-zinc-800">
          <button onClick={onClose} className="absolute top-3 right-4 text-gray-400 hover:text-white text-lg">✖</button>

          <h2 className="text-xl font-bold mb-5 text-white">{isOwner ? 'Your Profile' : 'User Profile'}</h2>

          {/* Avatar */}
          {avatarUrl ? (
            <Image src={avatarUrl} alt="avatar" width={100} height={100} className="rounded-full mx-auto mb-3 border-4 border-blue-500 object-cover" />
          ) : (
            <div className="w-24 h-24 bg-gray-700 rounded-full mx-auto mb-3 flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}

          {/* Upload button */}
          {isOwner && (
            <>
              <label htmlFor="avatar-upload" className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                {uploading ? 'Uploading...' : 'Upload Avatar'}
              </label>
              <input id="avatar-upload" type="file" accept="image/*" onChange={uploadAvatar} className="hidden" />
            </>
          )}

          {/* Username */}
          {isOwner ? (
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white mt-4 mb-3"
            />
          ) : (
            <p className="text-lg font-semibold text-white mt-4 mb-2">{username || 'No username set'}</p>
          )}

          {/* Wallet field (editable) */}
          {isOwner ? (
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="Enter your wallet address"
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white mb-4"
            />
          ) : (
            <p className="text-sm text-gray-400 break-words mb-4">
              <span className="font-semibold text-gray-300">Wallet:</span>{' '}
              {walletAddress || 'No wallet address'}
            </p>
          )}

          {/* Buttons */}
          {isOwner ? (
            <button
              onClick={saveProfile}
              disabled={saving}
              className="w-full bg-green-600 hover:bg-green-700 transition text-white px-4 py-2 rounded-lg"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          ) : (
            <button
              onClick={() => setShowTipModal(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 transition text-white px-4 py-2 rounded-lg"
            >
              💸 Tip {username || 'User'}
            </button>
          )}

          {/* Tip Modal */}
          <AnimatePresence>
            {showTipModal && (
              <motion.div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                <motion.div className="bg-zinc-900 p-6 rounded-2xl w-full max-w-sm border border-zinc-700 text-white">
                  <h3 className="text-lg font-bold mb-4">Send a Tip 💰</h3>

                  <select
                    className="w-full bg-gray-800 border border-gray-600 p-2 rounded mb-3"
                    value={selectedToken.symbol}
                    onChange={(e) =>
                      setSelectedToken(TOKENS.find((t) => t.symbol === e.target.value) || TOKENS[0])
                    }
                  >
                    {TOKENS.map((t) => (
                      <option key={t.symbol}>{t.symbol}</option>
                    ))}
                  </select>

                  <input
                    type="number"
                    placeholder="Enter amount (e.g. 0.001)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 p-2 rounded mb-4"
                  />

                  <div className="flex gap-3">
                    <button
                      onClick={sendTip}
                      disabled={sending}
                      className="flex-1 bg-green-600 hover:bg-green-700 rounded p-2"
                    >
                      {sending ? 'Sending...' : 'Send Tip'}
                    </button>
                    <button onClick={() => setShowTipModal(false)} className="flex-1 bg-gray-700 rounded p-2">
                      Cancel
                    </button>
                  </div>

                  {txHash && (
                    <p className="text-xs text-green-400 mt-2">
                      ✅ Tx:{' '}
                      <a href={`https://basescan.org/tx/${txHash}`} target="_blank" className="underline">
                        {txHash}
                      </a>
                    </p>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
