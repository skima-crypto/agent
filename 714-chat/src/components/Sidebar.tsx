"use client";

import { useState } from "react";
import { Home, User, MessageCircle, Bot, LogOut, Menu, X } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

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
    { name: "Agent (Soon)", icon: Bot, path: "#" },
  ];

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-blue-600 text-white p-2 rounded-lg shadow-md hover:bg-blue-700 transition"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white text-blue-600 shadow-lg border-r border-blue-100 flex flex-col justify-between transition-all duration-300 z-40
        ${open ? "translate-x-0" : "-translate-x-full"} 
        lg:translate-x-0 lg:w-64 w-64`}
      >
        {/* Top section */}
        <div className="flex flex-col items-center mt-8 space-y-8">
          <h1
            className="text-2xl font-extrabold tracking-tight cursor-pointer"
            onClick={() => router.push("/")}
          >
            714<span className="text-blue-700">Chat</span>
          </h1>

          {/* Navigation */}
          <nav className="flex flex-col gap-3 w-full px-4">
            {navItems.map(({ name, icon: Icon, path }) => {
              const isActive = pathname === path;
              return (
                <button
                  key={name}
                  onClick={() => {
                    if (path !== "#") router.push(path);
                  }}
                  className={`flex items-center gap-3 px-4 py-2 rounded-xl font-medium text-sm transition-all 
                  ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md"
                      : "hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  <Icon size={18} />
                  <span>{name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom section */}
        <div className="flex flex-col items-center mb-6">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
          <p className="text-xs text-gray-400 mt-2">© 2025 714 Chat</p>
        </div>
      </aside>

      {/* Background overlay for mobile */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 lg:hidden z-30"
        />
      )}
    </>
  );
};

export default Sidebar;
