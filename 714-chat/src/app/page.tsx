'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const router = useRouter();

  // ✅ Check active Supabase session
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.push('/home');
      }
    };
    checkSession();
  }, [router]);

  return (
    <div className="relative min-h-screen w-full bg-gray-950 text-white overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative h-screen flex flex-col items-center justify-center text-center px-6">
        <Image
          src="/714.jpg"
          alt="background"
          fill
          className="object-cover brightness-50"
          priority
        />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative z-10"
        >
          <h1 className="text-6xl md:text-7xl font-extrabold mb-6 leading-tight drop-shadow-lg">
            Welcome to <span className="text-blue-400">714 Chat</span>
          </h1>
          <p className="text-lg md:text-xl mb-10 text-gray-200 max-w-2xl mx-auto">
            💬 A next-gen real-time chat experience featuring profiles, reactions,
            voice notes, and crypto tipping all in one seamless space.
          </p>

          <button
            onClick={() => router.push('/home')}
            className="px-10 py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-blue-500 to-purple-600 shadow-xl hover:shadow-2xl hover:scale-105 transition-transform duration-300"
          >
            🚀 Enter App
          </button>
        </motion.div>
      </div>

      {/* About Section */}
      <section className="relative z-20 py-20 bg-gray-900/70 backdrop-blur-md border-t border-gray-800">
        <div className="max-w-5xl mx-auto px-6 space-y-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center text-blue-400 mb-8"
          >
            💬 Chat + Profile System
          </motion.h2>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gray-800/70 rounded-2xl p-8 shadow-lg border border-gray-700 leading-relaxed text-gray-200"
          >
            <h3 className="text-2xl font-bold text-white mb-4">🚀 Getting Started</h3>
            <p>
              Log in to access the chat page and connect instantly. Once inside, you’ll see:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-1">
              <li>Global chat feed</li>
              <li>Sidebar showing active users</li>
              <li>Profile and theme controls in the header</li>
            </ul>

            <h3 className="text-2xl font-bold text-white mt-8 mb-3">💡 Features Overview</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="bg-gray-700/40 rounded-xl p-5 border border-gray-600 transition"
              >
                <h4 className="font-semibold text-blue-300 mb-2">🗨️ Sending Messages</h4>
                <p>
                  Type and send messages instantly. Attach images, GIFs, or record a quick
                  voice note.
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.03 }}
                className="bg-gray-700/40 rounded-xl p-5 border border-gray-600 transition"
              >
                <h4 className="font-semibold text-blue-300 mb-2">😊 Emoji Picker</h4>
                <p>
                  Click the emoji icon beside the input bar to react or insert emojis into your
                  messages.
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.03 }}
                className="bg-gray-700/40 rounded-xl p-5 border border-gray-600 transition"
              >
                <h4 className="font-semibold text-blue-300 mb-2">👤 Viewing Profiles</h4>
                <p>
                  Tap on any user’s avatar to open their profile modal and check wallet details
                  or send tips.
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.03 }}
                className="bg-gray-700/40 rounded-xl p-5 border border-gray-600 transition"
              >
                <h4 className="font-semibold text-blue-300 mb-2">💸 Tipping Users</h4>
                <p>
                  Support your favorite users by tipping directly from their profile modal.
                </p>
              </motion.div>
            </div>

            <h3 className="text-2xl font-bold text-white mt-10 mb-4">✨ Summary</h3>
            <p className="text-gray-300 text-lg">
              <strong>Click. Chat. Tip. Connect.</strong> Everything happens inside one
              seamless interface. Explore profiles, react with emojis, and show appreciation
              with a quick tip. Welcome to the future of social chat.
            </p>
          </motion.div>
        </div>
      </section>

      {/* AI Agent Section */}
      <section className="relative z-30 py-24 bg-gradient-to-b from-gray-900 via-gray-950 to-black border-t border-gray-800">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-5xl font-bold mb-6 text-purple-400"
          >
            🤖 Meet Agent 714
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            viewport={{ once: true }}
            className="text-gray-300 max-w-3xl mx-auto text-lg leading-relaxed"
          >
            Your personal AI crypto companion. Ask questions about tokens, projects, or Base
            network. Paste any contract address or token symbol and get instant live price
            charts, feeds, and insights.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            viewport={{ once: true }}
            className="mt-10 flex justify-center"
          >
            <div className="bg-gray-800/60 backdrop-blur-md border border-purple-500/40 rounded-2xl px-8 py-6 max-w-xl text-center shadow-lg hover:shadow-purple-600/30 transition">
              <h3 className="text-xl font-semibold text-purple-300 mb-2">
                💡 What Agent 714 Can Do
              </h3>
              <ul className="text-gray-300 list-disc list-inside text-left space-y-1">
                <li>Check live token prices with real-time feeds</li>
                <li>Display live price charts for any contract address or symbol</li>
                <li>Answer questions about the Base network</li>
                <li>Provide crypto insights and quick token overviews</li>
                <li>Offer personalized guidance inside the chat app</li>
              </ul>
            </div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            viewport={{ once: true }}
            onClick={() => router.push('/agent')}
            className="mt-12 px-10 py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-purple-600 to-blue-500 shadow-xl hover:shadow-purple-500/40 hover:scale-105 transition-transform duration-300"
          >
            🚀 Try Agent 714 Now
          </motion.button>

          <p className="text-gray-500 mt-10 italic">
            Powered by advanced AI and real-time crypto data.
          </p>
        </div>
      </section>
    </div>
  );
}
