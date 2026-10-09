"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Package, Phone, Truck } from "lucide-react";
import { Bone, LoadingRegion, PageHeader, StatusBadge } from "@/components/ui";

interface Order {
  order_id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  grand_total: number;
  currency: string | null;
  created_date: string;
  estimated_delivery_date: string | null;
  shipping_name: string | null;
  shipping_phone: string | null;
  shipping_address_line_1: string | null;
  shipping_landmark: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_postal_code: string | null;
  order_items: Array<{ order_item_id: string; product_name: string; quantity: number }>;
}

const FILTERS = [
  { id: "OPEN", label: "To pack" },
  { id: "SHIPPED", label: "Shipped" },
  { id: "DELIVERED", label: "Delivered" },
  { id: "CANCELLED", label: "Cancelled" },
  { id: "ALL", label: "All" },
] as const;

const STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
const PAYMENT_STATUSES = ["UNPAID", "PARTIALLY_PAID", "PAID"];
const METHOD: Record<string, string> = { cod: "Cash on Delivery", upi: "UPI", netbanking: "Netbanking" };
const NEXT: Record<string, { to: string; label: string } | undefined> = {
  PENDING: { to: "PROCESSING", label: "Start packing" },
  PROCESSING: { to: "SHIPPED", label: "Mark shipped" },
  SHIPPED: { to: "DELIVERED", label: "Mark delivered" },
};

const symbol = (c: string | null) => ({ USD: "$", EUR: "€", GBP: "£" } as Record<string, string>)[c ?? ""] ?? "₹";
const select = "px-3 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-black/5";

export default function OrdersPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("OPEN");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const seq = useRef(0);

  const load = useCallback(async () => {
    const id = ++seq.current;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/employee/orders?limit=50${filter === "ALL" ? "" : `&status=${filter}`}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (id !== seq.current) return;
      if (!res.ok) throw new Error(data.error || "Failed to load orders");
      setOrders(data.data ?? []);
      setError(null);
    } catch (e) {
      if (id === seq.current) setError(e instanceof Error ? e.message : "Failed to load orders");
    } finally {
      if (id === seq.current) setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  // New orders arrive while the panel is open.
  useEffect(() => {
    const t = setInterval(() => document.visibilityState === "visible" && load(), 30_000);
    return () => clearInterval(t);
  }, [load]);

  const update = async (order: Order, patch: { status?: string; paymentStatus?: string }) => {
    if (patch.status === "CANCELLED" && !confirm(`Cancel ${order.order_number}? The stock goes back to the shelf.`)) return;
    setBusyId(order.order_id);
    setError(null);
    try {
      const res = await fetch(`/api/v1/employee/orders/${order.order_id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not update the order");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update the order");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" subtitle="Orders your warehouse is fulfilling — it's the nearest one with the items in stock." />

      <div className="flex flex-wrap gap-2" role="tablist">
        {FILTERS.map((f) => (
          <button key={f.id} role="tab" aria-selected={filter === f.id} onClick={() => setFilter(f.id)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f.id ? "bg-black text-white" : "bg-surface border border-black/10 text-secondary hover:text-primary"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">{error}</p>}

      {loading && orders.length === 0 ? (
        <LoadingRegion className="space-y-4">
          {[0, 1, 2].map((i) => <Bone key={i} className="h-44 rounded-2xl" />)}
        </LoadingRegion>
      ) : orders.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-black/[0.04] p-16 text-center text-secondary">
          <Package className="w-12 h-12 text-black/10 mx-auto mb-3" />
          Nothing here.
        </div>
      ) : (
        <ul className={`space-y-4 ${loading ? "opacity-60" : ""}`}>
          {orders.map((o) => {
            const next = NEXT[o.status];
            const busy = busyId === o.order_id;
            const locked = o.status === "CANCELLED" || o.status === "DELIVERED";
            return (
              <li key={o.order_id} className="bg-surface rounded-2xl border border-black/[0.04] shadow-sm p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="font-heading text-lg text-primary">{o.order_number}</p>
                    <p className="text-xs text-secondary">
                      {new Date(o.created_date).toLocaleString()} · {METHOD[o.payment_method ?? ""] ?? "—"} · <span className="tabular-nums font-medium text-primary">{symbol(o.currency)}{Number(o.grand_total).toFixed(2)}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2"><StatusBadge value={o.status} /><StatusBadge value={o.payment_status} /></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-secondary mb-1.5">Items</p>
                    <ul className="space-y-1">
                      {o.order_items.map((i) => (
                        <li key={i.order_item_id} className="flex justify-between gap-3"><span className="truncate">{i.product_name}</span><span className="tabular-nums text-secondary">× {i.quantity}</span></li>
                      ))}
                    </ul>
                  </div>
                  <div className="text-secondary space-y-1">
                    <p className="text-[11px] uppercase tracking-widest mb-1.5">Deliver to</p>
                    <p className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 shrink-0" /><span><span className="text-primary font-medium">{o.shipping_name}</span><br />{o.shipping_address_line_1}{o.shipping_landmark ? `, ${o.shipping_landmark}` : ""}<br />{[o.shipping_city, o.shipping_state, o.shipping_postal_code].filter(Boolean).join(", ")}</span></p>
                    {o.shipping_phone && <p className="flex items-center gap-2"><Phone className="w-4 h-4 shrink-0" /> {o.shipping_phone}</p>}
                    {o.estimated_delivery_date && !locked && <p className="flex items-center gap-2"><Truck className="w-4 h-4 shrink-0" /> Promised by {new Date(o.estimated_delivery_date).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</p>}
                  </div>
                </div>

                {!["REFUNDED", "RETURN_REQUESTED"].includes(o.status) && (
                  <div className="mt-5 pt-4 border-t border-black/[0.05] flex flex-wrap items-center gap-3">
                    {next && (
                      <button onClick={() => update(o, { status: next.to })} disabled={busy} className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-black/90 disabled:opacity-50 flex items-center gap-2">
                        {busy && <Loader2 className="w-4 h-4 animate-spin" />} {next.label}
                      </button>
                    )}
                    <label className="flex items-center gap-2 text-xs text-secondary">
                      Status
                      <select value={o.status} disabled={busy} onChange={(e) => update(o, { status: e.target.value })} className={select}>
                        {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                      </select>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-secondary">
                      Payment
                      <select value={o.payment_status} disabled={busy || o.payment_status === "REFUNDED"} onChange={(e) => update(o, { paymentStatus: e.target.value })} className={select}>
                        {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                      </select>
                    </label>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
