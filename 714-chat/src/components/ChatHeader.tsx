"use client";

import { useState } from "react";
import { Search, UserCircle2, ArrowLeft, X } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

interface ChatHeaderProps {
  currentUserId?: string;
  setSelectedProfile: (profile: any) => void;
  onSearch?: (term: string) => void;
}

export default function ChatHeader({
  currentUserId,
  setSelectedProfile,
  onSearch,
}: ChatHeaderProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) onSearch(searchTerm.trim());
  };

  return (
    <header className="sticky top-0 z-20 w-full border-b border-blue-200 dark:border-blue-800 bg-white/70 dark:bg-[#0a0a0a]/80 backdrop-blur-md shadow-md">
      <div className="flex items-center justify-between px-4 py-3">
        {/* --- Left Section: Go Back Button --- */}
        <button
          onClick={() => (window.location.href = "/")}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition"
        >
          <ArrowLeft size={20} />
          <span className="hidden sm:inline font-medium">Home</span>
        </button>

        {/* --- Center Section: Global Search or Title --- */}
        {!searchOpen ? (
          <h1 className="text-lg sm:text-xl font-semibold text-blue-700 dark:text-blue-300 cursor-default">
            💬 Global Chat
          </h1>
        ) : (
          <form
            onSubmit={handleSearch}
            className="flex items-center gap-2 bg-blue-50 dark:bg-zinc-900 rounded-full px-3 py-1 border border-blue-200 dark:border-zinc-700 w-full max-w-sm mx-auto"
          >
            <Search size={18} className="text-blue-600 dark:text-blue-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search messages or users..."
              className="flex-1 bg-transparent outline-none text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            <button
              type="button"
              onClick={() => {
                setSearchOpen(false);
                setSearchTerm("");
              }}
              className="text-gray-500 hover:text-red-500"
            >
              <X size={18} />
            </button>
          </form>
        )}

        {/* --- Right Section: Actions --- */}
        <div className="flex items-center gap-4">
          {/* Toggle search bar */}
          {!searchOpen && (
            <button
              onClick={() => setSearchOpen(true)}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <Search size={20} />
            </button>
          )}

          {/* View Profile */}
          <button
            onClick={() =>
              setSelectedProfile(currentUserId)
            }
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <UserCircle2 size={22} />
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
