"use client";

import { Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 w-full border-t border-gray-800 bg-gray-950 text-gray-400 py-4 z-50">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between px-6 gap-3">
        
        {/* Left - Brand & Power line */}
        <p className="text-sm text-center sm:text-left">
          © {new Date().getFullYear()}{" "}
          <span className="text-blue-400 font-semibold">AGENT 714</span>. All rights reserved.
          <span className="ml-2 text-gray-500">
            • Powered by <span className="text-sky-400 font-medium">Base 💙</span>
          </span>
        </p>

        {/* Right - Socials */}
        <div className="flex space-x-4">
          <a
            href="https://twitter.com/agent714_"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-blue-400 transition"
            title="Follow @agent714_"
          >
            <Twitter size={20} />
          </a>

          <a
            href="https://twitter.com/0xskima"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-blue-400 transition"
            title="Follow @0xskima"
          >
            <Twitter size={20} />
          </a>
        </div>
      </div>
    </footer>
  );
}
