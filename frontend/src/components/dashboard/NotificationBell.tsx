"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Bell, CheckCheck } from "lucide-react";

interface Notification {
  notification_id: string;
  type: string;
  title: string;
  body: string | null;
  product_id: string | null;
  is_read: boolean;
  created_date: string;
}

const timeAgo = (iso: string) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  return hrs < 24 ? `${hrs}h ago` : `${Math.round(hrs / 24)}d ago`;
};

/** The dashboard bell: out-of-stock alerts per product and warehouse, refreshed while the page is open. */
export function NotificationBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/dashboard/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.data ?? []);
      setUnread(data.unread ?? 0);
    } catch {
      // the bell is non-essential; stay quiet when offline
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(() => document.visibilityState === "visible" && load(), 45_000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const markAllRead = async () => {
    setItems((list) => list.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
    await fetch("/api/v1/dashboard/notifications/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) }).catch(() => undefined);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        className="relative p-2 text-secondary hover:text-primary transition-colors group"
      >
        <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-3 w-[360px] max-w-[92vw] bg-white border border-black/[0.06] rounded-2xl shadow-xl overflow-hidden z-50" role="dialog" aria-label="Notifications">
          <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.05]">
            <p className="text-sm font-semibold text-primary">Notifications</p>
            {unread > 0 && (
              <button type="button" onClick={markAllRead} className="flex items-center gap-1 text-xs font-medium text-accent hover:underline">
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-[420px] overflow-y-auto divide-y divide-black/[0.04]">
            {items.length === 0 ? (
              <li className="px-4 py-10 text-center text-sm text-secondary">You&apos;re all caught up.</li>
            ) : (
              items.map((n) => (
                <li key={n.notification_id}>
                  <Link
                    href={n.type === "OUT_OF_STOCK" ? "/dashboard/inventory" : "/dashboard/overview"}
                    onClick={() => setOpen(false)}
                    className={`flex gap-3 px-4 py-3 hover:bg-black/[0.02] transition-colors ${n.is_read ? "opacity-60" : ""}`}
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                      <AlertTriangle className="w-4 h-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-primary">{n.title}</span>
                      {n.body && <span className="block text-xs text-secondary mt-0.5">{n.body}</span>}
                      <span className="block text-[11px] text-secondary/70 mt-1">{timeAgo(n.created_date)}</span>
                    </span>
                    {!n.is_read && <span className="ml-auto mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden />}
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
