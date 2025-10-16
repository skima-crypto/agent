'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import ChatHeader from '@/components/ChatHeader';
import Sidebar from '@/components/Sidebar'; // adjust path if needed

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const router = useRouter();
  const { address } = useAccount();

  // Auto-fill wallet when connected
  useEffect(() => {
    if (address) setWalletAddress(address);
  }, [address]);

  // Load user + existing profile
  useEffect(() => {
    const loadUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Auth getUser error:', error);
        router.push('/home');
        return;
      }
      if (!data.user) {
        router.push('/home');
        return;
      }
      setUser(data.user);

      // Load profile from DB
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileErr) {
        console.error('Error fetching profile:', profileErr);
      } else if (profile) {
        setUsername(profile.username || '');
        setAvatarUrl(profile.avatar_url || '');
        setWalletAddress(profile.wallet_address || '');
      }
    };

    loadUser();
  }, [router]);

  // Upload avatar and immediately save it to the user's profile
const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
  try {
    setUploading(true);
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image (png, jpg, jpeg, webp, or gif).');
      return;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload file
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const publicUrl = urlData?.publicUrl ?? '';

    // Save the new avatar to the user's profile right away
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({ id: user.id, avatar_url: publicUrl }, { onConflict: 'id' });

    if (upsertError) throw upsertError;

    // Update UI immediately
    setAvatarUrl(publicUrl);
    alert('Avatar updated successfully!');
  } catch (err: any) {
    console.error('Upload avatar error:', err);
    alert(err?.message || 'Upload failed');
  } finally {
    setUploading(false);
  }
};

// Save profile without redirecting immediately
const saveProfile = async () => {
  if (!user) return;
  setSaving(true);
  try {
    const updates = {
      id: user.id,
      username,
      avatar_url: avatarUrl,
      wallet_address: walletAddress,
      updated_at: new Date(),
    };

    const { error } = await supabase.from('profiles').upsert([updates], { onConflict: 'id' });
    if (error) throw error;

    // Refresh profile data to confirm changes before redirect
    const { data: refreshedProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (refreshedProfile) {
      setUsername(refreshedProfile.username || '');
      setAvatarUrl(refreshedProfile.avatar_url || '');
      setWalletAddress(refreshedProfile.wallet_address || '');
    }

    alert('Profile updated!');
    router.push('/home'); // move after successful confirmation
  } catch (err: any) {
    console.error('Save profile error:', err);
    alert(err?.message || 'Error saving profile');
  } finally {
    setSaving(false);
  }
};


  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white text-gray-800">
      {/* Header + Sidebar */}
      <ChatHeader currentUserId={user?.id} setSelectedProfile={() => {}} onSearch={() => {}} />
      <div className="flex">
        <aside className="hidden md:block w-64 p-6">
          <Sidebar />
        </aside>

        <main className="flex-1 flex flex-col items-center justify-center py-16 px-6">
          <div className="bg-white border border-blue-100 rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
            <h2 className="text-3xl font-bold text-blue-700 mb-2">Customize Your Profile ✨</h2>
            <p className="text-gray-500 mb-6">Set your username, avatar, and wallet to get started.</p>

            {/* Avatar Upload */}
            <div className="mb-6">
              {avatarUrl ? (
                // use unoptimized so external Supabase URL shows without next.config change
                <Image
                  src={avatarUrl}
                  alt="avatar"
                  width={110}
                  height={110}
                  className="rounded-full mx-auto mb-3 border-4 border-blue-500 object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-28 h-28 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center text-gray-400">
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
            </div>

            {/* Username */}
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-100 border border-gray-300 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />

            {/* Wallet Address */}
            <input
              type="text"
              placeholder="Your wallet address"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-100 border border-gray-300 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />

            {/* Connect Wallet */}
            <div className="mb-6 flex justify-center">
              <ConnectButton />
            </div>

            {/* Email */}
            <p className="text-gray-500 text-sm mb-6">{user?.email}</p>

            <button
              onClick={saveProfile}
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 transition text-white px-4 py-2 rounded-lg font-semibold"
            >
              {saving ? 'Saving...' : 'Save & Continue'}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
