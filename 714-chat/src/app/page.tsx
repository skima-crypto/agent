'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import {
  Mail,
  User,
  MessagesSquare,
  Sparkles,
  Gift,
  Database,
  Repeat,
} from 'lucide-react';

// === Replace these with your own image / logo URLs ===
const LOGO_BACKGROUND_URL = '/images/logo-bg.jpg';
const HERO_IMAGE_URL = '/images/hero-showcase.png';
const AGENT_UI_PREVIEW_URL = '/images/agent-ui-preview.png';
const FEATURES_IMAGE_URL = '/images/features-grid.png';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) router.push('/home');
    };
    checkSession();
  }, [router]);

  return (
    <div className="relative w-full min-h-screen bg-black text-white overflow-x-hidden">
      {/* Background texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 10% 20%, rgba(59,130,246,0.06), transparent 12%), radial-gradient(circle at 90% 80%, rgba(14,165,233,0.04), transparent 12%), linear-gradient(180deg, rgba(0,0,0,0.85), rgba(2,6,23,0.98))',
          backgroundBlendMode: 'screen, screen, normal',
        }}
      />

      {/* NAV */}
      <header className="fixed left-0 right-0 z-40 backdrop-blur-sm bg-black/30 border-b border-white/10">
        <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              {LOGO_BACKGROUND_URL && (
                <Image
                  src={LOGO_BACKGROUND_URL}
                  alt="logo background"
                  fill
                  className="rounded-full opacity-90 object-cover"
                />
              )}
              <div className="relative w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-400 shadow-md">
                <svg
                  viewBox="0 0 24 24"
                  className="w-6 h-6"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 8.5C8 5.5 16 5 18 8"
                    stroke="white"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6 15.5C8 18.5 16 19 18 15.5"
                    stroke="white"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            <div>
              <div className="font-semibold text-white text-lg">SKIMA</div>
              <div className="text-xs text-white/60 -mt-0.5">
                Where AI meets the chain
              </div>
            </div>
          </div>

          {/* Nav actions */}
          <nav className="flex items-center gap-4">
            <a
              href="https://twitter.com/agent714_"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-2 text-sm text-white/85 hover:text-white transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 5.92c-.66.29-1.36.49-2.11.58a3.7 3.7 0 0 0 1.62-2.04 7.36 7.36 0 0 1-2.33.88A3.68 3.68 0 0 0 12.3 8.1c0 .29.03.57.09.84A10.46 10.46 0 0 1 3.16 4.74a3.66 3.66 0 0 0 1.14 4.92c-.6-.02-1.16-.18-1.64-.45v.05c0 1.76 1.25 3.23 2.9 3.56-.5.14-1.03.17-1.58.06.45 1.4 1.74 2.42 3.27 2.45A7.36 7.36 0 0 1 2 19.53 10.38 10.38 0 0 0 7.13 21c6.07 0 9.39-5.07 9.39-9.46v-.43c.64-.44 1.2-.98 1.64-1.6-.58.26-1.2.44-1.86.52A3.63 3.63 0 0 0 22 5.92z" />
              </svg>
              <span>@agent714_</span>
            </a>
            <button
              onClick={() => router.push('/home')}
              className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-sm shadow-sm hover:scale-[1.02] transition-transform"
            >
              Open App
            </button>
          </nav>
        </div>
      </header>

      {/* MAIN */}
      <main className="w-full relative z-10 pt-20">
        {/* HERO */}
        <section className="relative min-h-[70vh] flex flex-col md:flex-row items-center justify-center px-6 md:px-10 gap-10 mt-10">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full md:w-1/2 text-center md:text-left"
          >
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4 text-white">
              SKIMA — chat, tip & automate on Base
            </h1>
            <p className="text-lg text-white/80 mb-6 max-w-xl mx-auto md:mx-0">
              Blue, black, and white — the new SKIMA brand. Connect peer-to-peer,
              chat seamlessly, and send gifts (Base ETH / USDC) directly inside
              chat.
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/agent')}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-400 text-black font-semibold shadow-md"
              >
                Try Agent
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/home')}
                className="px-6 py-3 rounded-2xl bg-white/6 border border-white/10 text-white font-medium"
              >
                Enter SKIMA
              </motion.button>
            </div>
            <p className="mt-6 text-sm text-white/60 max-w-md mx-auto md:mx-0">
              <strong>Quick:</strong> Click any profile in chat to send Base ETH
              or USDC — instantly.
            </p>
          </motion.div>

          {/* Right */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9 }}
            className="w-full md:w-1/2 flex justify-center md:justify-end"
          >
            <div className="w-full max-w-[420px] relative rounded-3xl bg-gradient-to-b from-white/5 to-white/[0.08] border border-white/10 backdrop-blur-2xl p-6 shadow-2xl overflow-hidden">
              <div className="absolute -left-20 -top-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
              <div className="absolute -right-10 -bottom-16 w-56 h-56 bg-blue-400/8 rounded-full blur-3xl" />
              <div className="relative z-10">
                {HERO_IMAGE_URL ? (
                  <Image
                    src={HERO_IMAGE_URL}
                    alt="Hero showcase"
                    width={400}
                    height={300}
                    className="rounded-2xl object-cover"
                  />
                ) : (
                  <div className="text-white/50 text-sm text-center p-10">
                    Add your hero image URL in <span className="font-mono">HERO_IMAGE_URL</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </section>

        {/* FEATURES */}
        <section className="py-16 bg-gradient-to-b from-black to-[#03060a]">
          <div className="max-w-6xl mx-auto px-6">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold text-blue-300 mb-6"
            >
              What SKIMA does
            </motion.h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <FeatureCard
                Icon={MessagesSquare}
                title="Peer-to-peer chat"
                desc="/connect lets you discover people and start private chats — realtime and simple."
                imageUrl={FEATURES_IMAGE_URL}
              />
              <FeatureCard
                Icon={Gift}
                title="Send gifts on Base"
                desc="Tip or gift Base ETH & USDC directly inside chat. No wallet hopping — it’s native."
                imageUrl={FEATURES_IMAGE_URL}
              />
              <FeatureCard
                Icon={Sparkles}
                title="Agent 714"
                desc="Switch between general, image-gen, or crypto modes inside /agent."
                imageUrl={FEATURES_IMAGE_URL}
              />
            </div>

            {/* Quick Tour */}
            <div className="rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur-sm">
              <h3 className="text-xl font-semibold text-blue-200 mb-3">
                Quick tour — how to get started
              </h3>
              <ol className="list-decimal list-inside text-white/80 space-y-2 text-sm md:text-base">
                <li className="flex items-start gap-3">
                  <Mail className="mt-1" /> Signup with email (or wallet).
                </li>
                <li className="flex items-start gap-3">
                  <User className="mt-1" /> Customize your profile.
                </li>
                <li className="flex items-start gap-3">
                  <MessagesSquare className="mt-1" /> Go to{' '}
                  <span className="font-medium">/connect</span> to chat.
                </li>
                <li className="flex items-start gap-3">
                  <Sparkles className="mt-1" /> Use{' '}
                  <span className="font-medium">/agent</span> for AI tools.
                </li>
                <li className="flex items-start gap-3">
                  <Gift className="mt-1" /> Send gifts in chat — Base ETH or USDC.
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-3xl font-bold mb-4">Ready to explore?</h3>
            <p className="text-white/80 mb-6">
              Join SKIMA to chat, tip, and let Agent 714 help you onchain.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => router.push('/home')}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-400 text-black font-semibold"
              >
                Enter SKIMA
              </button>
              <a
                href="https://twitter.com/agent714_"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-2xl bg-white/10 border border-white/10 text-white"
              >
                Follow @agent714_
              </a>
            </div>
          </motion.div>
        </section>

        <div className="h-20" />
      </main>

      <Footer />
    </div>
  );
}

// === FEATURE CARD COMPONENT ===
type FeatureCardProps = {
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  desc: string;
  imageUrl?: string;
};

function FeatureCard({ Icon, title, desc, imageUrl }: FeatureCardProps) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 160 }}
      className="rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur-sm flex flex-col gap-4 hover:bg-white/[0.07] transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-md bg-blue-600 text-black inline-flex">
          <Icon size={18} />
        </div>
        <div className="text-lg font-semibold text-blue-200">{title}</div>
      </div>

      <p className="text-white/75 flex-1 text-sm md:text-base leading-relaxed">
        {desc}
      </p>

      <div className="w-full h-28 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            width={300}
            height={160}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-white/50 text-xs md:text-sm text-center px-3">
            Add image URL in <span className="font-mono text-blue-300">FEATURES_IMAGE_URL</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
