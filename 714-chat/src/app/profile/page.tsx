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
  const [darkMode, setDarkMode] = useState(true);

  const router = useRouter();
  const { address } = useAccount();

  // Set dark mode as default + restore preference
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = storedTheme === 'dark' || !storedTheme;
    setDarkMode(prefersDark);
    document.documentElement.classList.toggle('dark', prefersDark);
  }, []);

  // Toggle dark/light
  const toggleDark = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.classList.toggle('dark', newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  // Auto-fill wallet
  useEffect(() => {
    if (address) setWalletAddress(address);
  }, [address]);

  // Load user & profile
  useEffect(() => {
    const loadUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        router.push('/home');
        return;
      }

      setUser(data.user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profile) {
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

  return (
    <div
      className={`min-h-screen transition-colors duration-500 ${
        darkMode
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black text-gray-100'
          : 'bg-gradient-to-br from-blue-50 via-white to-gray-100 text-gray-900'
      }`}
    >
      <ChatHeader currentUserId={user?.id} setSelectedProfile={() => {}} onSearch={() => {}} />

      <div className="flex">
        <aside className="hidden md:block w-64 p-6">
          <Sidebar />
        </aside>

        <main className="flex-1 flex flex-col items-center justify-center py-20 px-6 relative">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDark}
            className="absolute top-8 right-8 flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 dark:bg-black/20 dark:hover:bg-black/30 backdrop-blur-md transition"
          >
            {darkMode ? (
              <>
                <Sun className="text-yellow-400 w-5 h-5" />
                <span className="text-sm font-medium">Light</span>
              </>
            ) : (
              <>
                <Moon className="text-blue-600 w-5 h-5" />
                <span className="text-sm font-medium">Dark</span>
              </>
            )}
          </button>

          {/* Profile Card */}
          <div
            className={`relative w-full max-w-lg rounded-3xl border backdrop-blur-xl shadow-2xl transition p-10 ${
              darkMode
                ? 'bg-gray-800/60 border-gray-700 text-gray-100'
                : 'bg-white/70 border-blue-100 text-gray-900'
            }`}
          >
            {/* Floating Profile Image */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2">
              <div className="relative group">
                {avatarUrl ? (
                  <div className="relative">
                    <Image
                      src={avatarUrl}
                      alt="avatar"
                      width={140}
                      height={140}
                      unoptimized
                      className="object-cover rounded-2xl border-4 border-blue-500 dark:border-blue-400 shadow-xl group-hover:scale-105 transition-transform"
                    />
                    <label
                      htmlFor="avatar-upload"
                      className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 rounded-2xl text-sm cursor-pointer transition"
                    >
                      Change
                    </label>
                  </div>
                ) : (
                  <label
                    htmlFor="avatar-upload"
                    className="w-36 h-36 bg-gray-300 dark:bg-gray-700 rounded-2xl flex items-center justify-center text-gray-500 dark:text-gray-400 cursor-pointer hover:scale-105 transition-transform"
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
            </div>

            <div className="mt-24 text-center">
              <h2 className="text-3xl font-bold mb-2">Your Profile</h2>
              <p className="text-gray-400 text-sm mb-8">
                Manage your username, avatar, and wallet address.
              </p>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                type="text"
                placeholder="Your wallet address"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Wallet Connect */}
            <div className="mt-6 flex justify-center">
              <ConnectButton />
            </div>

            {/* Email */}
            <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-6 mb-4">
              {user?.email}
            </p>

            {/* Save Button */}
            <button
              onClick={saveProfile}
              disabled={saving}
              className={`w-full py-3 mt-4 font-semibold rounded-xl transition transform hover:scale-[1.02] ${
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
