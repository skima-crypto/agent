"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";
import { Github, Twitter } from "lucide-react";
import { useTheme } from "next-themes";

export default function HomePage() {
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const { theme: themeRaw, systemTheme } = useTheme();
  const theme = themeRaw === "system" ? systemTheme : themeRaw;

  // SESSION + PROFILE
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user ?? null;
      setSessionUser(user);

      if (user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (!prof) router.push("/profile");
        else setProfile(prof);
      } else {
        setProfile(null);
      }
      setLoading(false);
    };
    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const user = session?.user ?? null;
        setSessionUser(user);
        if (user) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();
          if (!prof) router.push("/profile");
          else setProfile(prof);
        } else setProfile(null);
      }
    );

    return () => listener?.subscription?.unsubscribe?.();
  }, [router]);

  const handleGoogleLogin = async () => {
    try {
      const redirectUrl = `${window.location.origin}/home`;
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectUrl },
      });
    } catch (err: any) {
      toast.error("Google sign-in failed: " + (err.message || err));
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) return toast.error(error.message);
        toast.success("Account created! Check your email.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) return toast.error(error.message);
        toast.success("Signed in! Redirecting...");
        router.push("/home");
      }
    } catch (err: any) {
      toast.error("Auth failed: " + (err.message || err));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSessionUser(null);
    setProfile(null);
    toast.success("Logged out successfully");
    router.push("/");
  };

  if (loading) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-black text-white relative overflow-hidden">
      {/* Background pulsing glow */}
      <motion.div
        initial={{ opacity: 0.15, scale: 0.8 }}
        animate={{
          opacity: [0.15, 0.4, 0.15],
          scale: [0.9, 1.05, 0.9],
          rotate: [0, 360],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        className="absolute w-96 h-96 rounded-full bg-blue-600/20 blur-3xl"
      />

      {/* Logo inside circular container */}
      <div className="relative flex items-center justify-center mb-10">
        {/* Rotating outer ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full border border-blue-400/30 shadow-[0_0_40px_rgba(59,130,246,0.3)]"
        />

        {/* Inner circular glass container */}
        <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl overflow-hidden flex items-center justify-center">
          <motion.img
            src="https://i.postimg.cc/t4b28Nt9/714BG.jpg"
            alt="714 Logo"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0.5, 1, 0.5], scale: [0.95, 1, 0.95] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-28 h-28 rounded-full object-cover"
          />
        </div>
      </div>

      {/* Loading text */}
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="text-xl sm:text-2xl font-semibold tracking-widest text-center z-10 mb-4"
      >
        Initializing&nbsp;
        <span className="text-blue-400">AGENT&nbsp;</span>
      </motion.div>

      {/* Animated loading bar */}
      <div className="relative w-64 h-2 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute left-0 top-0 h-full w-1/3 bg-gradient-to-r from-blue-400 via-blue-300 to-transparent"
        />
      </div>

      {/* Subtle floating code sparks */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.3, 0] }}
        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
        className="absolute text-xs text-blue-300/50 bottom-10 font-mono tracking-widest"
      >
        SYSTEM&nbsp;BOOT&nbsp;—&nbsp;714.AI&nbsp;ACTIVE
      </motion.div>
    </div>
  );
}


  const rootThemeClass = theme === "dark" ? "dark" : "";

  return (
  <div className={`${rootThemeClass} flex flex-col min-h-screen bg-[#0B0E17] font-inter`}>
      <Toaster position="top-right" />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 lg:ml-64 p-6 pb-20 relative z-10 flex flex-col items-center transition-colors duration-500">


          <div className="max-w-7xl w-full mx-auto flex flex-col items-center">

          {/* Animated background */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <motion.div
              className="absolute left-[-10%] top-10 w-96 h-96 rounded-full opacity-30 blur-3xl bg-gradient-to-br from-blue-400 to-cyan-300"
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 8, repeat: Infinity }}
            />
            <motion.div
              className="absolute right-[-8%] bottom-0 w-80 h-80 rounded-full opacity-20 blur-3xl bg-gradient-to-tr from-indigo-500 to-blue-400"
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 9, repeat: Infinity }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/2 dark:from-transparent dark:to-transparent pointer-events-none" />
          </div>

          {/* Header */}
<header className="w-full flex items-center justify-between py-6">
  <div className="flex items-center gap-3">
    <span className="text-xl font-semibold text-slate-800 dark:text-white">
      SKIMA
    </span>
    <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 dark:bg-white/5 border border-white/10">
      <span className="text-xs text-blue-200 dark:text-blue-400 font-medium">
        Base Network
      </span>
    </div>
  </div>

  <div className="flex items-center gap-3">
    <ThemeToggle />
    {sessionUser && (
      <button
        onClick={handleLogout}
        className="px-3 py-2 rounded-xl border border-white/20 bg-white/5 text-sm text-white/90 hover:opacity-90 transition"
      >
        Logout
      </button>
    )}
  </div>
</header>

{/* Hero Intro */}
<section className="flex justify-center mt-10 mb-8">
  <motion.div
    initial={{ opacity: 0, scale: 0.9, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ duration: 0.8, ease: 'easeOut' }}
    className="relative text-center max-w-3xl w-full p-8 rounded-3xl
               bg-white/30 dark:bg-white/5 backdrop-blur-lg 
               border border-white/20 shadow-lg overflow-hidden"
  >
    {/* Animated background glow */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.3 }}
      transition={{ delay: 0.6, duration: 1.5 }}
      className="absolute inset-0 bg-gradient-to-br from-blue-400/30 via-purple-500/20 to-transparent blur-3xl -z-10"
    />

    <motion.h1
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="text-43xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4"
    >
      Welcome to <span className="text-blue-500">SKIMA</span>
    </motion.h1>

    <motion.p
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.8 }}
      className="text-base sm:text-lg text-slate-700 dark:text-slate-300 max-w-2xl mx-auto"
    >
      On-chain social experience where you can chat, tip friends in ETH,
      and explore the Base network, powered by <span className="font-semibold text-blue-500">Agent 714</span>,
      your built-in crypto assistant for live prices, charts, and insights.
    </motion.p>
  </motion.div>
</section>
          </div>

          {/* Auth Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-3xl rounded-2xl p-8 shadow-2xl backdrop-blur-md border border-white/10 bg-white/30 dark:bg-slate-800/60 dark:border-slate-700 mt-6"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                Get Started
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Sign in and explore Agent 714 Assistance, on-chain chat, tipping, and social fun.
              </p>
            </div>

            <div className="flex flex-col items-center gap-6">
              {!sessionUser ? (
                <>
                  <button
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white text-slate-800 font-semibold shadow hover:brightness-95 transition"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 48 48"
                    >
                      <path
                        fill="#fbc02d"
                        d="M43.6 20.6H42V20H24v8h11.3C34.1 31.2 29.6 34 24 34c-7.7 0-14-6.3-14-14s6.3-14 14-14c3.6 0 6.8 1.4 9.3 3.7l6.2-6.2C36.6 2.7 30.7 0 24 0 10.7 0 0 10.7 0 24s10.7 24 24 24c12.1 0 22.1-8.7 23.6-20H43.6z"
                      />
                    </svg>
                    Sign in with Google
                  </button>

                  <form
                    onSubmit={handleAuthSubmit}
                    className="w-full grid gap-4"
                    autoComplete="on"
                  >
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      type="email"
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/80 dark:bg-slate-700 dark:border-slate-600 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-400 transition"
                      required
                    />
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      type="password"
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/80 dark:bg-slate-700 dark:border-slate-600 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-400 transition"
                      required
                    />
                    <button
                      type="submit"
                      className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow hover:scale-[1.01] transition-transform"
                    >
                      {isSignUp ? "Create Account" : "Sign In"}
                    </button>
                  </form>

                  <button
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-sm text-blue-600 dark:text-blue-300 hover:underline mt-2"
                  >
                    Toggle to {isSignUp ? "Sign In" : "Sign Up"}
                  </button>
                </>
              ) : (
                <div className="w-full flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => router.push("home")}
                    className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 text-white font-medium shadow hover:opacity-95 transition"
                  >
                    Enter Chat
                  </button>
                  <button
                    onClick={() => router.push("/profile")}
                    className="flex-1 px-5 py-3 rounded-xl border border-white/10 bg-white/5 dark:bg-slate-700 text-slate-900 dark:text-slate-100 hover:opacity-95 transition"
                  >
                    My Profile
                  </button>
                </div>
              )}

              <div className="flex flex-col items-center mt-6 text-center">
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                  Reach us / Connect with:
                </p>
                <div className="flex gap-6">
                  <a
                    href="https://twitter.com/official_714_"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-500 hover:scale-110 transition"
                  >
                    <Twitter size={26} />
                  </a>
                </div>
              </div>
            </div>
          </motion.section>

          {/* 🚀 AI Agent Section */}
<motion.section
  initial={{ opacity: 0, y: 40 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.15, duration: 0.6, ease: "easeOut" }}
  className="relative w-full max-w-3xl mt-16 p-10 rounded-3xl border border-white/10
             bg-gradient-to-br from-white/30 via-white/20 to-transparent
             dark:from-slate-800/60 dark:via-slate-900/50 dark:to-slate-900/30
             shadow-2xl backdrop-blur-2xl overflow-hidden"
>
  {/* Decorative Ambient Glows */}
  <div className="absolute inset-0 pointer-events-none">
    <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-500/20 blur-3xl rounded-full" />
    <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-indigo-500/20 blur-3xl rounded-full" />
  </div>

  {/* Content */}
  <div className="relative z-10 text-center space-y-6">
    <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
      🤖 Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">Agent 714</span>
    </h3>

    <p className="text-base md:text-lg text-slate-700 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
      Your AI companion for the <span className="font-semibold text-sky-500">Base Network</span> — tracking tokens, 
      prices, and on-chain insights in real time. Paste any contract or token address to explore instant analytics.
    </p>

    <ul className="text-sm md:text-base text-slate-700 dark:text-slate-300 space-y-2 max-w-xs mx-auto text-left">
      <li>⚡ Real-time token prices & charts</li>
      <li>📊 Deep Base ecosystem analytics</li>
      <li>🔥 Discover trending on-chain projects</li>
    </ul>

    {/* CTA Button */}
    <motion.button
      whileHover={{ scale: 1.06, y: -2 }}
      whileTap={{ scale: 0.96 }}
      onClick={() => (window.location.href = '/agent')}
      className="group inline-flex items-center gap-2 px-7 py-3 rounded-2xl font-semibold
                 text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600
                 shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:shadow-indigo-400/50"
    >
      🚀 Try Agent 714
      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">→</span>
    </motion.button>
  </div>
</motion.section>


         </main>
      </div>

      <Footer />
    </div>
  );
}

