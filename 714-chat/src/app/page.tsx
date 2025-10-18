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
      {/* ================== HERO SECTION ================== */}
      <section className="relative h-screen flex flex-col items-center justify-center text-center px-6">
        {/* Background image with parallax effect */}
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src="/714.jpg"
            alt="background"
            fill
            className="object-cover brightness-50 scale-105 animate-[slowPan_60s_linear_infinite]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-gray-950/90" />
        </div>

        {/* Animated glows */}
        <div className="absolute w-96 h-96 bg-blue-500/20 blur-[120px] rounded-full -top-32 left-1/2 -translate-x-1/2 animate-pulse-slow" />
        <div className="absolute w-72 h-72 bg-purple-600/20 blur-[120px] rounded-full bottom-0 right-20 animate-pulse-slower" />

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative z-10"
        >
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            Welcome to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-500 animate-gradient-x">
              Agent 714 Space
            </span>
          </h1>

          <p className="text-lg md:text-xl mb-10 text-gray-300 max-w-2xl mx-auto leading-relaxed">
  ⚡ Connect. Chat. Have fun — fully onchain.
</p>


          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/home")}
            className="px-10 py-4 rounded-2xl font-semibold text-lg bg-gradient-to-r from-blue-500 to-purple-600 shadow-[0_0_25px_rgba(59,130,246,0.5)] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] transition-all duration-300 backdrop-blur-md border border-white/10"
          >
            🚀 Enter App
          </motion.button>
        </motion.div>
      </section>

      {/* ================== ABOUT SECTION ================== */}
      <section className="relative z-20 py-20 bg-gray-900/70 backdrop-blur-md border-t border-gray-800">
        <div className="max-w-5xl mx-auto px-6 space-y-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center text-blue-400 mb-8"
          >
            💬 Agent 714 Chat
          </motion.h2>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gray-800/70 rounded-2xl p-8 shadow-lg border border-gray-700 leading-relaxed text-gray-200"
          >
            <h3 className="text-2xl font-bold text-white mb-4">🚀 Getting Started</h3>
            <p>Log in to access the chat page and connect instantly. Once inside, you’ll see:</p>
            <ul className="list-disc list-inside mt-3 space-y-1">
              <li>Global chat feed</li>
              <li>Sidebar showing active users</li>
              <li>Profile and theme controls in the header</li>
            </ul>

            <h3 className="text-2xl font-bold text-white mt-8 mb-3">💡 Features Overview</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  title: "🗨️ Sending Messages",
                  desc: "Type and send messages instantly. Attach images, GIFs, or record a quick voice note.",
                },
                {
                  title: "😊 Emoji Picker",
                  desc: "Click the emoji icon beside the input bar to react or insert emojis into your messages.",
                },
                {
                  title: "👤 Viewing Profiles",
                  desc: "Tap on any user’s avatar to open their profile modal and check wallet details or send tips.",
                },
                {
                  title: "💸 Tipping Users",
                  desc: "Support your favorite users by tipping directly from their profile modal.",
                },
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.03 }}
                  className="bg-gray-700/40 rounded-xl p-5 border border-gray-600 transition"
                >
                  <h4 className="font-semibold text-blue-300 mb-2">{feature.title}</h4>
                  <p>{feature.desc}</p>
                </motion.div>
              ))}
            </div>

            <h3 className="text-2xl font-bold text-white mt-10 mb-4">✨ Summary</h3>
            <p className="text-gray-300 text-lg">
              <strong>Click. Chat. Tip. Connect.</strong> Everything happens inside one seamless
              interface. Explore profiles, and show appreciation with a quick
              tip.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ================== AI AGENT SECTION ================== */}
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
            Your personal AI crypto companion. Ask questions about tokens, projects, or the Base
            network. Paste any contract address or token symbol and get instant live price charts,
            feeds, and insights.
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
            onClick={() => router.push("/agent")}
            className="mt-12 px-10 py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-purple-600 to-blue-500 shadow-xl hover:shadow-purple-500/40 hover:scale-105 transition-transform duration-300"
          >
            🚀 Try Agent 714 Now
          </motion.button>

          <p className="text-gray-500 mt-10 italic">
            Powered by Base.
          </p>
        </div>
      </section>

      {/* ================== GLOBAL STYLES ================== */}
      <style jsx global>{`
        @keyframes slowPan {
          0% {
            transform: scale(1.05) translateY(0);
          }
          50% {
            transform: scale(1.08) translateY(-10px);
          }
          100% {
            transform: scale(1.05) translateY(0);
          }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradientMove 5s ease infinite;
        }
        @keyframes gradientMove {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-pulse-slow {
          animation: pulse 6s ease-in-out infinite;
        }
        .animate-pulse-slower {
          animation: pulse 9s ease-in-out infinite;
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}