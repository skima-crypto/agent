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

export default function HomePage() {
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

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

  return (
    <div className="relative flex min-h-screen bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#1e293b] dark:from-gray-50 dark:via-white dark:to-gray-200 text-gray-100 dark:text-gray-900 font-inter overflow-hidden transition-all duration-700">
      <Toaster position="top-right" />
      <Sidebar />

      {/* Floating gradients background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-72 h-72 bg-blue-500/25 dark:bg-blue-400/10 rounded-full blur-3xl top-20 left-10"
          animate={{ y: [0, 40, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute w-96 h-96 bg-purple-600/20 dark:bg-purple-400/10 rounded-full blur-3xl bottom-0 right-0"
          animate={{ y: [0, -30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </div>

      <main className="flex-1 lg:ml-64 p-6 relative z-10 flex flex-col items-center">
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-2 mb-10 text-center"
        >
          <Image
            src="https://i.postimg.cc/CM3TC7Lm/714.jpg"
            alt="714 Chat Logo"
            width={90}
            height={90}
            className="rounded-2xl shadow-xl"
          />
          <motion.h1
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-5xl font-extrabold bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent"
          >
            714 Chat
          </motion.h1>
          <p className="text-sm text-blue-200 dark:text-blue-700">
            Chat globally, tip on-chain, and explore decentralized social
            connections.
          </p>
          <ThemeToggle />
        </motion.div>

        {/* CENTERED BOX */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl w-full bg-white/10 dark:bg-white/60 backdrop-blur-xl border border-white/20 dark:border-gray-200 rounded-3xl p-8 shadow-2xl flex flex-col items-center space-y-6"
        >
          <motion.div
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold text-blue-200 dark:text-blue-600 mb-2">
              Get Started
            </h2>
            <p className="text-gray-300 dark:text-gray-700 mb-4">
              Sign in and explore on-chain chat, tipping, and social fun.
            </p>
          </motion.div>

          <div className="flex flex-col items-center space-y-5 w-full">
            {!sessionUser ? (
              <>
                <button
                  onClick={handleGoogleLogin}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-xl shadow-lg hover:opacity-90 transition"
                >
                  Sign in with Google
                </button>

                <form onSubmit={handleAuthSubmit} className="w-full space-y-4">
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    type="email"
                    className="w-full px-4 py-3 bg-black/30 dark:bg-gray-200 border border-white/20 dark:border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400"
                    required
                  />
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    type="password"
                    className="w-full px-4 py-3 bg-black/30 dark:bg-gray-200 border border-white/20 dark:border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-400 text-white font-medium rounded-xl hover:opacity-90 transition"
                  >
                    {isSignUp ? "Create Account" : "Sign In"}
                  </button>
                </form>
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm text-blue-300 dark:text-blue-700 hover:underline"
                >
                  Toggle to {isSignUp ? "Sign In" : "Sign Up"}
                </button>
              </>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  onClick={() => router.push("/chat")}
                  className="flex-1 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-500 text-white rounded-xl shadow hover:opacity-90"
                >
                  Enter Chat
                </button>
                <button
                  onClick={() => router.push("/profile")}
                  className="flex-1 px-5 py-3 bg-white/10 dark:bg-gray-100 text-indigo-200 dark:text-indigo-700 border border-white/20 dark:border-gray-400 rounded-xl hover:bg-white/20 dark:hover:bg-gray-200"
                >
                  Open Profile
                </button>
              </div>
            )}

            {/* Reach Us */}
            <div className="flex flex-col items-center mt-8 text-center">
              <p className="text-gray-400 dark:text-gray-700 text-sm mb-2">
                Reach us / Connect with:
              </p>
              <div className="flex gap-6">
                <a
                  href="https://twitter.com/"
                  target="_blank"
                  className="text-blue-400 dark:text-blue-700 hover:scale-110 transition"
                >
                  <Twitter size={28} />
                </a>
                <a
                  href="https://github.com/"
                  target="_blank"
                  className="text-gray-400 dark:text-gray-800 hover:scale-110 transition"
                >
                  <Github size={28} />
                </a>
              </div>
            </div>
          </div>
        </motion.section>

        {/* AI AGENT BOX */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="max-w-3xl mt-12 w-full bg-gradient-to-br from-purple-600/20 to-blue-500/10 dark:from-purple-100/60 dark:to-blue-100/40 border border-white/20 dark:border-gray-300 backdrop-blur-xl rounded-3xl p-8 shadow-lg relative overflow-hidden"
        >
          {/* Robotic floating orbs */}
          <motion.div
            className="absolute top-5 right-10 w-14 h-14 bg-purple-400/40 dark:bg-purple-500/20 rounded-full blur-2xl"
            animate={{ x: [0, -20, 0], y: [0, 15, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-5 left-10 w-20 h-20 bg-blue-400/40 dark:bg-blue-500/20 rounded-full blur-2xl"
            animate={{ x: [0, 15, 0], y: [0, -20, 0] }}
            transition={{ duration: 7, repeat: Infinity }}
          />

          <h3 className="text-xl font-semibold text-purple-300 dark:text-purple-700 mb-3">
            🤖 AI Agent — Coming Soon!
          </h3>
          <motion.p
            animate={{ opacity: [0.9, 1, 0.9] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-gray-300 dark:text-gray-700 leading-relaxed"
          >
            A self-learning robotic assistant designed to moderate chats,
            summarize discussions, and generate new on-chain experiences.
            Imagine an AI that interacts natively with Base to help your
            community grow, discover trends, and automate engagement.
          </motion.p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            className="mt-5 px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white dark:text-white rounded-xl shadow hover:opacity-90 transition"
          >
            Stay Tuned
          </motion.button>
        </motion.div>

        {/* FOOTER */}
        <footer className="text-center text-sm text-blue-300 dark:text-blue-700 mt-16 mb-8">
          © 2025 <span className="font-semibold text-blue-400 dark:text-blue-800">714 Chat</span> •
          Built with 💙 on Base
        </footer>
      </main>
    </div>
  );
}
