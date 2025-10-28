'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        router.push('/home');
      }
    };
    checkSession();
  }, [router]);

  return (
    <div className="relative w-full min-h-screen bg-[#020617] text-white overflow-x-hidden">
      {/* subtle textured background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 10% 10%, rgba(59,130,246,0.06), transparent 12%), radial-gradient(ellipse at 90% 90%, rgba(96,165,250,0.04), transparent 12%), linear-gradient(180deg, rgba(2,6,23,0.6), rgba(2,6,23,0.95))',
          backgroundBlendMode: 'screen, screen, normal',
        }}
      />

      {/* NAV */}
      <header className="fixed left-0 right-0 z-40 backdrop-blur-md bg-white/3 border-b border-white/5">
        <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* simple SKIMA icon (blue rounded S) */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-400 shadow-md"
              aria-hidden
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 8.5C8 5.5 16 5 18 8" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 15.5C8 18.5 16 19 18 15.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div>
              <div className="font-semibold">SKIMA</div>
              <div className="text-xs text-white/60 -mt-0.5">Where AI meets the chain</div>
            </div>
          </div>

          <nav className="flex items-center gap-4">
            <a
              href="https://twitter.com/agent714_"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-white/85 hover:text-white transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 5.92c-.66.29-1.36.49-2.11.58a3.7 3.7 0 0 0 1.62-2.04 7.36 7.36 0 0 1-2.33.88A3.68 3.68 0 0 0 12.3 8.1c0 .29.03.57.09.84A10.46 10.46 0 0 1 3.16 4.74a3.66 3.66 0 0 0 1.14 4.92c-.6-.02-1.16-.18-1.64-.45v.05c0 1.76 1.25 3.23 2.9 3.56-.5.14-1.03.17-1.58.06.45 1.4 1.74 2.42 3.27 2.45A7.36 7.36 0 0 1 2 19.53 10.38 10.38 0 0 0 7.13 21c6.07 0 9.39-5.07 9.39-9.46v-.43c.64-.44 1.2-.98 1.64-1.6-.58.26-1.2.44-1.86.52A3.63 3.63 0 0 0 22 5.92z" />
              </svg>
              <span className="hidden md:inline">@agent714_</span>
            </a>

            <a
              href="https://twitter.com/0xskima"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-white/85 hover:text-white transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 5.92c-.66.29-1.36.49-2.11.58a3.7 3.7 0 0 0 1.62-2.04 7.36 7.36 0 0 1-2.33.88A3.68 3.68 0 0 0 12.3 8.1c0 .29.03.57.09.84A10.46 10.46 0 0 1 3.16 4.74a3.66 3.66 0 0 0 1.14 4.92c-.6-.02-1.16-.18-1.64-.45v.05c0 1.76 1.25 3.23 2.9 3.56-.5.14-1.03.17-1.58.06.45 1.4 1.74 2.42 3.27 2.45A7.36 7.36 0 0 1 2 19.53 10.38 10.38 0 0 0 7.13 21c6.07 0 9.39-5.07 9.39-9.46v-.43c.64-.44 1.2-.98 1.64-1.6-.58.26-1.2.44-1.86.52A3.63 3.63 0 0 0 22 5.92z" />
              </svg>
              <span className="hidden md:inline">@0xskima</span>
            </a>

            <button
              onClick={() => router.push('/home')}
              className="ml-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-black font-semibold text-sm shadow-sm hover:scale-[1.02] transition-transform"
            >
              Open App
            </button>
          </nav>
        </div>
      </header>

      {/* PAGE CONTENT */}
      <main className="w-full relative z-10 pt-20">
        {/* HERO */}
        <section className="relative h-[86vh] flex items-center">
          <div className="max-w-6xl mx-auto w-full px-6 flex items-center gap-10">
            {/* left content */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full md:w-1/2"
            >
              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4">
                SKIMA, your unified onchain ecosystem
              </h1>
              <p className="text-lg text-white/80 mb-6 max-w-xl">
                Build, connect, and automate, all on Base. SKIMA brings AI (Agent 714), social tools,
                and decentralized flows into one modern experience.
              </p>

              <div className="flex items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push('/agent')}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 text-black font-semibold shadow-md"
                >
                  Try Agent 714
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

              <div className="mt-6 text-sm text-white/60 max-w-md">
                <strong>Tip:</strong> Click any profile to send Base ETH or USDC instantly.
              </div>
            </motion.div>

            {/* right art / glass card */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9 }}
              className="hidden md:flex md:w-1/2 justify-end"
            >
              <div className="w-[420px] relative rounded-3xl bg-gradient-to-b from-white/3 to-white/2/5 border border-white/6 backdrop-blur-2xl p-6 shadow-2xl overflow-hidden">
                {/* decorative blurred shapes */}
                <div className="absolute -left-20 -top-20 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl transform rotate-12" />
                <div className="absolute -right-10 -bottom-16 w-56 h-56 bg-blue-500/8 rounded-full blur-3xl" />

                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold">
                      A7
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Agent 714</div>
                      <div className="text-xs text-white/60">AI companion • on Base</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-b from-[#021028]/40 to-[#021028]/20 rounded-xl p-4 border border-white/5">
                    <div className="text-xs text-white/70 mb-2">Insights • Quick view</div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <div className="text-3xl font-semibold">Ξ 0.042</div>
                        <div className="text-xs text-white/50">Price (Base)</div>
                      </div>
                      <div className="w-24 h-24 rounded-xl bg-gradient-to-tr from-blue-500 to-cyan-300/40 flex items-center justify-center text-white/900 font-semibold">
                        SIG
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 text-sm text-white/70">
                    Ask Agent 714 about token metrics, contract addresses, or quick onchain tips — right from the app.
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ABOUT SKIMA */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-6">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold text-blue-300 mb-6"
            >
              What is SKIMA?
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-white/80 max-w-3xl leading-relaxed mb-8"
            >
              SKIMA is a unified onchain ecosystem on <span className="font-medium">@base</span>.
              It hosts Agent 714 (our AI), messaging, tipping, and tools for projects to reward communities.
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: 'Unified UX',
                  desc: 'One interface for chat, payments, and agent-powered insights — simple and fast.',
                },
                {
                  title: 'Agent 714',
                  desc: 'AI that provides market insights, automation, and human-like assistance for crypto users.',
                },
                {
                  title: 'Onchain-first',
                  desc: 'Send tips, interact with contracts, and run community rewards natively on Base.',
                },
              ].map((c, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -6 }}
                  transition={{ type: 'spring', stiffness: 160 }}
                  className="rounded-2xl p-6 bg-white/3 border border-white/6 backdrop-blur-sm"
                >
                  <div className="text-xl font-semibold text-blue-200 mb-2">{c.title}</div>
                  <div className="text-white/75">{c.desc}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* AGENT 714 DEDICATED */}
        <section className="py-20 bg-gradient-to-b from-[#010615] to-[#020617] border-t border-white/6">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="md:w-1/2"
              >
                <h3 className="text-4xl font-bold text-purple-300 mb-4">Agent 714 — the AI inside SKIMA</h3>
                <p className="text-white/80 mb-6">
                  Built on <span className="font-medium">@base</span>, Agent 714 focuses on AI features, 
                  market insights, automated assistance, token summaries, and smart responses inside the chat
                  experience.
                </p>

                <ul className="list-disc list-inside text-white/75 space-y-2">
                  <li>Get quick token overviews and explanations</li>
                  <li>Ask about contract addresses or token metrics</li>
                  <li>Receive automated workflows and suggestions</li>
                  <li>Integrates with tipping and onchain actions</li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="md:w-1/2"
              >
                <div className="rounded-2xl p-6 bg-gradient-to-br from-white/4 to-white/6 border border-white/6 backdrop-blur-sm">
                  <div className="text-sm text-white/60 mb-3">Live demo (static preview)</div>
                  <div className="w-full h-44 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-300/20 flex items-center justify-center text-white/900 font-semibold text-lg">
                    Agent 714 UI
                  </div>
                  <div className="mt-4 text-white/70 text-sm">
                    Try it in the app to ask questions, fetch token data, and experiment with automation.
                  </div>

                  <div className="mt-6 flex gap-3">
                    <a
                      href="https://agent714.vercel.app/agent/general"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg bg-blue-500 text-black font-semibold"
                    >
                      Open Agent Demo
                    </a>
                    <a
                      href="https://agent714.vercel.app/connect/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg bg-white/6 border border-white/6 text-white"
                    >
                      Connect
                    </a>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <motion.div initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
              <h3 className="text-3xl font-bold mb-4">Ready to explore?</h3>
              <p className="text-white/80 mb-6">Join SKIMA and let Agent 714 help you onchain, connect, chat, tip, and discover.</p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => router.push('/home')}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 text-black font-semibold"
                >
                  Enter SKIMA
                </button>
                <a
                  href="https://twitter.com/agent714_"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 rounded-2xl bg-white/6 border border-white/6 text-white"
                >
                  Follow @agent714_
                </a>
                <a
                  href="https://twitter.com/0xskima"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 rounded-2xl bg-white/6 border border-white/6 text-white"
                >
                  Follow @0xskima
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* spacer to ensure footer doesn't overlap content */}
        <div className="h-36 md:h-44" />
      </main>

      {/* Footer (kept as your Footer component) */}
      <Footer />

      {/* extra bottom padding safe area */}
      <div className="h-8 md:h-12" />

      {/* styles (texture, animations) */}
      <style jsx>{`
        /* subtle keyframes for floating / pulsing */
        @keyframes floatUp {
          0% {
            transform: translateY(0px);
            opacity: 0.9;
          }
          50% {
            transform: translateY(-8px);
            opacity: 1;
          }
          100% {
            transform: translateY(0px);
            opacity: 0.9;
          }
        }

        /* link focus styles for accessibility */
        a:focus,
        button:focus {
          outline: 3px solid rgba(59, 130, 246, 0.25);
          outline-offset: 2px;
        }

        /* small responsive tweaks to prevent overlap of fixed header */
        main {
          scroll-margin-top: 72px;
        }

        /* glass card subtle noise (using CSS gradients) */
        .glass-noise {
          background-image: radial-gradient(circle at 10% 20%, rgba(255,255,255,0.02) 0px, transparent 8px),
            radial-gradient(circle at 70% 80%, rgba(255,255,255,0.01) 0px, transparent 24px);
        }
      `}</style>
    </div>
  );
}
