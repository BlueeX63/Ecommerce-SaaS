"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutGrid, 
  ShoppingBag, 
  Users, 
  BarChart3, 
  Settings,
  Store,
  Home
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: "Overview", href: "/dashboard/overview", icon: LayoutGrid },
  { name: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
  { name: "Products", href: "/dashboard/products", icon: Store },
  { name: "Catalogs", href: "/dashboard/catalogs", icon: Store },
  { name: "Coupons", href: "/dashboard/coupons", icon: BarChart3 },
  { name: "Customers", href: "/dashboard/customers", icon: Users },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Delivery Settings", href: "/dashboard/settings/delivery", icon: Settings },
  { name: "Store Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Back to Home", href: "/", icon: Home },
];

export function Sidebar({ user }: { user?: any }) {
  const pathname = usePathname();
  const [isStoreMenuOpen, setIsStoreMenuOpen] = useState(false);
  
  const handleSwitchStore = async (tenantId: string) => {
    if (tenantId === user?.activeStore?.tenant_id) return;
    try {
      const res = await fetch("/api/v1/auth/switch-store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId })
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <aside className="w-[240px] h-screen bg-surface border-r border-black/[0.06] flex flex-col fixed left-0 top-0 z-40">
      {/* Store Switcher Area */}
      <div className="flex flex-col px-4 py-4 border-b border-black/[0.03] relative">
        <button 
          onClick={() => setIsStoreMenuOpen(!isStoreMenuOpen)}
          className="flex items-center justify-between w-full p-2 rounded-xl hover:bg-black/[0.03] transition-colors"
        >
          <div className="flex items-center gap-3 truncate">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <Store className="w-4 h-4" />
            </div>
            <span className="font-heading text-lg text-primary tracking-tight truncate">
              {user?.activeStore?.tenant_name || 'Select Store'}
            </span>
          </div>
          <ChevronDown className={cn("w-4 h-4 text-secondary transition-transform", isStoreMenuOpen && "rotate-180")} />
        </button>

        <AnimatePresence>
          {isStoreMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-[100%] left-4 right-4 bg-white border border-black/5 shadow-xl rounded-xl mt-2 py-2 z-50 overflow-hidden"
            >
              <div className="px-3 pb-2 text-xs font-accent text-secondary tracking-widest uppercase">Your Stores</div>
              <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                {user?.stores?.map((store: any) => (
                  <button
                    key={store.tenant_id}
                    onClick={() => {
                      setIsStoreMenuOpen(false);
                      handleSwitchStore(store.tenant_id);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm font-body hover:bg-black/[0.02] transition-colors",
                      store.tenant_id === user?.activeStore?.tenant_id ? "text-accent font-medium bg-accent/5" : "text-primary"
                    )}
                  >
                    {store.tenant_name}
                  </button>
                ))}
              </div>
              <div className="px-2 pt-2 border-t border-black/5 mt-2">
                <Link
                  href="/onboarding/customize"
                  className="flex items-center gap-2 w-full px-2 py-2 text-sm font-body text-secondary hover:text-accent hover:bg-accent/5 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create New Store
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-body text-sm font-medium transition-colors group overflow-hidden",
                isActive ? "text-accent" : "text-secondary hover:text-primary"
              )}
            >
              {/* Hover effect using pseudo-element logic translated to framer-motion/tailwind */}
              <div className={cn(
                "absolute inset-0 bg-accent/5 rounded-xl transition-transform duration-300 origin-left ease-premium",
                isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
              )} />
              
              <Icon className={cn(
                "w-5 h-5 relative z-10 transition-colors",
                isActive ? "text-accent" : "text-secondary group-hover:text-primary"
              )} />
              
              <span className="relative z-10">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Area (User / Plan) */}
      <div className="p-4 border-t border-black/[0.03]">
        <div className="bg-background rounded-xl p-4 border border-black/[0.03]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 rounded-full bg-[#00C896] animate-pulse shadow-[0_0_8px_rgba(0,200,150,0.6)]" />
            <span className="text-xs font-body font-medium text-primary">Store Online</span>
          </div>
          <p className="text-xs text-secondary mb-2 font-body">Growth Plan</p>
          <div className="w-full h-1 bg-black/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "45%" }}
              transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="h-full bg-accent"
            />
          </div>
          <p className="text-[10px] text-secondary mt-1 font-accent">45/100 Products</p>
        </div>
      </div>
    </aside>
  );
}
