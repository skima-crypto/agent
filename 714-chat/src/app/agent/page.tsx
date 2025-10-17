// src/app/agent/page.tsx
"use client";

import { useEffect, useState } from "react";
import { SendHorizonal, Home, UserCircle2, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import TokenChartEmbed from "@/components/TokenChartEmbed";
import ProfileModal from "@/components/ProfileModal";

interface AgentMessage {
  role: "user" | "agent";
  content: string;
  tokenSlug?: string | null;
  tokenAddress?: string | null;
}

export default function AgentPage() {
  const router = useRouter();

  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [showProfile, setShowProfile] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  /* ---------------- 🧩 Session Check ---------------- */
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) router.push("/home");
      else setUserId(data.user.id);
    };
    checkUser();
  }, [router]);

  /* ---------------- 💾 Load messages ---------------- */
  useEffect(() => {
    const stored = localStorage.getItem("714_agent_messages");
    if (stored) setMessages(JSON.parse(stored));
  }, []);

  /* ---------------- 💾 Persist messages ---------------- */
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("714_agent_messages", JSON.stringify(messages));
    }
  }, [messages]);

  /* ---------------- 🚀 Send message ---------------- */
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: AgentMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content }),
      });

      const data = await res.json();

      const botMessage: AgentMessage = {
        role: "agent",
        content: data.reply || "No response received.",
        tokenSlug: data.slug ?? null,
        tokenAddress: data.contractAddress ?? null,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error("Error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "agent", content: "Something went wrong. Try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- ⌨️ Enter Key ---------------- */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /* ---------------- 🌗 Theme Toggle ---------------- */
  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const bgColor =
    theme === "dark" ? "bg-gray-950 text-gray-100" : "bg-white text-gray-900";
  const bubbleUser =
    theme === "dark" ? "bg-blue-600 text-white" : "bg-blue-500 text-white";
  const bubbleAgent =
    theme === "dark" ? "bg-gray-800 text-gray-100" : "bg-gray-200 text-gray-900";
  const inputBg =
    theme === "dark"
      ? "bg-gray-900 border-gray-700"
      : "bg-gray-100 border-gray-300";
  const borderColor =
    theme === "dark" ? "border-gray-800" : "border-gray-300";

  return (
    <div className={`flex flex-col h-screen transition-colors duration-500 ${bgColor}`}>
      {/* Header */}
      <header
        className={`p-4 border-b ${borderColor} flex items-center justify-between`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/home")}
            className="flex items-center gap-2 hover:text-blue-500 transition"
          >
            <Home size={22} />
            <span className="font-semibold hidden sm:block">Home</span>
          </button>
        </div>

        <h1 className="font-bold text-lg text-center flex-1">
          🧠 Agent 714
        </h1>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-blue-500/20 transition"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button
            onClick={() => setShowProfile(true)}
            className="p-2 rounded-full hover:bg-blue-500/20 transition"
          >
            <UserCircle2 size={22} />
          </button>
        </div>
      </header>

      {/* Intro Section */}
      <div className="p-4 border-b text-sm text-center opacity-80">
        👋 Hi! I’m <b>714 Agent</b>, your smart crypto assistant.  
        Ask about any token, network, project, or paste a contract address to get live info, charts, and news!  
        💡 Your messages are stored locally and only cleared when you clear browser cache.
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`rounded-2xl px-4 py-2 max-w-[80%] break-words whitespace-pre-wrap ${msg.role === "user" ? bubbleUser : bubbleAgent}`}
              >
                {msg.content}

                {/* Chart Embed */}
                {msg.role === "agent" &&
                  (msg.tokenSlug || msg.tokenAddress) && (
                    <div className="mt-2">
                      <TokenChartEmbed
                        slug={msg.tokenSlug || undefined}
                        address={msg.tokenAddress || undefined}
                      />
                    </div>
                  )}
              </div>
            </motion.div>
          ))}

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`flex justify-start`}
            >
              <div
                className={`rounded-2xl px-4 py-2 ${bubbleAgent} text-gray-400`}
              >
                Thinking...
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <footer
        className={`p-4 border-t ${borderColor} flex items-center gap-2`}
      >
        <input
          type="text"
          placeholder="Ask about any token or paste a contract address..."
          className={`flex-1 rounded-xl px-4 py-2 outline-none border transition ${inputBg} focus:border-blue-500`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition"
        >
          <SendHorizonal size={20} />
        </button>
      </footer>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfile && (
          <ProfileModal
            userId={userId}
            onClose={() => setShowProfile(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

