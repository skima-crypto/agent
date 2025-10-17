'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import ChatHeader from '@/components/ChatHeader';
import Sidebar from '@/components/Sidebar';
import { Moon, Sun } from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

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
      if (error || !data.user) {
        router.push('/home');
        return;
      }

      setUser(data.user);

      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (!profileErr && profile) {
        setUsername(profile.username || '');
        setAvatarUrl(profile.avatar_url || '');
        setWalletAddress(profile.wallet_address || '');
      }
    };

    loadUser();
  }, [router]);

  // Upload avatar
  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file || !user) return;

      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload a valid image file.');
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = urlData?.publicUrl ?? '';

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({ id: user.id, avatar_url: publicUrl }, { onConflict: 'id' });

      if (upsertError) throw upsertError;

      setAvatarUrl(publicUrl);
      alert('Avatar updated successfully!');
    } catch (err: any) {
      console.error('Upload error:', err);
      alert(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Save profile
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

      alert('Profile updated!');
      router.push('/home');
    } catch (err: any) {
      console.error('Save error:', err);
      alert(err?.message || 'Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  // Toggle dark mode
  const toggleDark = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark', !darkMode);
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-500 ${
        darkMode ? 'bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100' : 'bg-gradient-to-b from-blue-50 to-white text-gray-800'
      }`}
    >
      {/* Header + Sidebar */}
      <ChatHeader currentUserId={user?.id} setSelectedProfile={() => {}} onSearch={() => {}} />
      <div className="flex">
        <aside className="hidden md:block w-64 p-6">
          <Sidebar />
        </aside>

        <main className="flex-1 flex flex-col items-center justify-center py-16 px-6">
          <div
            className={`relative rounded-3xl shadow-2xl p-10 w-full max-w-md border ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-blue-100'
            }`}
          >
            {/* Dark/Light Toggle */}
            <button
              onClick={toggleDark}
              className="absolute top-5 right-5 p-2 rounded-full bg-opacity-20 hover:bg-opacity-30 transition"
            >
              {darkMode ? <Sun className="text-yellow-300" /> : <Moon className="text-blue-600" />}
            </button>

            <h2 className="text-3xl font-bold mb-2 text-center">
              Customize Your Profile ✨
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
              Set your username, avatar, and wallet to get started.
            </p>

            {/* Avatar */}
            <div className="relative group mb-8 flex justify-center">
              {avatarUrl ? (
                <div className="relative">
                  <Image
                    src={avatarUrl}
                    alt="avatar"
                    width={120}
                    height={120}
                    className="rounded-full border-4 border-blue-500 dark:border-blue-400 object-cover shadow-lg group-hover:scale-105 transition-transform"
                    unoptimized
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 text-white text-xs rounded-full cursor-pointer transition"
                  >
                    Change
                  </label>
                </div>
              ) : (
                <label
                  htmlFor="avatar-upload"
                  className="w-28 h-28 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-300 cursor-pointer"
                >
                  Upload
                </label>
              )}
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
              className="w-full px-4 py-2 rounded-xl mb-4 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />

            {/* Wallet Address */}
            <input
              type="text"
              placeholder="Your wallet address"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="w-full px-4 py-2 rounded-xl mb-6 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />

            {/* Wallet Connect */}
            <div className="mb-6 flex justify-center">
              <ConnectButton />
            </div>

            {/* Email */}
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">
              {user?.email}
            </p>

            {/* Save */}
            <button
              onClick={saveProfile}
              disabled={saving}
              className={`w-full py-3 rounded-xl font-semibold transition ${
                darkMode
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {saving ? 'Saving...' : 'Save & Continue'}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
