"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Search, LogOut, Settings, CreditCard, LayoutDashboard } from "lucide-react";

import { useRouter } from "next/navigation";

export function Topbar({ user }: { user?: any }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();
  const handleLogout = async () => {
    await fetch("/api/v1/auth/logout", { method: "POST" });
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
              <p className="text-sm font-medium text-primary font-body group-hover:text-accent transition-colors">
                {user ? `${user.first_name} ${user.last_name !== '-' ? user.last_name : ''}`.trim() : 'Guest'}
              </p>
              <p className="text-xs text-secondary font-body">Admin</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20 transition-transform group-hover:scale-105">
              <span className="text-sm font-bold text-accent">
                {user ? `${user.first_name?.[0] || ''}${user.last_name !== '-' ? user.last_name?.[0] || '' : ''}`.toUpperCase() : 'U'}
              </span>
            </div>
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-3 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50 overflow-hidden transform origin-top-right"
              >
                <div className="px-4 py-3 border-b border-gray-50 mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user ? `${user.first_name} ${user.last_name !== '-' ? user.last_name : ''}`.trim() : 'Guest'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <button 
                  onClick={() => { setIsDropdownOpen(false); router.push("/dashboard/settings"); }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <Settings className="w-4 h-4 text-gray-400" /> Settings
                </button>
                <button 
                  onClick={() => { setIsDropdownOpen(false); router.push("/dashboard/billing"); }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <CreditCard className="w-4 h-4 text-gray-400" /> Billing
                </button>
                <button 
                  onClick={() => { setIsDropdownOpen(false); router.push("/dashboard/store"); }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-gray-400" /> Store Configuration
                </button>
                <div className="h-px bg-gray-50 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors font-medium"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
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
