"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, LogOut, Menu, Package, ShoppingBag, Warehouse, X } from "lucide-react";

const navItems = [
  { name: "Overview", href: "/", icon: LayoutGrid },
  { name: "Orders", href: "/orders", icon: ShoppingBag },
  { name: "Products & Stock", href: "/products", icon: Package },
  { name: "Warehouse", href: "/warehouse", icon: Warehouse },
];

export function EmployeeShell({
  children,
  employeeName,
  storeName,
  warehouseName,
}: {
  children: ReactNode;
  employeeName: string;
  storeName: string;
  warehouseName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const logout = async () => {
    await fetch("/api/v1/employee/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const nav = (
    <>
      <div className="px-4 py-4 border-b border-black/[0.03]">
        <div className="flex items-center gap-3 p-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white shadow-sm shrink-0">
            <Warehouse className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="font-heading text-base text-primary tracking-tight truncate">{storeName || "Store"}</p>
            <p className="text-xs text-secondary truncate">{warehouseName}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 min-h-0 py-6 px-4 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={active ? "page" : undefined}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group overflow-hidden ${active ? "text-accent" : "text-secondary hover:text-primary"}`}
            >
              <div className={`absolute inset-0 bg-accent/5 rounded-xl transition-transform duration-300 origin-left ease-premium ${active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`} />
              <Icon className={`w-5 h-5 relative z-10 ${active ? "text-accent" : "text-secondary group-hover:text-primary"}`} />
              <span className="relative z-10">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-black/[0.03]">
        <div className="bg-background rounded-xl p-4 border border-black/[0.03] mb-3">
          <p className="text-[10px] uppercase tracking-widest text-secondary font-accent mb-1">Signed in as</p>
          <p className="text-sm font-medium text-primary truncate">{employeeName}</p>
        </div>
        <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-secondary hover:bg-black/[0.04] hover:text-primary transition-colors">
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden lg:flex w-[240px] h-screen bg-surface border-r border-black/[0.06] flex-col fixed left-0 top-0 z-40">{nav}</aside>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden />
          <aside className="relative w-[260px] h-full bg-surface flex flex-col shadow-xl">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-3 p-2 text-secondary" aria-label="Close menu">
              <X className="w-4 h-4" />
            </button>
            {nav}
          </aside>
        </div>
      )}

      <div className="flex-1 lg:ml-[240px] min-w-0 flex flex-col">
        <header className="lg:hidden h-16 bg-surface border-b border-black/[0.04] flex items-center gap-3 px-4 sticky top-0 z-30">
          <button onClick={() => setOpen(true)} className="p-2 -ml-2 text-primary" aria-label="Open menu">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-heading text-lg tracking-tight truncate">{warehouseName}</span>
        </header>
        <main className="flex-1 p-4 sm:p-8 overflow-x-hidden">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
