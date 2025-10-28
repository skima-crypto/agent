'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Menu,
  X,
  Home,
  MessageSquare,
  Gift,
  Sparkles,
  Repeat,
  LayoutDashboard,
  Users2,
} from 'lucide-react';
import Footer from '@/components/Footer';

/* ====== CONFIG ====== */
const LOGO_URL = 'https://i.postimg.cc/dQWBNrsH/favicon.jpg';
const HERO_URL = 'https://i.postimg.cc/t4b28Nt9/714BG.jpg';
const FEATURE_CHAT = 'https://i.postimg.cc/wvCr1N1h/chat-interface.png';
const FEATURE_GIFT = 'https://i.postimg.cc/266ccwZP/ctip.png';
const FEATURE_AGENT = 'https://i.postimg.cc/L541BCgg/Ai-chat.png';
const FEATURE_TRADE = 'https://yourdomain.com/feature-trade.png';
const FEATURE_DASHBOARD = 'https://yourdomain.com/feature-dashboard.png';
const FEATURE_COMMUNITY = 'https://yourdomain.com/feature-community.png';
/* ==================== */

const FEATURES = [
  {
    Icon: MessageSquare,
    title: 'Peer to Peer Chat',
    desc:
      'Start private, real time chats with message delivery, previews, and reactions.',
    imageUrl: FEATURE_CHAT,
  },
  {
    Icon: Gift,
    title: 'Send Gifts on Base',
    desc: 'Tip friends and creators with Base ETH or USDC directly inside chat.',
    imageUrl: FEATURE_GIFT,
  },
  {
    Icon: Sparkles,
    title: 'Agent 714',
    desc: 'Use AI tools inside the agent for image gen, crypto helpers, and quick commands.',
    imageUrl: FEATURE_AGENT,
  },
  {
    Icon: Repeat,
    title: 'Recurring Buy Sell Agent',
    desc:
      'Automate recurring trades with schedules, rules, and customizable strategies.',
    imageUrl: FEATURE_TRADE,
  },
  {
    Icon: LayoutDashboard,
    title: 'Project Dashboard',
    desc: 'Host airdrop events, track engagement, and onboard users with analytics.',
    imageUrl: FEATURE_DASHBOARD,
  },
  {
    Icon: Users2,
    title: 'Group and Community',
    desc:
      'Create private or gated communities to share insights, signals, and collaborate.',
    imageUrl: FEATURE_COMMUNITY,
  },
];

export default function LandingPageFull() {
  const router = useRouter();

  const navLinks = [
    { label: 'Home', href: '/', Icon: Home },
    { label: 'Connect', href: '/connect', Icon: MessageSquare },
    { label: 'Agent', href: '/agent', Icon: Sparkles },
    { label: 'Dashboard', href: '/dashboard', Icon: LayoutDashboard },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-blue-950 text-white">
      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm bg-black/40 border-b border-white/6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => router.push('/')}
            >
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white/5">
                <Image src={LOGO_URL} alt="logo" fill className="object-cover" />
              </div>
              <div className="leading-tight">
                <div className="font-semibold">SKIMA</div>
                <div className="text-xs text-white/60">
                  Where AI meets the chain
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((ln) => (
                <button
                  key={ln.href}
                  onClick={() => router.push(ln.href)}
                  className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition"
                >
                  <ln.Icon className="w-4 h-4" />
                  {ln.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="pt-24 pb-24 flex-1">
        {/* HERO SECTION */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
                Chat, tip and automate on Base
              </h1>
              <p className="mt-4 text-lg text-white/80 max-w-2xl">
                Connect peer to peer, send Base ETH and USDC directly in chat,
                and use Agent 714 to automate tasks and trades.
              </p>

              <div className="mt-8">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-10 py-5 text-2xl md:text-3xl font-extrabold rounded-3xl bg-gradient-to-r from-blue-600 to-blue-400 text-black shadow-lg hover:scale-105 transition"
                >
                  ENTER APP
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="flex justify-center"
            >
              <div className="w-full max-w-md rounded-3xl p-4 bg-white/5 border border-white/8 shadow-xl overflow-hidden">
                <div className="relative w-full h-80">
                  <Image
                    src={HERO_URL}
                    alt="Hero"
                    fill
                    className="object-cover rounded-xl"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* FEATURES */}
        <section
          id="features"
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
            Core features and upcoming releases
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((f, idx) => (
              <motion.article
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.5 }}
                className="rounded-2xl bg-white/5 border border-white/8 p-5 flex flex-col"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-md bg-blue-600 text-black inline-flex">
                    <f.Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-blue-200">
                    {f.title}
                  </h3>
                </div>

                <p className="text-white/75 flex-1">{f.desc}</p>

                {/* Fixed image container */}
                <div className="mt-4 rounded-xl overflow-hidden w-full h-48 bg-white/10 relative">
                  <Image
                    src={f.imageUrl}
                    alt={f.title}
                    fill
                    className="object-cover"
                  />
                </div>
              </motion.article>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
