"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Search, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function Topbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="h-20 bg-surface border-b border-black/[0.03] flex items-center justify-between px-8 sticky top-0 z-30">
      {/* Search Bar */}
      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
        <input 
          type="text" 
          placeholder="Search products, orders, or customers..." 
          className="w-full bg-background border border-black/[0.04] rounded-full py-2.5 pl-11 pr-4 text-sm font-body text-primary focus:outline-none focus:border-accent/30 focus:ring-4 focus:ring-accent/5 transition-all"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-6">
        {/* Notification Bell */}
        <button className="relative p-2 text-secondary hover:text-primary transition-colors group">
          <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20, delay: 1 }}
            className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full border-2 border-surface"
          />
        </button>

        {/* User Avatar & Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 pl-6 border-l border-black/[0.06] group"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-primary font-body group-hover:text-accent transition-colors">Jane Doe</p>
              <p className="text-xs text-secondary font-body">Admin</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#f0ede8] overflow-hidden border border-black/[0.04]">
              {/* Fallback avatar */}
              <img 
                src="https://api.dicebear.com/7.x/notionists/svg?seed=Jane&backgroundColor=f0ede8" 
                alt="User avatar"
                className="w-full h-full object-cover"
              />
            </div>
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-3 w-48 bg-white border border-gray-100 rounded-2xl shadow-lg py-2 z-50 overflow-hidden"
              >
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
