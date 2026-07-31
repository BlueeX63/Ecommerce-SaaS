"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutGrid, 
  ShoppingBag, 
  Users, 
  BarChart3, 
  Settings,
  Store
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion } from "framer-motion";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutGrid },
  { name: "Products", href: "/dashboard/products", icon: ShoppingBag },
  { name: "Customers", href: "/dashboard/customers", icon: Users },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Store Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[240px] h-screen bg-surface border-r border-black/[0.06] flex flex-col fixed left-0 top-0 z-40">
      {/* Logo Area */}
      <div className="h-20 flex items-center px-6 border-b border-black/[0.03]">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <Store className="w-4 h-4" />
          </div>
          <span className="font-heading text-xl text-primary tracking-tight">SaaS</span>
        </Link>
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
