"use client";

import { useState, useEffect } from "react";
import {
  Home,
  User,
  MessageCircle,
  Users,
  Bot,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Image as ImageIcon,
  BarChart3,
  Sun,
  Moon,
  Link2,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const Sidebar = () => {
  const [open, setOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [comingSoon, setComingSoon] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setTheme("dark");
    }
  }, []);

  const toggleTheme = () => {
    if (theme === "light") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setTheme("light");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  // 🧭 Main Navigation
  const navItems = [
    { name: "Home", icon: Home, path: "/" },
    { name: "Profile", icon: User, path: "/profile" },
    { name: "Connect", icon: Link2, path: "/connect" }, // 🆕 Added section
  ];

  // 🤖 AI Tools
  const aiItems = [
    { name: "Agent", icon: Bot, path: "/agent" },
    { name: "Image Gen", icon: ImageIcon, path: "coming-soon" },
    { name: "Analytics", icon: BarChart3, path: "coming-soon" },
  ];

  return (
    <>
      {/* 🌐 Mobile Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-2 rounded-xl shadow-lg hover:scale-105 transition-transform"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* 🧱 Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-40 flex flex-col border-r transition-all duration-300 ease-in-out
        ${
          theme === "dark"
            ? "bg-gradient-to-b from-gray-100 to-gray-200 text-gray-900 border-gray-300/50"
            : "bg-gradient-to-b from-[#0f172a]/90 to-[#020617]/95 text-blue-100 border-blue-900/20"
        }
        backdrop-blur-2xl lg:translate-x-0 lg:w-64 w-64 shadow-[0_0_25px_rgba(37,99,235,0.25)]
        ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600/50 scrollbar-track-transparent">
          {/* 🧭 Logo + Title */}
          <div className="flex flex-col items-center mt-8 space-y-8 px-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              onClick={() => router.push("/")}
              className="cursor-pointer"
            >
              <Image
                src="https://i.postimg.cc/D0nhZkkc/favicon.jpg"
                alt="714 Logo"
                width={100}
                height={100}
                className="rounded-2xl shadow-xl border border-white/10 dark:border-gray-400/40"
              />
            </motion.div>

            <motion.h1
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 3, repeat: Infinity }}
              className={`text-2xl font-extrabold tracking-tight text-center ${
                theme === "dark" ? "text-blue-800" : "text-blue-400"
              }`}
            >
              SKIMA
              <span
                className={
                  theme === "dark" ? "text-blue-900" : "text-blue-600"
                }
              >
                
              </span>
            </motion.h1>

            {/* ☀️ Theme Toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className={`flex items-center gap-2 border px-3 py-2 rounded-xl font-medium transition-colors duration-200
                ${
                  theme === "dark"
                    ? "text-gray-900 border-gray-400 hover:bg-gray-300/60"
                    : "text-blue-300 border-blue-600/40 hover:bg-blue-950/40"
                }`}
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
              <span className="text-sm">
                {theme === "light" ? "Dark Mode" : "Light Mode"}
              </span>
            </motion.button>

            {/* 📍 Nav Items */}
            <nav className="flex flex-col gap-2 w-full px-4">
              {navItems.map(({ name, icon: Icon, path }) => {
                const isActive = pathname === path;
                return (
                  <motion.button
                    key={name}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => router.push(path)}
                    className={`flex items-center gap-3 px-4 py-2 rounded-xl font-medium text-sm transition-all relative overflow-hidden
                      ${
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-700/30"
                          : theme === "dark"
                          ? "text-gray-800 hover:bg-gray-300/40 hover:text-blue-800"
                          : "text-blue-200 hover:bg-blue-900/30 hover:text-white"
                      }`}
                  >
                    <Icon size={18} />
                    <span>{name}</span>
                  </motion.button>
                );
              })}

              {/* 🤖 AI Tools Section */}
              <div className="mt-5">
                <button
                  onClick={() => setAiOpen((prev) => !prev)}
                  className={`flex items-center justify-between w-full px-4 py-2 rounded-xl font-semibold text-sm transition
                    ${
                      theme === "dark"
                        ? "text-gray-800 bg-gray-200 hover:bg-gray-300"
                        : "text-blue-300 bg-blue-950/40 hover:bg-blue-900/50"
                    }`}
                >
                  <span className="flex items-center gap-2">
                    <Sparkles
                      size={16}
                      className={
                        theme === "dark" ? "text-blue-700" : "text-blue-400"
                      }
                    />
                    AGENT 714
                  </span>
                  {aiOpen ? (
                    <ChevronUp
                      size={16}
                      className={
                        theme === "dark" ? "text-blue-700" : "text-blue-400"
                      }
                    />
                  ) : (
                    <ChevronDown
                      size={16}
                      className={
                        theme === "dark" ? "text-blue-700" : "text-blue-400"
                      }
                    />
                  )}
                </button>

                <AnimatePresence>
                  {aiOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-2 pl-6 flex flex-col gap-2"
                    >
                      {aiItems.map(({ name, icon: Icon, path }) => {
                        const isSoon = path === "coming-soon";
                        const isActive = pathname === path;
                        return (
                          <div key={name} className="flex flex-col">
                            <motion.button
                              whileHover={{ scale: 1.03 }}
                              onClick={() => {
                                if (isSoon) setComingSoon(name);
                                else {
                                  setComingSoon(null);
                                  router.push(path);
                                }
                              }}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all
                                ${
                                  isActive
                                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                                    : theme === "dark"
                                    ? "text-gray-800 hover:bg-gray-200"
                                    : "text-blue-300 hover:bg-blue-900/30 hover:text-white"
                                }`}
                            >
                              <Icon size={16} />
                              <span>{name}</span>
                            </motion.button>

                            <AnimatePresence>
                              {comingSoon === name && (
                                <motion.p
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="ml-8 mt-1 text-xs italic text-blue-400"
                                >
                                  🚧 {name}  Coming soon!
                                </motion.p>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>
          </div>
        </div>

        {/* ⚙️ Bottom Section */}
        <div className="flex flex-col items-center mb-10 pb-4 space-y-3 border-t border-blue-900/30 pt-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            <span
              className={`text-xs ${
                theme === "dark" ? "text-gray-700" : "text-blue-300"
              }`}
            >
              Online
            </span>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            onClick={handleLogout}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white px-4 py-2 rounded-xl font-medium transition"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </motion.button>

          <p
            className={`text-xs ${
              theme === "dark" ? "text-gray-700" : "text-blue-300"
            }`}
          >
            © 2025 <span className="font-semibold">AGENT 714</span>
          </p>
        </div>
      </aside>

      {/* 📱 Mobile Overlay */}
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
