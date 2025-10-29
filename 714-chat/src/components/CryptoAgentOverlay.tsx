"use client";

import { motion, AnimatePresence } from "framer-motion";
import CryptoAgentPage from "@/app/agent/crypto/page";

export default function CryptoAgentOverlay({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      <motion.div
        key="crypto-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        // ✅ Updated with stronger blur and smooth background
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
      >
        {/* Inner panel that slides up */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="relative w-full h-[95vh] max-w-5xl rounded-2xl overflow-hidden shadow-xl"
        >
          {/* 🔹 Mount the crypto page inside the overlay */}
          <CryptoAgentPage />

          {/* 🔸 Overlay close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 bg-gray-900/60 text-white px-3 py-1 rounded-full hover:bg-red-500 transition"
          >
            ✖ Close
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
