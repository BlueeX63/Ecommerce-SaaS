"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, Store, ShoppingBag, ScrollText, Activity, LogOut, ShieldCheck } from "lucide-react";

const navItems = [
  { name: "Overview", href: "/", icon: LayoutGrid },
  { name: "Stores", href: "/tenants", icon: Store },
  { name: "Orders", href: "/orders", icon: ShoppingBag },
  { name: "Audit log", href: "/audit-log", icon: ScrollText },
  { name: "System", href: "/system", icon: Activity },
];

export function SuperAdminShell({ children, email }: { children: ReactNode; email: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/v1/super-admin/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-[220px] h-screen bg-surface border-r border-black/10 flex flex-col fixed left-0 top-0">
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-black/10">
          <div className="w-7 h-7 rounded-md bg-primary text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="font-heading text-base text-primary tracking-tight">Super Admin</span>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive ? "bg-primary text-white" : "text-secondary hover:bg-black/[0.04] hover:text-primary"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-black/10">
          <div className="px-2 py-2">
            <p className="text-xs text-secondary truncate" title={email}>{email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-secondary hover:bg-black/[0.04] hover:text-primary transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 ml-[220px]">
        <main className="p-8 max-w-6xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
