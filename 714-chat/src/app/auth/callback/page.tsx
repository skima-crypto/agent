"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (user) router.push("/profile");
      else router.push("/");
    };
    checkSession();
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-700 via-blue-900 to-black text-white relative overflow-hidden">
      {/* Animated glowing orbs */}
      <motion.div
        className="absolute w-72 h-72 bg-blue-500/30 rounded-full blur-3xl top-10 left-20"
        animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl bottom-10 right-10"
        animate={{ scale: [1.2, 1.6, 1.2], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Loader */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        <motion.div
          className="w-16 h-16 border-4 border-t-transparent border-white rounded-full"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        />
        <motion.h1
          className="text-2xl font-semibold tracking-wide"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Redirecting...
        </motion.h1>
      </div>
    </div>
  );
}
