"use client";

import { useState, useEffect, useRef } from "react";
import {
  Home,
  SendHorizonal,
  Sun,
  Moon,
  ArrowLeft,
  UserCircle2,
  Copy,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import AgentLoader from "@/components/AgentLoader";
import ProfileModal from "@/components/ProfileModal";
import ReactMarkdown from "react-markdown";

interface ChatMessage {
  role: "user" | "agent";
  content: string;
}

export default function CryptoAgentPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [showProfile, setShowProfile] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [copied, setCopied] = useState<number | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  /* ---------------- Session Check ---------------- */
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) router.push("/home");
      else setUserId(data.user.id);
      setSessionLoading(false);
    };
    checkUser();
  }, [router]);

  /* ---------------- Load messages ---------------- */
  useEffect(() => {
    const stored = localStorage.getItem("714_crypto_messages");
    if (stored) setMessages(JSON.parse(stored));
  }, []);

  /* ---------------- Save messages ---------------- */
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("714_crypto_messages", JSON.stringify(messages));
    }
  }, [messages]);

  /* ---------------- Auto-scroll ---------------- */
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  /* ---------------- Auto-Grow Input ---------------- */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  /* ---------------- Helpers ---------------- */
  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  /* ---------------- Send Query ---------------- */
  const sendQuery = async () => {
    if (!input.trim()) return;

    const query = input.trim();
    const userMessage: ChatMessage = { role: "user", content: query };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/crypto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();

      let agentReply: ChatMessage;

      if (data.error) {
        agentReply = { role: "agent", content: `⚠️ ${data.error}` };
      } else if (data.summary) {
        agentReply = {
          role: "agent",
          content: data.summary || "No data found.",
        };
      } else {
        agentReply = {
          role: "agent",
          content: "⚠️ Unexpected response format.",
        };
      }

      setMessages((prev) => [...prev, agentReply]);
    } catch (err) {
      console.error("Error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "agent", content: "⚠️ Something went wrong." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Theme ---------------- */
  const toggleTheme = () => setTheme((p) => (p === "dark" ? "light" : "dark"));
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
  const borderColor = theme === "dark" ? "border-gray-800" : "border-gray-300";

  if (sessionLoading)
    return <AgentLoader label="Initializing Crypto Agent..." />;

  return (
    <div
      className={`flex flex-col h-screen transition-colors duration-500 ${bgColor}`}
    >
      {/* Header */}
      <header
        className={`p-4 border-b ${borderColor} flex items-center justify-between`}
      >
        <button
          onClick={() => router.push("/agent/general")}
          className="flex items-center gap-2 hover:text-blue-500 transition"
        >
          <ArrowLeft size={20} />
          <span className="font-semibold hidden sm:block">
            Back to General Agent
          </span>
        </button>

        <h1 className="font-bold text-lg text-center flex-1">
          💰 Crypto Knowledge Agent
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

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
              className={`relative rounded-2xl px-4 py-2 max-w-[80%] break-words whitespace-pre-wrap ${
                msg.role === "user" ? bubbleUser : bubbleAgent
              }`}
            >
              <ReactMarkdown>{msg.content}</ReactMarkdown>
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className={`rounded-2xl px-4 py-2 ${bubbleAgent}`}>
              Fetching crypto insights...
            </div>
          </motion.div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <footer
        className={`p-4 border-t ${borderColor} flex items-center gap-2`}
      >
        <textarea
          ref={textareaRef}
          placeholder="Search by token name, address, or wallet..."
          className={`flex-1 resize-none rounded-xl px-4 py-2 outline-none border transition ${inputBg} focus:border-blue-500`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          rows={1}
        />
        <button
          onClick={sendQuery}
          disabled={loading}
          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition"
        >
          <SendHorizonal size={20} />
        </button>
      </footer>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfile && (
          <ProfileModal userId={userId} onClose={() => setShowProfile(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
