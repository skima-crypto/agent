"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import ThemeToggle from "@/components/ThemeToggle";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";
import { Github, Twitter } from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";

export default function HomePage() {
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  // Read theme from next-themes so we can add 'dark' class on this root element
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
      const redirectUrl = `${window.location.origin}/chat`;
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
        router.push("/chat");
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
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-black text-white">
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-2xl font-semibold tracking-widest"
        >
          Initializing 714 Chat...
        </motion.div>
      </div>
    );
  }

  // Add 'dark' class locally so tailwind dark: variants apply to the whole subtree
  const rootThemeClass = theme === "dark" ? "dark" : "";

  return (
    <div className={`${rootThemeClass} relative min-h-screen font-inter`}>
      <Toaster position="top-right" />
      <div className="flex">
        <Sidebar />

        <main className="flex-1 lg:ml-64 p-6 relative z-10 flex flex-col items-center transition-colors duration-500">
          {/* Elegant animated background shapes */}
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
            {/* subtle overlay to accent dark/light */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/2 dark:from-transparent dark:to-transparent pointer-events-none" />
          </div>

          {/* HEADER */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-4xl flex flex-col items-center gap-3 mb-8"
          >
            <div className="flex items-center gap-4">
              <Image
                src="https://i.postimg.cc/CM3TC7Lm/714.jpg"
                alt="714 Chat Logo"
                width={84}
                height={84}
                className="rounded-2xl shadow-lg"
              />
              <div className="text-left">
                <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-600">
                  714 Chat
                </h1>
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  Chat globally, tip on-chain, and explore decentralized social
                  connections.
                </p>
              </div>
            </div>

            <div className="w-full flex items-center justify-between mt-2">
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 dark:bg-white/5 border border-white/10 dark:border-white/5">
                  <span className="text-xs text-blue-200 dark:text-blue-400 font-medium">
                    Brand
                  </span>
                  <span className="text-xs text-slate-300 dark:text-slate-200">
                    Blue • White
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Keep your ThemeToggle component, it uses next-themes */}
                <ThemeToggle />
                {sessionUser ? (
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 rounded-xl border border-white/20 dark:border-white/10 bg-white/5 dark:bg-white/5 text-sm text-white/90 dark:text-slate-200 hover:opacity-90 transition"
                  >
                    Logout
                  </button>
                ) : null}
              </div>
            </div>
          </motion.header>

          {/* CENTERED BOX */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-3xl rounded-2xl p-8 shadow-2xl backdrop-blur-md border border-white/10 bg-white/30 dark:bg-slate-800/60 dark:border-slate-700"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                Get Started
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Sign in and explore on-chain chat, tipping, and social fun.
              </p>
            </div>

            <div className="flex flex-col items-center gap-6">
              {!sessionUser ? (
                <>
                  <div className="w-full">
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
                  </div>

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
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/80 dark:bg-slate-700 dark:border-slate-600 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                      required
                    />
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      type="password"
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/80 dark:bg-slate-700 dark:border-slate-600 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
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
                    onClick={() => router.push("/chat")}
                    className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 text-white font-medium shadow hover:opacity-95 transition"
                  >
                    Enter Chat
                  </button>
                  <button
                    onClick={() => router.push("/profile")}
                    className="flex-1 px-5 py-3 rounded-xl border border-white/10 bg-white/5 dark:bg-slate-700 text-slate-900 dark:text-slate-100 hover:opacity-95 transition"
                  >
                    Open Profile
                  </button>
                </div>
              )}

              {/* Reach Us */}
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
                  <a
                    href="https://github.com/official-714/714"
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-700 dark:text-slate-200 hover:scale-110 transition"
                  >
                    <Github size={26} />
                  </a>
                </div>
              </div>
            </div>
          </motion.section>

          {/* AI AGENT BOX */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="w-full max-w-3xl mt-10 p-6 rounded-2xl shadow-lg bg-white/30 dark:bg-slate-800/60 border border-white/10 dark:border-slate-700 backdrop-blur-md"
          >
            <div className="relative overflow-hidden">
              <div className="absolute -left-8 -top-8 w-36 h-36 rounded-full bg-blue-400/20 dark:bg-blue-500/10 blur-2xl" />
              <div className="absolute -right-8 -bottom-6 w-44 h-44 rounded-full bg-indigo-400/10 dark:bg-indigo-500/10 blur-2xl" />

              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
                🤖 AI Agent — Coming Soon!
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                A self-learning robotic assistant designed to moderate chats,
                summarize discussions, and generate new on-chain experiences.
                Imagine an AI that interacts natively with Base to help your
                community grow, discover trends, and automate engagement.
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-medium shadow"
              >
                Stay Tuned
              </motion.button>
            </div>
          </motion.section>

          {/* FOOTER */}
          <footer className="w-full max-w-3xl text-center text-sm text-slate-700 dark:text-slate-300 mt-12 mb-8">
            © 2025{" "}
            <span className="font-semibold text-blue-600 dark:text-blue-300">
              714 Chat
            </span>{" "}
            • Built with 💙 on Base
          </footer>
        </main>
      </div>
    </div>
  );
}
