"use client";

import { ReactNode } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { ImpersonationBanner } from "@/components/dashboard/ImpersonationBanner";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { CurrencyProvider } from "@/components/dashboard/CurrencyProvider";
import { WarehouseSetupGate } from "@/components/dashboard/WarehouseSetupGate";

export default function DashboardLayout({ children, user, impersonatedBy }: { children: ReactNode, user?: any, impersonatedBy?: string }) {
  const pathname = usePathname();

  return (
    <CurrencyProvider>
      <WarehouseSetupGate />
      <div className="min-h-screen bg-background flex">
        <Sidebar user={user} />
        <div className="flex-1 ml-[240px] flex flex-col">
          {impersonatedBy && <ImpersonationBanner superAdminEmail={impersonatedBy} />}
          <Topbar user={user} />
          <main className="flex-1 p-8 overflow-x-hidden">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </CurrencyProvider>
  );
}
