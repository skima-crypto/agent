"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import ThemeToggle from "@/components/ThemeToggle";
import ProfileModal from "@/components/ProfileModal";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";

export default function HomePage() {
  const router = useRouter();

  // auth & profile state
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // local UI state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);

  // check session on mount
  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user ?? null;
      setSessionUser(user);

      if (user) {
        // try to load profile row
        const { data: prof } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        // if no profile, open profile setup modal (user must finish setup)
        if (!prof) {
          setProfile(null);
          setShowProfileModal(true);
        } else {
          setProfile(prof);
          setShowProfileModal(false);
        }
      } else {
        setProfile(null);
        setShowProfileModal(false);
      }

      setLoading(false);
    };

    bootstrap();

    // subscribe to auth changes (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setSessionUser(u);
      // when login happens, re-check profile row
      if (u) {
        (async () => {
          const { data: prof } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", u.id)
            .maybeSingle();
          if (!prof) {
            setProfile(null);
            setShowProfileModal(true);
          } else {
            setProfile(prof);
            setShowProfileModal(false);
          }
        })();
      } else {
        setProfile(null);
        setShowProfileModal(false);
      }
    });

    return () => {
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  // --- Auth actions ---
  const handleGoogleLogin = async () => {
    setMessage("");
    try {
      const redirectUrl = `${window.location.origin}/chat`;
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectUrl },
      });
      // Supabase will redirect; if it doesn't, the auth listener will update sessionUser.
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
        if (error) {
          setMessage("Error: " + error.message);
          return;
        }
        setMessage("Account created! Please check your email for confirmation.");
        // After signUp, many apps show profile setup or redirect to profile.
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setMessage("Error: " + error.message);
          return;
        }
        // signInWithPassword sets the session; auth listener will pick it up
        setMessage("Signed in! Redirecting...");
        // optionally navigate to chat automatically
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
    setShowProfileModal(false);
    setMessage("");
    router.push("/");
  };

  // if loading, show loader
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-blue-50">
        <div className="text-blue-700">Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-blue-800">
      {/* Sidebar */}
      <Sidebar />

      {/* Main */}
      <main className="flex-1 lg:ml-64 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">714 Chat</h1>
            <p className="text-sm text-gray-500">Global chat, tipping, and community experiments on Base.</p>
          </div>

          <div className="flex items-center gap-3">
            {/* If logged in show status + logout, else show nothing */}
            {sessionUser ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Signed in as <strong className="text-blue-700">{sessionUser.email?.split?.("@")?.[0] ?? "user"}</strong></span>
                <button onClick={handleLogout} className="px-3 py-2 bg-white border border-blue-100 rounded-lg text-blue-700 hover:bg-blue-50">Logout</button>
              </div>
            ) : null}
            <ThemeToggle />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Hero / Auth */}
          <section className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="bg-white rounded-2xl p-6 shadow-md border border-blue-50"
            >
              <h2 className="text-2xl font-bold text-blue-800 mb-2">Welcome to 714 Chat</h2>
              <p className="text-gray-600 mb-4">
                A community experiment — chat globally, tip on-chain, and explore social finance primitives.
              </p>

              {/* Auth / After-login CTA */}
              {!sessionUser ? (
                <>
                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <button onClick={handleGoogleLogin} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700">Sign in with Google</button>
                    <button onClick={() => setIsSignUp((s) => !s)} className="px-4 py-3 bg-white border rounded-lg">Toggle Sign {isSignUp ? "In" : "Up"}</button>
                  </div>

                  <form onSubmit={handleAuthSubmit} className="space-y-3">
                    <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200" />
                    <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200" />
                    <button type="submit" className="w-full px-4 py-2 bg-green-600 text-white rounded-lg">{isSignUp ? "Create account" : "Sign in"}</button>
                  </form>

                  {message && <p className="text-sm text-red-500 mt-2">{message}</p>}
                </>
              ) : (
                <>
                  <div className="flex gap-3">
                    <button onClick={() => router.push("/chat")} className="px-4 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700">Enter Chat</button>
                    <button disabled className="px-4 py-3 bg-white border rounded-lg text-blue-700">Chat with Agent (Soon)</button>
                  </div>
                  <p className="text-sm text-gray-500 mt-3">Your profile: {profile ? <span className="font-medium text-green-600">Ready</span> : <span className="font-medium text-yellow-500">Needs setup</span>}</p>
                </>
              )}
            </motion.div>

            {/* Feature section */}
            <motion.div className="bg-white rounded-2xl p-6 shadow-md border border-blue-50">
              <h3 className="text-lg font-semibold text-blue-700 mb-3">What you can do</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Join the global chat and speak with others in real time.</li>
                <li>• Tip users directly from their profile using Base network tokens.</li>
                <li>• Upload images and audio to chat.</li>
                <li>• Access your profile and wallet from anywhere in the app.</li>
              </ul>
            </motion.div>
          </section>

          {/* Right: Info / Community / Profile setup */}
          <aside className="space-y-6">
            <motion.div className="bg-white rounded-2xl p-6 shadow-md border border-blue-50">
              <h3 className="text-lg font-semibold text-blue-700 mb-3">Community</h3>
              <p className="text-gray-600">A friendly experimental community where people try new on-chain social features and micro-tipping.</p>
              <div className="mt-4 flex gap-3">
                <button onClick={() => router.push("/chat")} className="px-3 py-2 rounded bg-blue-50 text-blue-700">Join Global Chat</button>
                <button className="px-3 py-2 rounded bg-white border">Learn More</button>
              </div>
            </motion.div>

            {/* If user logged in but doesn't have a profile, prompt */}
            {sessionUser && !profile && (
              <motion.div className="bg-yellow-50 border-l-4 border-yellow-300 p-4 rounded-lg">
                <p className="text-sm text-yellow-800">One more step — set up your profile so others can tip you and see your avatar.</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => setShowProfileModal(true)} className="px-3 py-2 bg-yellow-600 text-white rounded">Setup Profile</button>
                  <button onClick={() => router.push("/profile")} className="px-3 py-2 bg-white border rounded">Open Profile Page</button>
                </div>
              </motion.div>
            )}
          </aside>
        </div>

        <footer className="text-center text-sm text-gray-400 mt-12 mb-6">
          © 2025 714 Chat • Built with ❤️
        </footer>
      </main>

      {/* Profile modal reused for setup or later editing */}
      {showProfileModal && sessionUser && (
        <ProfileModal
          userId={sessionUser.id}
          onClose={() => {
            setShowProfileModal(false);
            // refresh profile
            (async () => {
              const { data: prof } = await supabase.from("profiles").select("*").eq("id", sessionUser.id).maybeSingle();
              setProfile(prof || null);
            })();
          }}
        />
      )}
    </div>
  );
}
