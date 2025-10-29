"use client";

import { useState, useEffect, useRef } from "react";
import {
  SendHorizonal,
  Home,
  Sun,
  Moon,
  UserCircle2,
  Copy,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import CryptoAgentOverlay from "@/components/CryptoAgentOverlay";
import AgentLoader from "@/components/AgentLoader";
import ProfileModal from "@/components/ProfileModal";
import ReactMarkdown from "react-markdown";

interface ChatMessage {
  role: "user" | "agent";
  content: string;
  imageUrl?: string;
}

export default function GeneralAgentPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [showProfile, setShowProfile] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [copied, setCopied] = useState<number | null>(null);
  const [mode, setMode] = useState<"general" | "image">("general");
  const [showCrypto, setShowCrypto] = useState(false); // 💰 for overlay
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  /* ---------------- Session Check ---------------- */
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) router.push("/dashboard");
      else setUserId(data.user.id);
      setSessionLoading(false);
    };
    checkUser();
  }, [router]);

  /* ---------------- Load messages ---------------- */
  useEffect(() => {
    const stored = localStorage.getItem("714_general_messages");
    if (stored) setMessages(JSON.parse(stored));
  }, []);

  /* ---------------- Save messages ---------------- */
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("714_general_messages", JSON.stringify(messages));
    }
  }, [messages]);

  /* ---------------- Auto-Grow Input ---------------- */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  /* ---------------- Auto-Scroll ---------------- */
  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /* ---------------- Helpers ---------------- */
  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  const isImagePrompt = (text: string) => {
    const t = text.toLowerCase();
    return (
      t.startsWith("draw") ||
      t.startsWith("generate an image") ||
      t.includes("illustration of") ||
      t.includes("image of")
    );
  };

  /* ---------------- Send Message ---------------- */
  const sendMessage = async () => {
    if (!input.trim()) return;

    const query = input.trim();
    const userMessage: ChatMessage = { role: "user", content: query };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      if (mode === "image" || isImagePrompt(query)) {
        const res = await fetch("/api/agent/general/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: query }),
        });
        const data = await res.json();

        if (data.imageUrl) {
          setMessages((p) => [
            ...p,
            { role: "agent", content: `🖼️ Image for "${query}"`, imageUrl: data.imageUrl },
          ]);
        } else {
          setMessages((p) => [
            ...p,
            { role: "agent", content: data.error || "⚠️ Image generation failed." },
          ]);
        }
      } else {
        const res = await fetch("/api/agent/general", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: query }),
        });

        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }

        let reply =
          typeof data === "string"
            ? data
            : data?.reply?.reply ||
              data?.reply ||
              data?.choices?.[0]?.message?.content ||
              "⚠️ Unexpected format.";

        setMessages((p) => [...p, { role: "agent", content: reply.trim() }]);
      }
    } catch (err) {
      console.error(err);
      setMessages((p) => [
        ...p,
        { role: "agent", content: "⚠️ Something went wrong. Try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Theme ---------------- */
  const toggleTheme = () => setTheme((p) => (p === "dark" ? "light" : "dark"));
  const bgColor = theme === "dark" ? "bg-gray-950 text-gray-100" : "bg-white text-gray-900";
  const bubbleUser = theme === "dark" ? "bg-blue-600 text-white" : "bg-blue-500 text-white";
  const bubbleAgent = theme === "dark" ? "bg-gray-800 text-gray-100" : "bg-gray-200 text-gray-900";
  const inputBg =
    theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-gray-100 border-gray-300";
  const borderColor = theme === "dark" ? "border-gray-800" : "border-gray-300";

  if (sessionLoading)
    return <AgentLoader label="Initializing General Knowledge Agent..." />;

  return (
    <div className={`flex flex-col h-screen transition-colors duration-500 ${bgColor}`}>
      {/* Header */}
      <header className={`p-4 border-b ${borderColor} flex items-center justify-between`}>
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 hover:text-blue-500 transition"
        >
          <Home size={22} />
          <span className="font-semibold hidden sm:block">Home</span>
        </button>

        <h1 className="font-bold text-lg text-center flex-1">🧠 714 General Knowledge Agent</h1>

        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-blue-500/20 transition">
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

      {/* Mode Switcher */}
      <div className="flex justify-center gap-3 my-3">
        <button
          onClick={() => setMode("general")}
          className={`px-4 py-1 rounded-full border transition ${
            mode === "general"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-transparent border-gray-500 text-gray-400"
          }`}
        >
          🧠 General
        </button>

        <button
          onClick={() => setMode("image")}
          className={`px-4 py-1 rounded-full border transition ${
            mode === "image"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-transparent border-gray-500 text-gray-400"
          }`}
        >
          🖼️ Image Gen
        </button>

        <button
          onClick={() => setShowCrypto(true)}
          className="px-4 py-1 rounded-full border border-gray-500 text-gray-400 hover:bg-blue-600 hover:text-white transition"
        >
          💰 Crypto Agent
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`relative rounded-2xl px-4 py-2 max-w-[80%] break-words whitespace-pre-wrap ${
                msg.role === "user" ? bubbleUser : bubbleAgent
              }`}
            >
              {msg.imageUrl ? (
                <img src={msg.imageUrl} alt="Generated" className="rounded-xl mt-2 max-w-full" />
              ) : (
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              )}
              {msg.role === "agent" && (
                <button
                  onClick={() => copyToClipboard(msg.content, i)}
                  className="absolute top-1 right-2 text-xs text-gray-400 hover:text-blue-400"
                >
                  {copied === i ? <Check size={14} /> : <Copy size={14} />}
                </button>
              )}
            </div>
          </motion.div>
        ))}

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className={`rounded-2xl px-4 py-2 ${bubbleAgent} text-gray-400`}>Thinking...</div>
          </motion.div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <footer className={`p-4 border-t ${borderColor} flex items-center gap-2`}>
        <textarea
          ref={textareaRef}
          placeholder={
            mode === "image"
              ? "Describe the image you want me to create..."
              : "Ask or discuss anything..."
          }
          className={`flex-1 resize-none rounded-xl px-4 py-2 outline-none border transition ${inputBg} focus:border-blue-500`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          rows={1}
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
        {showProfile && <ProfileModal userId={userId} onClose={() => setShowProfile(false)} />}
      </AnimatePresence>

      {/* 💰 Crypto Overlay */}
      <AnimatePresence>
        {showCrypto && <CryptoAgentOverlay onClose={() => setShowCrypto(false)} />}
      </AnimatePresence>
    </div>
  );
}
