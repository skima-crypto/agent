"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import ThemeToggle from "@/components/ThemeToggle";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";

export default function HomePage() {
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch session & profile
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
    setMessage("Loading...");
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) return toast.error(error.message);
        toast.success("Account created! Check your email to confirm.");
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
    <div className="relative flex min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-black text-gray-100 font-inter overflow-hidden">
      <Toaster position="top-right" />
      <Sidebar />

      {/* Glowing animated background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(0,100,255,0.25),transparent_60%),radial-gradient(circle_at_80%_70%,rgba(100,0,255,0.25),transparent_60%)] blur-3xl pointer-events-none" />

      <main className="flex-1 lg:ml-64 p-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-10"
        >
          <div>
            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent drop-shadow-md">
              714 Chat
            </h1>
            <p className="text-sm text-blue-200 mt-2">
              Global chat, tipping, and community experiments on Base.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {sessionUser && (
              <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/20">
                <span className="text-sm text-gray-200">
                  Signed in as{" "}
                  <strong className="text-blue-300">
                    {sessionUser.email?.split?.("@")?.[0] ?? "user"}
                  </strong>
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500/80 text-white rounded-xl hover:bg-red-600 transition font-medium"
                >
                  Logout
                </button>
              </div>
            )}
            <ThemeToggle />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left Section */}
          <section className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-blue-200 mb-2">
                Welcome to{" "}
                <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
                  714 Chat
                </span>
              </h2>
              <p className="text-gray-300 mb-6">
                Chat globally, tip on-chain, and explore decentralized social
                primitives — all in one experimental space.
              </p>

              {!sessionUser ? (
                <>
                  <div className="flex flex-col sm:flex-row gap-3 mb-5">
                    <button
                      onClick={handleGoogleLogin}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-xl shadow-lg hover:opacity-90 transition"
                    >
                      Sign in with Google
                    </button>
                    <button
                      onClick={() => setIsSignUp((s) => !s)}
                      className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-gray-200 hover:bg-white/20 transition"
                    >
                      Toggle Sign {isSignUp ? "In" : "Up"}
                    </button>
                  </div>

                  <form onSubmit={handleAuthSubmit} className="space-y-4">
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      type="email"
                      required
                      className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl text-gray-100 focus:ring-2 focus:ring-blue-400 placeholder-gray-400"
                    />
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      type="password"
                      required
                      className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl text-gray-100 focus:ring-2 focus:ring-blue-400 placeholder-gray-400"
                    />
                    <button
                      type="submit"
                      className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-400 text-white font-medium rounded-xl hover:opacity-90 transition"
                    >
                      {isSignUp ? "Create account" : "Sign in"}
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => router.push("/chat")}
                    className="flex-1 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-500 text-white rounded-xl shadow hover:opacity-90 transition"
                  >
                    Enter Chat
                  </button>
                  <button
                    onClick={() => router.push("/profile")}
                    className="flex-1 px-5 py-3 bg-white/10 text-indigo-200 border border-white/20 rounded-xl hover:bg-white/20 transition"
                  >
                    Open Profile
                  </button>
                </div>
              )}
            </motion.div>

            <motion.div
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-xl font-semibold text-blue-200 mb-4">
                What You Can Do
              </h3>
              <ul className="space-y-2 text-gray-300 leading-relaxed">
                <li>• Join the global chat and connect with others.</li>
                <li>• Tip users with Base network tokens.</li>
                <li>• Upload images, audio, and media in chat.</li>
                <li>• Manage your wallet and profile easily.</li>
              </ul>
            </motion.div>
          </section>

          {/* Right Section */}
          <aside className="space-y-8">
            <motion.div
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-xl font-semibold text-blue-200 mb-3">
                Community
              </h3>
              <p className="text-gray-300 mb-4">
                Join a creative on-chain community exploring decentralized
                social tipping and chat.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push("/chat")}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:opacity-90 transition"
                >
                  Join Chat
                </button>
                <button className="px-4 py-2 bg-white/10 border border-white/20 text-gray-200 rounded-lg hover:bg-white/20 transition">
                  Learn More
                </button>
              </div>
            </motion.div>
          </aside>
        </div>

        <footer className="text-center text-sm text-blue-300 mt-16 mb-8">
          © 2025 <span className="font-semibold text-blue-400">714 Chat</span> •
          Built with ❤️ on Base
        </footer>
      </main>
    </div>
  );
}
