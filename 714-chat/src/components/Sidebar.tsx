"use client";

import { useState } from "react";
import {
  Home,
  User,
  MessageCircle,
  Bot,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const Sidebar = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const navItems = [
    { name: "Home", icon: Home, path: "/" },
    { name: "Profile", icon: User, path: "/profile" },
    { name: "Chat", icon: MessageCircle, path: "/chat" },
    { name: "AI Agent (Soon)", icon: Bot, path: "#" },
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-2 rounded-xl shadow-lg hover:scale-105 transition"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-40 flex flex-col justify-between border-r transition-all duration-300 ease-in-out
        bg-gradient-to-b from-[#0f172a]/90 to-[#020617]/95 dark:from-gray-100/90 dark:to-gray-200/90
        backdrop-blur-xl border-blue-900/20 dark:border-gray-300/40
        ${open ? "translate-x-0" : "-translate-x-full"} 
        lg:translate-x-0 lg:w-64 w-64 shadow-xl`}
      >
        {/* TOP SECTION */}
        <div className="flex flex-col items-center mt-8 space-y-8">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="cursor-pointer"
            onClick={() => router.push("/")}
          >
            <Image
              src="https://i.postimg.cc/t4b28Nt9/714BG.jpg"
              alt="714 Chat Logo"
              width={100}
              height={100}
              className="rounded-2xl shadow-lg border border-white/10 dark:border-gray-300/30"
            />
          </motion.div>

          {/* Title */}
          <motion.h1
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-2xl font-extrabold text-blue-400 dark:text-blue-700 tracking-tight"
          >
            714<span className="text-blue-600 dark:text-blue-900">Chat</span>
          </motion.h1>

          {/* Nav Links */}
          <nav className="flex flex-col gap-2 w-full px-4">
            {navItems.map(({ name, icon: Icon, path }) => {
              const isActive = pathname === path;
              return (
                <motion.button
                  key={name}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => {
                    if (path !== "#") router.push(path);
                  }}
                  className={`flex items-center gap-3 px-4 py-2 rounded-xl font-medium text-sm transition-all relative overflow-hidden
                  ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                      : "text-blue-200 dark:text-blue-800 hover:bg-blue-900/30 dark:hover:bg-gray-300/40 hover:text-white dark:hover:text-gray-900"
                  }`}
                >
                  <Icon size={18} />
                  <span>{name}</span>

                  {/* Active glowing border animation */}
                  {isActive && (
                    <motion.span
                      layoutId="activeGlow"
                      className="absolute inset-0 border border-blue-400/40 rounded-xl"
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </nav>
        </div>

        {/* BOTTOM SECTION */}
        <div className="flex flex-col items-center mb-6 space-y-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            onClick={handleLogout}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white px-4 py-2 rounded-xl font-medium transition"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </motion.button>

          <p className="text-xs text-blue-300 dark:text-blue-800">
            © 2025 <span className="font-semibold">714 Chat</span>
          </p>
        </div>
      </aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black lg:hidden z-30"
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
