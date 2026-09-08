"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Users, Key, Webhook, CreditCard } from "lucide-react";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    { name: "General", path: "/dashboard/settings", icon: Settings },
    { name: "Team & Roles", path: "/dashboard/settings/team", icon: Users },
    { name: "API Keys", path: "/dashboard/settings/api-keys", icon: Key },
    { name: "Webhooks", path: "/dashboard/settings/webhooks", icon: Webhook },
    { name: "Billing", path: "/dashboard/settings/billing", icon: CreditCard },
  ];

  return (
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
      <div className="w-full md:w-64 shrink-0">
        <h1 className="font-heading text-3xl text-primary mb-6">Settings</h1>
        <nav className="flex md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0 hide-scrollbar">
          {tabs.map((tab) => {
            const isActive = pathname === tab.path;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.path}
                href={tab.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-body text-sm transition-all whitespace-nowrap ${
                  isActive 
                    ? "bg-black text-white shadow-md font-medium" 
                    : "text-secondary hover:bg-black/[0.04] hover:text-primary"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="flex-1 bg-surface rounded-2xl p-6 md:p-8 shadow-sm border border-black/[0.04] min-h-[500px]">
        {children}
      </div>
    </div>
  );
}
