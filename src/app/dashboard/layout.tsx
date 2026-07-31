"use client";

import { ReactNode } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 ml-[240px] flex flex-col">
        <Topbar />
        <main className="flex-1 p-8 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
