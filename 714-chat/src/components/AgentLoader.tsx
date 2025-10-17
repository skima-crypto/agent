"use client";

import { motion } from "framer-motion";

export default function AgentLoader({ label = "Initializing..." }) {
  return (
    <div className="relative flex h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950">
      {/* Animated background glow */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.3)_0%,transparent_70%)] animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(37,99,235,0.25)_0%,transparent_70%)] blur-3xl opacity-70 animate-[spin_20s_linear_infinite]" />
      </div>

      {/* Loader content */}
      <div className="relative flex flex-col items-center space-y-6">
        {/* Rotating ring with inner glow */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24">
          <div className="absolute inset-0 rounded-full border-4 border-blue-400 border-t-transparent animate-spin"></div>
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-500/30 to-transparent blur-md"></div>
        </div>

        {/* Logo */}
        <motion.img
          src="https://i.postimg.cc/t4b28Nt9/714BG.jpg"
          alt="714 Logo"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: [0.4, 1, 0.4],
            scale: [0.9, 1, 0.9],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full shadow-lg border border-white/20 object-cover"
        />

        {/* Animated loading text */}
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-xl sm:text-2xl font-semibold tracking-widest text-center text-white"
        >
          {label}
        </motion.div>

        {/* Loading bar */}
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
      </div>
    </div>
  );
}
