"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Banknote, Bot, Check, Clock, ExternalLink, Headset, LifeBuoy, Loader2, MapPin, Phone, Send, UserRound, X } from "lucide-react";
import { useCurrency } from "@/components/dashboard/CurrencyProvider";
import { Bone, LoadingRegion } from "@/components/dashboard/Skeletons";

// ---------------------------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------------------------

interface Message {
  role: "customer" | "assistant" | "staff";
  text: string;
  at: string;
}

interface ProposedChange {
  type: "change_phone" | "change_address";
  phone?: string;
  address?: { line1: string; landmark?: string | null; city?: string | null; state?: string | null; postalCode?: string | null };
}

interface SupportRequest {
  request_id: string;
  order_id: string;
  category: "ADDRESS_CHANGE" | "PHONE_CHANGE" | "GENERAL";
  status: "OPEN" | "AI_RESOLVED" | "ESCALATED" | "RESOLVED" | "CLOSED";
  handled_by: "AI" | "STAFF";
  summary: string | null;
  messages: Message[];
  proposed_changes: ProposedChange | null;
  resolution_note: string | null;
  updated_date: string;
  orders: {
    order_id: string;
    order_number: string;
    status: string;
    shipping_name: string | null;
    shipping_phone: string | null;
    shipping_address_line_1: string | null;
    shipping_landmark: string | null;
    shipping_city: string | null;
    shipping_state: string | null;
    shipping_postal_code: string | null;
    estimated_delivery_date: string | null;
    created_date: string;
  } | null;
  customers: { first_name: string; last_name: string; phone_number: string | null; email: string | null } | null;
  edit_window: { open: boolean; hoursLeft: number; reason: string | null } | null;
}

interface Refund {
  refund_id: string;
  order_id: string;
  amount: number;
  currency: string | null;
  method: "SOURCE" | "BANK_TRANSFER";
  source_payment_method: string | null;
  status: "REQUESTED" | "APPROVED" | "PROCESSED" | "REJECTED";
  reason: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  bank_name: string | null;
  reference: string | null;
  admin_note: string | null;
  created_date: string;
  processed_date: string | null;
  orders: { order_number: string; payment_method: string | null; status: string } | null;
  customers: { first_name: string; last_name: string; phone_number: string | null; email: string | null } | null;
}

const REQUEST_STATUS_STYLE: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  ESCALATED: "bg-amber-100 text-amber-800",
  AI_RESOLVED: "bg-green-100 text-green-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-100 text-gray-600",
};
const REFUND_STATUS_STYLE: Record<string, string> = {
  REQUESTED: "bg-amber-100 text-amber-800",
  APPROVED: "bg-blue-100 text-blue-700",
  PROCESSED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};
const CATEGORY_LABEL = { ADDRESS_CHANGE: "Address change", PHONE_CHANGE: "Phone change", GENERAL: "General" } as const;

const timeAgo = (iso: string) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
};
const customerName = (c: { first_name: string; last_name: string } | null) => (c ? `${c.first_name} ${c.last_name}`.trim() : "Guest");

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap ${className}`}>{children}</span>;
}

// ---------------------------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------------------------

export default function SupportPage() {
  const [tab, setTab] = useState<"requests" | "refunds">("requests");
  const [counts, setCounts] = useState({ openRequests: 0, openRefunds: 0 });

  const loadCounts = useCallback(() => {
    fetch("/api/v1/dashboard/support/counts", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => c && setCounts(c))
      .catch(() => undefined);
  }, []);
  useEffect(loadCounts, [loadCounts]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-3xl text-primary mb-1">Support &amp; Refunds</h1>
        <p className="text-secondary text-sm">Requests the AI assistant couldn&apos;t finish on its own, and refunds shoppers have asked for.</p>
      </div>

      <div className="flex gap-2 border-b border-black/[0.06]" role="tablist">
        {(
          [
            ["requests", "Order help", counts.openRequests, LifeBuoy],
            ["refunds", "Refunds", counts.openRefunds, Banknote],
          ] as const
        ).map(([id, label, count, Icon]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === id ? "border-black text-primary" : "border-transparent text-secondary hover:text-primary"}`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {count > 0 && <span className="min-w-5 h-5 px-1.5 rounded-full bg-accent text-white text-[11px] font-bold flex items-center justify-center">{count}</span>}
          </button>
        ))}
      </div>

      {tab === "requests" ? <RequestsPanel onChanged={loadCounts} /> : <RefundsPanel onChanged={loadCounts} />}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Support requests
// ---------------------------------------------------------------------------------------------

function RequestsPanel({ onChanged }: { onChanged: () => void }) {
  const [filter, setFilter] = useState<"ACTIVE" | "ALL">("ACTIVE");
  const [items, setItems] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/dashboard/support-requests?limit=50${filter === "ACTIVE" ? "&status=ACTIVE" : ""}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load requests");
      setItems(data.data ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  // New escalations arrive while the page is open.
  useEffect(() => {
    const t = setInterval(() => document.visibilityState === "visible" && load(), 30_000);
    return () => clearInterval(t);
  }, [load]);

  const selected = items.find((i) => i.request_id === selectedId) ?? null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-6 items-start">
      <div className="bg-surface rounded-2xl border border-black/[0.04] shadow-sm overflow-hidden">
        <div className="p-3 border-b border-black/[0.04] flex gap-2">
          {(["ACTIVE", "ALL"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filter === f ? "bg-black text-white" : "text-secondary hover:bg-black/5"}`}>
              {f === "ACTIVE" ? "Needs attention" : "All requests"}
            </button>
          ))}
        </div>
        {loading ? (
          <LoadingRegion className="p-4 space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Bone className="h-4 w-40" />
                <Bone className="h-3 w-full" />
              </div>
            ))}
          </LoadingRegion>
        ) : error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-secondary">
            <Check className="w-10 h-10 text-black/10 mx-auto mb-3" />
            <p className="text-sm">{filter === "ACTIVE" ? "Nothing needs your attention." : "No requests yet."}</p>
          </div>
        ) : (
          <ul className="divide-y divide-black/[0.04] max-h-[70vh] overflow-y-auto">
            {items.map((r) => {
              const last = r.messages[r.messages.length - 1];
              return (
                <li key={r.request_id}>
                  <button onClick={() => setSelectedId(r.request_id)} className={`w-full text-left p-4 transition-colors hover:bg-black/[0.02] ${selectedId === r.request_id ? "bg-black/[0.04]" : ""}`}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-medium text-primary text-sm truncate">{r.orders?.order_number ?? "Order"}</span>
                      <Badge className={REQUEST_STATUS_STYLE[r.status]}>{r.status.replace("_", " ")}</Badge>
                    </div>
                    <p className="text-xs text-secondary">
                      {customerName(r.customers)} · {CATEGORY_LABEL[r.category]} · {timeAgo(r.updated_date)}
                    </p>
                    {last && <p className="mt-1.5 text-xs text-secondary line-clamp-2">{last.text}</p>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {selected ? (
        <RequestDetail key={selected.request_id} request={selected} onUpdated={() => { load(); onChanged(); }} onClose={() => setSelectedId(null)} />
      ) : (
        <div className="hidden lg:flex bg-surface rounded-2xl border border-black/[0.04] shadow-sm min-h-[320px] items-center justify-center text-secondary text-sm">
          Select a request to see the conversation.
        </div>
      )}
    </div>
  );
}

function RequestDetail({ request, onUpdated, onClose }: { request: SupportRequest; onUpdated: () => void; onClose: () => void }) {
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const o = request.orders;
  const [form, setForm] = useState({
    phone: o?.shipping_phone ?? "",
    line1: o?.shipping_address_line_1 ?? "",
    landmark: o?.shipping_landmark ?? "",
    city: o?.shipping_city ?? "",
    state: o?.shipping_state ?? "",
    postalCode: o?.shipping_postal_code ?? "",
  });
  const closed = request.status === "RESOLVED" || request.status === "CLOSED" || request.status === "AI_RESOLVED";

  const respond = async (action: string, body: Record<string, unknown>) => {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/api/v1/dashboard/support-requests/${request.request_id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(Array.isArray(data.details) ? data.details.join(" · ") : data.error || "Request failed");
      setReply("");
      setEditing(false);
      onUpdated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(null);
    }
  };

  const proposed = request.proposed_changes;

  return (
    <div className="bg-surface rounded-2xl border border-black/[0.04] shadow-sm overflow-hidden">
      <div className="p-5 border-b border-black/[0.04] flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="font-heading text-xl text-primary">{o?.order_number}</h2>
            <Badge className={REQUEST_STATUS_STYLE[request.status]}>{request.status.replace("_", " ")}</Badge>
            <Badge className="bg-gray-100 text-gray-700">{CATEGORY_LABEL[request.category]}</Badge>
          </div>
          <p className="text-sm text-secondary mt-1">
            {customerName(request.customers)}
            {request.customers?.phone_number ? ` · ${request.customers.phone_number}` : ""}
            {request.customers?.email ? ` · ${request.customers.email}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {o && (
            <Link href={`/dashboard/orders/${o.order_id}`} className="p-2 text-secondary hover:bg-black/5 rounded-lg" title="Open order">
              <ExternalLink className="w-4 h-4" />
            </Link>
          )}
          <button onClick={onClose} className="lg:hidden p-2 text-secondary hover:bg-black/5 rounded-lg" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {o && (
        <div className="px-5 py-4 bg-black/[0.015] border-b border-black/[0.04] grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
            <div className="text-secondary">
              {o.shipping_name && <p className="text-primary font-medium">{o.shipping_name}</p>}
              <p>{o.shipping_address_line_1}</p>
              {o.shipping_landmark && <p>Landmark: {o.shipping_landmark}</p>}
              <p>{[o.shipping_city, o.shipping_state, o.shipping_postal_code].filter(Boolean).join(", ")}</p>
            </div>
          </div>
          <div className="space-y-1.5 text-secondary">
            <p className="flex items-center gap-2"><Phone className="w-4 h-4 shrink-0" /> {o.shipping_phone || "No phone on order"}</p>
            <p className="flex items-center gap-2"><Clock className="w-4 h-4 shrink-0" /> Order {o.status.toLowerCase().replace("_", " ")}{request.edit_window ? (request.edit_window.open ? ` · shopper window: ${Math.ceil(request.edit_window.hoursLeft)}h left` : " · 24h shopper window closed") : ""}</p>
            <button type="button" onClick={() => setEditing((e) => !e)} className="text-xs font-semibold text-accent hover:underline">
              {editing ? "Cancel editing" : "Edit delivery details…"}
            </button>
          </div>
        </div>
      )}

      {editing && (
        <form
          className="px-5 py-4 border-b border-black/[0.04] grid grid-cols-1 sm:grid-cols-2 gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            // Staff edits: send phone and address as two explicit changes the server validates.
            const addressChanged = form.line1 !== (o?.shipping_address_line_1 ?? "") || form.city !== (o?.shipping_city ?? "") || form.state !== (o?.shipping_state ?? "") || form.postalCode !== (o?.shipping_postal_code ?? "") || form.landmark !== (o?.shipping_landmark ?? "");
            if (addressChanged) respond("edit", { change: { type: "change_address", address: { line1: form.line1, landmark: form.landmark || null, city: form.city || null, state: form.state || null, postalCode: form.postalCode || null } }, message: reply || undefined });
            else if (form.phone !== (o?.shipping_phone ?? "")) respond("edit", { change: { type: "change_phone", phone: form.phone }, message: reply || undefined });
            else setEditing(false);
          }}
        >
          <input aria-label="Phone" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="px-3 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg text-sm sm:col-span-2" />
          <input aria-label="Street address" placeholder="Street address" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} className="px-3 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg text-sm sm:col-span-2" />
          <input aria-label="Landmark" placeholder="Landmark" value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} className="px-3 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg text-sm" />
          <input aria-label="PIN code" placeholder="PIN code" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} className="px-3 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg text-sm" />
          <input aria-label="City" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="px-3 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg text-sm" />
          <input aria-label="State" placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="px-3 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg text-sm" />
          <div className="sm:col-span-2 flex justify-end">
            <button type="submit" disabled={busy === "edit"} className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
              {busy === "edit" && <Loader2 className="w-4 h-4 animate-spin" />} Save &amp; resolve
            </button>
          </div>
        </form>
      )}

      {/* conversation */}
      <div className="p-5 space-y-3 max-h-[380px] overflow-y-auto">
        {request.messages.map((m, i) => {
          const fromCustomer = m.role === "customer";
          return (
            <div key={i} className={`flex gap-2 ${fromCustomer ? "justify-start" : "justify-end"}`}>
              {fromCustomer && <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/5"><UserRound className="w-3.5 h-3.5" /></span>}
              <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-line ${fromCustomer ? "bg-black/[0.04] text-primary" : m.role === "staff" ? "bg-black text-white" : "bg-blue-50 text-blue-900 border border-blue-100"}`}>
                <span className="block text-[10px] font-semibold uppercase tracking-wider opacity-60 mb-0.5">
                  {fromCustomer ? "Customer" : m.role === "staff" ? "Store team" : "AI assistant"} · {timeAgo(m.at)}
                </span>
                {m.text}
              </div>
              {!fromCustomer && (
                <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/5">{m.role === "staff" ? <Headset className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* requested change */}
      {proposed && !closed && (
        <div className="mx-5 mb-4 p-4 rounded-xl border border-amber-200 bg-amber-50 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="text-sm text-amber-900">
            <p className="font-semibold flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Shopper wants to change</p>
            <p className="mt-0.5">
              {proposed.type === "change_phone"
                ? `Delivery phone → ${proposed.phone}`
                : `Address → ${[proposed.address?.line1, proposed.address?.landmark, proposed.address?.city, proposed.address?.state, proposed.address?.postalCode].filter(Boolean).join(", ")}`}
            </p>
          </div>
          <button onClick={() => respond("apply", { applyProposed: true, message: reply || undefined })} disabled={!!busy} className="shrink-0 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2">
            {busy === "apply" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Apply change
          </button>
        </div>
      )}

      {error && <p role="alert" className="mx-5 mb-3 text-sm text-red-600">{error}</p>}

      {!closed ? (
        <div className="p-5 border-t border-black/[0.04] space-y-3">
          <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={2} maxLength={1000} placeholder="Reply to the shopper…" className="w-full px-3.5 py-2.5 bg-black/[0.02] border border-black/[0.08] rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black/5" />
          <div className="flex flex-wrap justify-end gap-2">
            <button onClick={() => respond("resolve", { resolve: true, message: reply || undefined })} disabled={!!busy} className="px-4 py-2 border border-black/10 rounded-lg text-sm font-medium hover:bg-black/5 disabled:opacity-50 flex items-center gap-2">
              {busy === "resolve" && <Loader2 className="w-4 h-4 animate-spin" />} Mark resolved
            </button>
            <button onClick={() => respond("send", { message: reply })} disabled={!!busy || !reply.trim()} className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-black/90 disabled:opacity-50 flex items-center gap-2">
              {busy === "send" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send reply
            </button>
          </div>
        </div>
      ) : (
        request.resolution_note && <p className="px-5 pb-5 text-sm text-secondary">Outcome: {request.resolution_note}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Refunds
// ---------------------------------------------------------------------------------------------

function RefundsPanel({ onChanged }: { onChanged: () => void }) {
  const { formatCurrency } = useCurrency();
  const [filter, setFilter] = useState<"ACTIVE" | "ALL">("ACTIVE");
  const [items, setItems] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Refund | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/dashboard/refunds?limit=50${filter === "ACTIVE" ? "&status=ACTIVE" : ""}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load refunds");
      setItems(data.data ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load refunds");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  return (
    <div className="bg-surface rounded-2xl border border-black/[0.04] shadow-sm overflow-hidden">
      <div className="p-3 border-b border-black/[0.04] flex gap-2">
        {(["ACTIVE", "ALL"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filter === f ? "bg-black text-white" : "text-secondary hover:bg-black/5"}`}>
            {f === "ACTIVE" ? "To process" : "All refunds"}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/[0.04] bg-black/[0.01]">
            <tr>
              <th className="px-6 py-3.5 font-medium text-primary">Order</th>
              <th className="px-6 py-3.5 font-medium text-primary">Customer</th>
              <th className="px-6 py-3.5 font-medium text-primary text-right">Amount</th>
              <th className="px-6 py-3.5 font-medium text-primary">Refund to</th>
              <th className="px-6 py-3.5 font-medium text-primary text-center">Status</th>
              <th className="px-6 py-3.5 font-medium text-primary">Requested</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.04]">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((__, c) => (
                    <td key={c} className="px-6 py-4"><Bone className="h-4 w-20" /></td>
                  ))}
                </tr>
              ))
            ) : error ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-red-600">{error}</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-14 text-center text-secondary"><Banknote className="w-10 h-10 text-black/10 mx-auto mb-3" />{filter === "ACTIVE" ? "No refunds waiting." : "No refunds yet."}</td></tr>
            ) : (
              items.map((r) => (
                <tr key={r.refund_id} onClick={() => setSelected(r)} className="cursor-pointer hover:bg-black/[0.015]">
                  <td className="px-6 py-3.5 font-medium text-primary">{r.orders?.order_number}</td>
                  <td className="px-6 py-3.5 text-secondary">{customerName(r.customers)}</td>
                  <td className="px-6 py-3.5 text-right font-medium tabular-nums">{formatCurrency(Number(r.amount))}</td>
                  <td className="px-6 py-3.5 text-secondary">{r.method === "SOURCE" ? `Original ${r.source_payment_method?.toUpperCase() ?? "payment"}` : "Bank transfer"}</td>
                  <td className="px-6 py-3.5 text-center"><Badge className={REFUND_STATUS_STYLE[r.status]}>{r.status}</Badge></td>
                  <td className="px-6 py-3.5 text-secondary">{timeAgo(r.created_date)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && <RefundDialog refund={selected} onClose={() => setSelected(null)} onDone={() => { setSelected(null); load(); onChanged(); }} />}
    </div>
  );
}

function RefundDialog({ refund, onClose, onDone }: { refund: Refund; onClose: () => void; onDone: () => void }) {
  const { formatCurrency } = useCurrency();
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const done = refund.status === "PROCESSED" || refund.status === "REJECTED";

  const act = async (action: "approve" | "reject" | "mark_processed") => {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/api/v1/dashboard/refunds/${refund.refund_id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reference: reference || undefined, note: note || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed");
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Refund">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-heading font-semibold">Refund · {refund.orders?.order_number}</h2>
            <p className="text-sm text-secondary mt-0.5">{customerName(refund.customers)}{refund.customers?.phone_number ? ` · ${refund.customers.phone_number}` : ""}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-heading text-primary tabular-nums">{formatCurrency(Number(refund.amount))}</span>
            <Badge className={REFUND_STATUS_STYLE[refund.status]}>{refund.status}</Badge>
          </div>

          {refund.reason && <p className="text-sm text-secondary"><span className="font-medium text-primary">Reason: </span>{refund.reason}</p>}

          {refund.method === "SOURCE" ? (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-sm text-blue-900">
              <p className="font-semibold">Return to the original {refund.source_payment_method?.toUpperCase() ?? "payment"}</p>
              <p className="mt-1 text-blue-800/80">This order was paid online. Refund it to the same UPI / bank account it was paid from (find the payer in your bank statement), then record the transaction reference below.</p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-sm">
              <p className="font-semibold text-primary mb-2">Bank transfer details (Cash on Delivery order)</p>
              <dl className="grid grid-cols-[110px_1fr] gap-y-1.5">
                <dt className="text-secondary">Account holder</dt><dd className="font-medium select-all">{refund.bank_account_name}</dd>
                <dt className="text-secondary">Account no.</dt><dd className="font-mono select-all">{refund.bank_account_number}</dd>
                <dt className="text-secondary">IFSC</dt><dd className="font-mono select-all">{refund.bank_ifsc}</dd>
                {refund.bank_name && (<><dt className="text-secondary">Bank</dt><dd className="select-all">{refund.bank_name}</dd></>)}
              </dl>
            </div>
          )}

          {done ? (
            <div className="text-sm text-secondary space-y-1">
              {refund.reference && <p>Reference: <span className="font-mono text-primary">{refund.reference}</span></p>}
              {refund.admin_note && <p>Note: {refund.admin_note}</p>}
              {refund.processed_date && <p>Closed {new Date(refund.processed_date).toLocaleString()}</p>}
            </div>
          ) : (
            <div className="space-y-3">
              <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Transaction reference / UTR (required to mark as sent)" className="w-full px-4 py-2.5 bg-black/[0.02] border border-black/[0.08] rounded-lg text-sm font-mono" />
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Note to the shopper (required when declining)" className="w-full px-4 py-2.5 bg-black/[0.02] border border-black/[0.08] rounded-lg text-sm resize-none" />
              {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
              <div className="flex flex-wrap justify-end gap-2 pt-1">
                <button onClick={() => act("reject")} disabled={!!busy} className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50">
                  {busy === "reject" ? "Declining…" : "Decline"}
                </button>
                {refund.status === "REQUESTED" && (
                  <button onClick={() => act("approve")} disabled={!!busy} className="px-4 py-2 border border-black/10 rounded-lg text-sm font-medium hover:bg-black/5 disabled:opacity-50">
                    {busy === "approve" ? "Approving…" : "Approve"}
                  </button>
                )}
                <button onClick={() => act("mark_processed")} disabled={!!busy || !reference.trim()} className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-black/90 disabled:opacity-50 flex items-center gap-2">
                  {busy === "mark_processed" && <Loader2 className="w-4 h-4 animate-spin" />} Mark as sent
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
