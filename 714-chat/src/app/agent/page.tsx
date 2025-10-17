"use client";

import { useState } from "react";
import { SendHorizonal } from "lucide-react";
import TokenChartEmbed from "@/components/TokenChartEmbed";

interface AgentMessage {
  role: "user" | "agent";
  content: string;
  tokenSlug?: string | null;
  tokenAddress?: string | null;
}

export default function AgentPage() {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle sending a new message
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="p-4 border-b border-gray-800 text-center font-semibold text-lg">
        🧠 Crypto AI Agent
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`rounded-2xl px-4 py-2 max-w-[80%] space-y-2 ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-100"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {/* If this agent message has a chart, show it */}
              {msg.role === "agent" && (msg.tokenSlug || msg.tokenAddress) && (
                <div className="mt-2">
                  <TokenChartEmbed
                    slug={msg.tokenSlug || undefined}
                    address={msg.tokenAddress || undefined}
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-2xl px-4 py-2 text-gray-400">
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <footer className="p-4 border-t border-gray-800 flex items-center gap-2">
        <input
          type="text"
          placeholder="Ask about any token, or paste a contract address..."
          className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 outline-none focus:border-blue-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="p-2 bg-blue-600 hover:bg-blue-700 rounded-xl transition"
        >
          <SendHorizonal size={20} />
        </button>
      </footer>
    </div>
  );
}
