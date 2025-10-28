'use client';

import React, { useEffect, useState } from 'react';
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
  LogOut,
  User,
  Mail,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import Footer from '@/components/Footer';

/* ====== CONFIG: Replace these URLs with your own public image URLs ====== */
const LOGO_URL = 'https://i.postimg.cc/dQWBNrsH/favicon.jpg';
const HERO_URL = 'https://yourdomain.com/hero.png';
const FEATURE_CHAT = 'https://i.postimg.cc/wvCr1N1h/chat-interface.png';
const FEATURE_GIFT = 'https://i.postimg.cc/266ccwZP/ctip.png';
const FEATURE_AGENT = 'https://i.postimg.cc/L541BCgg/Ai-chat.png';
const FEATURE_TRADE = 'https://yourdomain.com/feature-trade.png';
const FEATURE_DASHBOARD = 'https://yourdomain.com/feature-dashboard.png';
const FEATURE_COMMUNITY = 'https://yourdomain.com/feature-community.png';
/* ======================================================================= */

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

/* ====== Motion variants ====== */
const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function LandingPageFull() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [session, setSession] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const [email, setEmail] = useState('');
  const [sendingMagicLink, setSendingMagicLink] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  // session check on mount
  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const s = data?.session ?? null;
        setSession(s);
        if (s?.user) {
          setUser(s.user);
        }
      } catch (e) {
        console.error('Session check error', e);
      }
    };
    init();

const {
  data: { subscription },
} = supabase.auth.onAuthStateChange((event, session) => {
  if (session?.user) {
    setSession(session);
    setUser(session.user);
  } else {
    setSession(null);
    setUser(null);
  }
});

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setAuthMessage('Signed out');
      router.push('/');
    } catch (e) {
      console.error('Sign out error', e);
      setAuthMessage('Error signing out');
    }
  };

  // send magic link
  const sendMagicLink = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) {
      setAuthMessage('Please enter your email');
      return;
    }
    setSendingMagicLink(true);
    setAuthMessage(null);
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setAuthMessage('Magic link sent. Check your email.');
      setEmail('');
    } catch (err: any) {
      console.error('Magic link error', err);
      setAuthMessage(err?.message ?? 'Could not send magic link');
    } finally {
      setSendingMagicLink(false);
    }
  };

  // Nav links
  const navLinks = [
    { label: 'Home', href: '/', Icon: Home },
    { label: 'Connect', href: '/connect', Icon: MessageSquare },
    { label: 'Agent', href: '/agent', Icon: Sparkles },
    { label: 'Dashboard', href: '/projects', Icon: LayoutDashboard },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm bg-black/40 border-b border-white/6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                className="md:hidden p-2 rounded-md hover:bg-white/6"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => router.push('/')}
              >
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white/5">
                  <Image src={LOGO_URL} alt="logo" fill className="object-cover" />
                </div>
                <div className="leading-tight">
                  <div className="font-semibold">SKIMA</div>
                  <div className="text-xs text-white/60">Where AI meets the chain</div>
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

            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full">
                    <User className="w-4 h-4" />
                    <span className="text-sm">{user.email ?? user.user_metadata?.name ?? 'User'}</span>
                  </div>
                  <button
                    onClick={signOut}
                    className="px-3 py-1 rounded-md bg-white/6 hover:bg-white/8 flex items-center gap-2"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline text-sm">Sign out</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSignIn(true)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-400 text-black font-semibold"
                  >
                    Sign in
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE SIDEBAR */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            className="relative w-72 max-w-full h-full bg-[#07070b] p-4 shadow-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden">
                  <Image src={LOGO_URL} alt="logo" fill className="object-cover" />
                </div>
                <div>
                  <div className="font-semibold">SKIMA</div>
                  <div className="text-xs text-white/60">AI on Base</div>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-md hover:bg-white/6">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-2">
              {navLinks.map((ln) => (
                <button
                  key={ln.href}
                  onClick={() => {
                    router.push(ln.href);
                    setSidebarOpen(false);
                  }}
                  className="flex items-center gap-3 p-3 rounded-md hover:bg-white/6 text-left"
                >
                  <ln.Icon className="w-5 h-5" />
                  <span>{ln.label}</span>
                </button>
              ))}
            </nav>

            <div className="mt-6">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-white/6">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium">{user.email ?? 'User'}</div>
                    <button onClick={signOut} className="text-sm text-white/70 hover:text-white mt-1">
                      Sign out
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <button
                    onClick={() => {
                      setShowSignIn(true);
                      setSidebarOpen(false);
                    }}
                    className="w-full px-4 py-2 rounded-xl bg-blue-600 text-black font-semibold"
                  >
                    Sign in
                  </button>
                </div>
              )}
            </div>
          </motion.aside>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="pt-20 flex-1">
        {/* HERO */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <motion.div initial="hidden" animate="show" variants={stagger}>
              <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-extrabold leading-tight">
                Chat, tip and automate on Base
              </motion.h1>
              <motion.p variants={fadeUp} className="mt-4 text-lg text-white/80 max-w-2xl">
                Connect peer to peer, send Base ETH and USDC directly in chat, and use Agent 714 to automate tasks and trades.
              </motion.p>

              <motion.div variants={fadeUp} className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => router.push('/agent')}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-400 text-black font-semibold"
                >
                  Try Agent
                </button>
                <button
                  onClick={() => router.push('/home')}
                  className="px-5 py-3 rounded-2xl bg-white/6 text-white border border-white/10"
                >
                  Enter SKIMA
                </button>
                <button
                  onClick={() => {
                    const el = document.getElementById('features');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-4 py-3 rounded-2xl bg-white/4 text-white/90 border border-white/8"
                >
                  Explore features
                </button>
              </motion.div>

              <motion.div variants={fadeUp} className="mt-6 text-sm text-white/60">
                <strong>Quick:</strong> Click any profile in chat to send Base ETH or USDC instantly.
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="flex justify-center"
            >
              <div className="w-full max-w-md rounded-3xl p-4 bg-white/5 border border-white/8 shadow-xl">
                <Image
                  src={HERO_URL}
                  alt="Hero"
                  width={600}
                  height={420}
                  className="rounded-xl object-cover"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold text-center mb-10"
          >
            Core features and upcoming releases
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((f, idx) => (
              <motion.article
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.5 }}
                className="rounded-2xl bg-white/5 border border-white/8 p-5 flex flex-col"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-blue-600 text-black inline-flex">
                      <f.Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-blue-200">{f.title}</h3>
                  </div>
                </div>

                <p className="text-white/75 mt-3 flex-1">{f.desc}</p>

                <div className="mt-4 rounded-lg overflow-hidden h-40 bg-white/6">
                  <Image
                    src={f.imageUrl}
                    alt={f.title}
                    width={600}
                    height={360}
                    className="w-full h-full object-cover"
                  />
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl p-8 bg-gradient-to-r from-blue-700/10 to-purple-700/8 border border-white/8 flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <div>
              <h4 className="text-2xl font-bold">Ready to explore SKIMA?</h4>
              <p className="text-white/70 mt-1">Join now to chat, tip, and automate on chain with Agent 714.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/home')}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-400 text-black font-semibold"
              >
                Enter SKIMA
              </button>
              <button
                onClick={() => setShowSignIn(true)}
                className="px-5 py-3 rounded-2xl bg-white/6 border border-white/8 text-white"
              >
                Sign in
              </button>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />

      {/* SIGN IN MODAL */}
      {showSignIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowSignIn(false)}
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15 }}
            className="relative z-50 w-full max-w-md p-6 rounded-2xl bg-[#07070b] border border-white/8 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden">
                  <Image src={LOGO_URL} alt="logo" fill className="object-cover" />
                </div>
                <div>
                  <div className="font-semibold">Sign in to SKIMA</div>
                  <div className="text-xs text-white/60">Enter your email to get a magic link</div>
                </div>
              </div>
              <button onClick={() => setShowSignIn(false)} className="p-2 rounded-md hover:bg-white/6">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={sendMagicLink} className="space-y-3">
              <label className="block text-sm text-white/80">
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="w-4 h-4" />
                  Email
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1 w-full rounded-md bg-white/5 border border-white/8 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </label>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={sendingMagicLink}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-black font-semibold"
                >
                  {sendingMagicLink ? 'Sending...' : 'Send magic link'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    // wallet auth placeholder
                    setAuthMessage('Wallet auth coming soon');
                  }}
                  className="px-4 py-2 rounded-lg bg-white/6"
                >
                  Sign in with wallet
                </button>
              </div>

              {authMessage && <div className="text-sm text-white/70 mt-2">{authMessage}</div>}
            </form>

            <div className="mt-4 text-xs text-white/60">
              By signing in you agree to the terms of service.
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
