"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import ThemeToggle from "@/components/ThemeToggle";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";

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

        if (!prof) {
          router.push("/profile");
        } else {
          setProfile(prof);
        }
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
        } else {
          setProfile(null);
        }
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
      setMessage("Google sign in failed: " + (err.message || err));
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("Loading...");
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) return setMessage("Error: " + error.message);
        setMessage("Account created! Check your email to confirm.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) return setMessage("Error: " + error.message);
        setMessage("Signed in! Redirecting...");
        router.push("/chat");
      }
    } catch (err: any) {
      setMessage("Auth failed: " + (err.message || err));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSessionUser(null);
    setProfile(null);
    setMessage("");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="animate-pulse text-blue-700 font-semibold text-lg">
          Loading 714 Chat...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 text-gray-800 font-inter">
      {/* Sidebar */}
      <Sidebar />

      {/* Main */}
      <main className="flex-1 lg:ml-64 p-6">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-blue-800 tracking-tight">
              714 Chat
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Global chat, tipping, and community experiments on Base.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {sessionUser && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  Signed in as{" "}
                  <strong className="text-blue-700">
                    {sessionUser.email?.split?.("@")?.[0] ?? "user"}
                  </strong>
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-white border border-blue-200 rounded-xl shadow-sm text-blue-700 hover:bg-blue-50 transition"
                >
                  Logout
                </button>
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left Section */}
          <section className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-3xl p-8 shadow-lg border border-blue-100"
            >
              <h2 className="text-2xl font-bold text-blue-800 mb-2">
                Welcome to <span className="text-indigo-600">714 Chat</span>
              </h2>
              <p className="text-gray-600 mb-6">
                Chat globally, tip on-chain, and explore social finance
                primitives in one experimental space.
              </p>

              {!sessionUser ? (
                <>
                  <div className="flex flex-col sm:flex-row gap-3 mb-5">
                    <button
                      onClick={handleGoogleLogin}
                      className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 transition"
                    >
                      Sign in with Google
                    </button>
                    <button
                      onClick={() => setIsSignUp((s) => !s)}
                      className="px-4 py-3 bg-white border rounded-xl text-gray-700 hover:bg-gray-50 transition"
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
                      className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-200"
                    />
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      type="password"
                      required
                      className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-200"
                    />
                    <button
                      type="submit"
                      className="w-full px-4 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition"
                    >
                      {isSignUp ? "Create account" : "Sign in"}
                    </button>
                  </form>
                  {message && (
                    <p className="text-sm text-red-500 mt-3">{message}</p>
                  )}
                </>
              ) : (
                <>
  <div className="flex flex-wrap gap-4">
    <button
      onClick={() => router.push("/chat")}
      className="flex-1 px-5 py-3 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition"
    >
      Enter Chat
    </button>
    <button
      onClick={() => router.push("/profile")}
      className="flex-1 px-5 py-3 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition"
    >
      Open Profile
    </button>
  </div>
</>

              )}
            </motion.div>

            <motion.div
              className="bg-white rounded-3xl p-8 shadow-lg border border-blue-100"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-xl font-semibold text-blue-700 mb-4">
                What You Can Do
              </h3>
              <ul className="space-y-2 text-gray-600 leading-relaxed">
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
              className="bg-white rounded-3xl p-8 shadow-lg border border-blue-100"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-xl font-semibold text-blue-700 mb-3">
                Community
              </h3>
              <p className="text-gray-600 mb-4">
                Join a creative on-chain community exploring decentralized
                social tipping and chat.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push("/chat")}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                >
                  Join Chat
                </button>
                <button className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition">
                  Learn More
                </button>
              </div>
            </motion.div>
          </aside>
        </div>

        <footer className="text-center text-sm text-gray-400 mt-16 mb-8">
          © 2025 <span className="font-semibold text-blue-700">714 Chat</span> •
          Built with ❤️ on Base
        </footer>
      </main>
    </div>
  );
}
