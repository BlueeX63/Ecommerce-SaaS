"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Check, Hand, Loader2, MapPin, Package, Phone, RotateCcw, Truck, UserCheck } from "lucide-react";
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
  shipping_phone?: string | null;
  shipping_address_line_1?: string | null;
  shipping_landmark?: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_postal_code: string | null;
  claimed_by_employee_id?: string | null;
  claimed_by?: { full_name: string } | null;
  claimed_by_me?: boolean;
  order_items: Array<{ order_item_id: string; product_name: string; quantity: number }>;
  /** Only on orders from the open pool. */
  canFulfil?: boolean;
  shortages?: Array<{ name: string; needed: number; available: number }>;
}

const TABS = [
  { id: "OPEN", label: "To pack" },
  { id: "UNCLAIMED", label: "Unclaimed" },
  { id: "MINE", label: "Mine" },
  { id: "AVAILABLE", label: "Available to take" },
  { id: "SHIPPED", label: "Shipped" },
  { id: "DELIVERED", label: "Delivered" },
  { id: "CANCELLED", label: "Cancelled" },
  { id: "ALL", label: "All" },
] as const;
type Tab = (typeof TABS)[number]["id"];

const STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
const PAYMENT_STATUSES = ["UNPAID", "PARTIALLY_PAID", "PAID"];
const METHOD: Record<string, string> = { cod: "Cash on Delivery", upi: "UPI", netbanking: "Netbanking" };
const NEXT: Record<string, { to: string; label: string } | undefined> = {
  PENDING: { to: "PROCESSING", label: "Start packing" },
  PROCESSING: { to: "SHIPPED", label: "Mark shipped" },
  SHIPPED: { to: "DELIVERED", label: "Mark delivered" },
};

const symbol = (c: string | null) => ({ USD: "$", EUR: "€", GBP: "£" } as Record<string, string>)[c ?? ""] ?? "₹";
const select = "px-3 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-black/5 disabled:opacity-50";
const secondary = "px-3.5 py-2 bg-white border border-black/10 rounded-lg text-sm font-medium text-primary hover:bg-black/5 disabled:opacity-50 flex items-center gap-2";

function isTab(value: string | null): value is Tab {
  return TABS.some((t) => t.id === value);
}

function OrdersView() {
  const params = useSearchParams();
  const initial = (params.get("tab") ?? "").toUpperCase();
  const [tab, setTab] = useState<Tab>(isTab(initial) ? initial : "OPEN");
  // The loaded list remembers which tab it belongs to: switching tabs shows the old rows dimmed until the new ones
  // arrive, and a refresh of the same tab never flashes.
  const [data, setData] = useState<{ tab: Tab; orders: Order[]; total: number | null } | null>(null);
  const orders = data?.orders ?? [];
  const total = data?.total ?? null;
  const loading = data?.tab !== tab;
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [handBackId, setHandBackId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const seq = useRef(0);

  const fetchTab = useCallback(async (t: Tab) => {
    const url = t === "AVAILABLE" ? "/api/v1/employee/orders/available" : `/api/v1/employee/orders?limit=50${t === "ALL" ? "" : `&status=${t}`}`;
    const res = await fetch(url, { cache: "no-store" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || "Failed to load orders");
    return { orders: (body.data ?? []) as Order[], total: (body.meta?.total ?? null) as number | null };
  }, []);

  // Opening a tab.
  useEffect(() => {
    let ignore = false;
    fetchTab(tab)
      .then((r) => {
        if (ignore) return;
        setData({ tab, ...r });
        setLoadError(null);
      })
      .catch((e) => {
        if (ignore) return;
        setLoadError(e instanceof Error ? e.message : "Failed to load orders");
        setData((prev) => (prev?.tab === tab ? prev : { tab, orders: [], total: null }));
      });
    return () => {
      ignore = true;
    };
  }, [tab, fetchTab]);

  // Refreshing the open tab (after an action, and while the panel sits open: new orders arrive, teammates take orders).
  const refresh = useCallback(async () => {
    const id = ++seq.current;
    try {
      const r = await fetchTab(tab);
      if (id !== seq.current) return;
      setData({ tab, ...r });
      setLoadError(null);
    } catch (e) {
      if (id === seq.current) setLoadError(e instanceof Error ? e.message : "Failed to load orders");
    }
  }, [tab, fetchTab]);

  useEffect(() => {
    const t = setInterval(() => document.visibilityState === "visible" && !busyId && refresh(), 30_000);
    return () => clearInterval(t);
  }, [refresh, busyId]);

  const call = async (order: Order, path: string, init: { method?: string; body?: unknown } = {}, success?: string) => {
    setBusyId(order.order_id);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/v1/employee/orders/${order.order_id}${path}`, {
        method: init.method ?? "POST",
        headers: { "Content-Type": "application/json" },
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(Array.isArray(result.details) && result.details.length ? result.details.join(" · ") : result.error || "That didn't work");
      if (success ?? result.message) setNotice(success ?? result.message);
      await refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "That didn't work");
      await refresh(); // somebody else may have just changed it: show what is true now
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const update = (order: Order, patch: { status?: string; paymentStatus?: string }) => {
    if (patch.status === "CANCELLED" && !confirm(`Cancel ${order.order_number}? The stock goes back to the shelf.`)) return;
    return call(order, "", { method: "PATCH", body: patch }, "Order updated");
  };

  const handBack = async (order: Order) => {
    if (await call(order, "/release", { body: { reason } })) {
      setHandBackId(null);
      setReason("");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        subtitle={tab === "AVAILABLE" ? "Orders no warehouse is handling yet. Take one your shelves can cover and it becomes yours." : "Orders your warehouse is fulfilling. Claim one so your team knows you've got it."}
      />

      <div className="flex flex-wrap gap-2" role="tablist">
        {TABS.map((f) => (
          <button key={f.id} role="tab" aria-selected={tab === f.id} onClick={() => { setTab(f.id); setNotice(null); setError(null); setLoadError(null); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === f.id ? "bg-black text-white" : "bg-surface border border-black/10 text-secondary hover:text-primary"}`}>
            {f.label}
            {f.id === "AVAILABLE" && tab === "AVAILABLE" && total !== null && <span className="ml-2 px-1.5 py-0.5 rounded-full bg-white/20 text-xs tabular-nums">{total}</span>}
          </button>
        ))}
      </div>

      {notice && <p role="status" className="p-4 bg-green-50 text-green-800 text-sm rounded-xl border border-green-100 flex items-center gap-2"><Check className="w-4 h-4" /> {notice}</p>}
      {(error || loadError) && <p role="alert" className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">{error ?? loadError}</p>}

      {loading && orders.length === 0 ? (
        <LoadingRegion className="space-y-4">
          {[0, 1, 2].map((i) => <Bone key={i} className="h-44 rounded-2xl" />)}
        </LoadingRegion>
      ) : orders.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-black/[0.04] p-16 text-center text-secondary">
          <Package className="w-12 h-12 text-black/10 mx-auto mb-3" />
          {tab === "AVAILABLE" ? "No open orders are waiting for a warehouse." : "Nothing here."}
        </div>
      ) : (
        <ul className={`space-y-4 ${loading ? "opacity-60" : ""}`}>
          {orders.map((o) => {
            const pool = tab === "AVAILABLE";
            const next = NEXT[o.status];
            const busy = busyId === o.order_id;
            const locked = o.status === "CANCELLED" || o.status === "DELIVERED";
            const open = o.status === "PENDING" || o.status === "PROCESSING";
            const theirs = !!o.claimed_by_employee_id && !o.claimed_by_me;
            const blocked = busy || theirs;
            return (
              <li key={o.order_id} className={`bg-surface rounded-2xl border shadow-sm p-5 sm:p-6 ${o.claimed_by_me ? "border-black/30" : "border-black/[0.04]"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="font-heading text-lg text-primary">{o.order_number}</p>
                    <p className="text-xs text-secondary">
                      {new Date(o.created_date).toLocaleString()} · {METHOD[o.payment_method ?? ""] ?? "—"} · <span className="tabular-nums font-medium text-primary">{symbol(o.currency)}{Number(o.grand_total).toFixed(2)}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {!pool && open && (
                      o.claimed_by_me ? (
                        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-black text-white flex items-center gap-1"><UserCheck className="w-3 h-3" /> You&apos;re handling this</span>
                      ) : o.claimed_by ? (
                        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 flex items-center gap-1"><UserCheck className="w-3 h-3" /> {o.claimed_by.full_name}</span>
                      ) : (
                        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">Unclaimed</span>
                      )
                    )}
                    <StatusBadge value={o.status} />
                    <StatusBadge value={o.payment_status} />
                  </div>
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
                    <p className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 shrink-0" /><span><span className="text-primary font-medium">{o.shipping_name}</span>{o.shipping_address_line_1 && <><br />{o.shipping_address_line_1}{o.shipping_landmark ? `, ${o.shipping_landmark}` : ""}</>}<br />{[o.shipping_city, o.shipping_state, o.shipping_postal_code].filter(Boolean).join(", ")}</span></p>
                    {o.shipping_phone && <p className="flex items-center gap-2"><Phone className="w-4 h-4 shrink-0" /> {o.shipping_phone}</p>}
                    {o.estimated_delivery_date && !locked && <p className="flex items-center gap-2"><Truck className="w-4 h-4 shrink-0" /> Promised by {new Date(o.estimated_delivery_date).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</p>}
                  </div>
                </div>

                {pool ? (
                  <div className="mt-5 pt-4 border-t border-black/[0.05] flex flex-wrap items-center justify-between gap-3">
                    {o.canFulfil ? (
                      <p className="text-sm font-medium text-green-700 flex items-center gap-1.5"><Check className="w-4 h-4" /> Your shelves cover every item</p>
                    ) : (
                      <ul className="space-y-0.5">
                        {(o.shortages ?? []).map((s) => (
                          <li key={s.name} className="text-sm text-red-700 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 shrink-0" /> {s.name}: needs {s.needed}, you have {s.available}</li>
                        ))}
                      </ul>
                    )}
                    <button onClick={() => call(o, "/take")} disabled={busy || !o.canFulfil} className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-black/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                      {busy && <Loader2 className="w-4 h-4 animate-spin" />} Take this order
                    </button>
                  </div>
                ) : (
                  !["REFUNDED", "RETURN_REQUESTED"].includes(o.status) && (
                    <div className="mt-5 pt-4 border-t border-black/[0.05] space-y-3">
                      {theirs && <p className="text-sm text-blue-800 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">{o.claimed_by?.full_name ?? "A colleague"} is handling this order, so only they can change it.</p>}
                      <div className="flex flex-wrap items-center gap-3">
                        {open && !o.claimed_by_employee_id && (
                          <button onClick={() => call(o, "/claim")} disabled={busy} className={secondary}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Hand className="w-4 h-4" />} I&apos;ll handle this</button>
                        )}
                        {next && (
                          <button onClick={() => update(o, { status: next.to })} disabled={blocked} className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-black/90 disabled:opacity-50 flex items-center gap-2">
                            {busy && <Loader2 className="w-4 h-4 animate-spin" />} {next.label}
                          </button>
                        )}
                        <label className="flex items-center gap-2 text-xs text-secondary">
                          Status
                          <select value={o.status} disabled={blocked} onChange={(e) => update(o, { status: e.target.value })} className={select}>
                            {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                          </select>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-secondary">
                          Payment
                          <select value={o.payment_status} disabled={blocked || o.payment_status === "REFUNDED"} onChange={(e) => update(o, { paymentStatus: e.target.value })} className={select}>
                            {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                          </select>
                        </label>
                        {open && o.claimed_by_me && (
                          <button onClick={() => call(o, "/unclaim")} disabled={busy} className={secondary}>Stop handling</button>
                        )}
                        {open && !theirs && (
                          <button onClick={() => { setHandBackId(handBackId === o.order_id ? null : o.order_id); setReason(""); }} disabled={busy} className={`${secondary} text-red-700`}><RotateCcw className="w-4 h-4" /> Can&apos;t fulfil</button>
                        )}
                      </div>

                      {handBackId === o.order_id && (
                        <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 space-y-3">
                          <p className="text-sm text-primary">Hand this order back so another warehouse can take it. The items return to your stock count and the store owner is told.</p>
                          <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="Why can't you fulfil it? (e.g. item damaged, shelf empty)" className="w-full px-3.5 py-2.5 bg-white border border-black/[0.08] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5" />
                          <div className="flex gap-2">
                            <button onClick={() => handBack(o)} disabled={busy || reason.trim().length < 3} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">{busy && <Loader2 className="w-4 h-4 animate-spin" />} Hand back</button>
                            <button onClick={() => setHandBackId(null)} className="px-4 py-2 text-sm text-secondary">Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                )}
              </li>
            );
          })}
        </ul>
      )}

      {tab === "AVAILABLE" && total !== null && total > orders.length && <p className="text-xs text-secondary text-center">Showing the {orders.length} oldest of {total} open orders.</p>}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<LoadingRegion className="space-y-4">{[0, 1, 2].map((i) => <Bone key={i} className="h-44 rounded-2xl" />)}</LoadingRegion>}>
      <OrdersView />
    </Suspense>
  );
}
