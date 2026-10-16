"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, ShoppingCart, Download, ExternalLink, Package, AlertTriangle, MapPin, User, Home, X, Ban } from "lucide-react";
import { useCurrency } from "@/components/dashboard/CurrencyProvider";
import { Pagination } from "@/components/dashboard/Pagination";

import { TableSkeletonRows } from "@/components/dashboard/Skeletons";
const PAGE_LIMIT = 50;

const ORDER_STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED", "RETURN_REQUESTED"];
const PAYMENT_STATUSES = ["UNPAID", "PARTIALLY_PAID", "PAID", "REFUNDED"];

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-red-100 text-red-700",
  RETURN_REQUESTED: "bg-amber-100 text-amber-800",
  UNPAID: "bg-amber-100 text-amber-700",
  PARTIALLY_PAID: "bg-amber-100 text-amber-700",
  PAID: "bg-green-100 text-green-700",
};

/** A status pill that is also a dropdown, so an order can be updated without opening it. */
function StatusSelect({ value, options, busy, onChange, label }: { value: string; options: string[]; busy: boolean; onChange: (v: string) => void; label: string }) {
  return (
    <select
      aria-label={label}
      value={value}
      disabled={busy}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value)}
      className={`appearance-none cursor-pointer rounded-full px-3 py-1 text-xs font-medium border-0 focus:outline-none focus:ring-2 focus:ring-black/10 disabled:opacity-50 disabled:cursor-wait text-center ${STATUS_STYLE[value] ?? "bg-gray-100 text-gray-700"}`}
    >
      {options.map((o) => (
        <option key={o} value={o} className="bg-white text-black">
          {o.replace(/_/g, " ")}
        </option>
      ))}
    </select>
  );
}

type Order = {
  order_id: string;
  order_number: string;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  grand_total: number;
  created_date: string;
  estimated_delivery_date: string | null;
  shipping_name: string | null;
  shipping_city: string | null;
  shipping_postal_code: string | null;
  is_delayed: boolean;
  delay_days: number;
  distance_km: number | null;
  customers: { first_name: string; last_name: string; email: string } | null;
  dealers: { company_name: string } | null;
  warehouses: { warehouse_name: string; city: string | null } | null;
  claimed_by: { full_name: string } | null;
  order_items: Array<{ product_name: string; quantity: number; image_url: string | null }>;
};

interface Counts {
  total: number;
  delayed: number;
  byStatus: Record<string, number>;
  byPayment: Record<string, number>;
}

interface RelatedInfo {
  match: "person" | "address" | "nearby";
  radiusKm: number;
  orderId: string;
  orderNumber: string;
  name: string | null;
}

const STATUS_CHIPS = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED", "RETURN_REQUESTED"];
const PAYMENT_CHIPS = ["UNPAID", "PARTIALLY_PAID", "PAID", "REFUNDED"];
const MATCHES: Array<{ id: RelatedInfo["match"]; label: string; icon: typeof User }> = [
  { id: "person", label: "Same person", icon: User },
  { id: "address", label: "Same address", icon: Home },
  { id: "nearby", label: "Nearby", icon: MapPin },
];

const label = (v: string) => v.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

function Chip({ active, onClick, children, tone = "default" }: { active: boolean; onClick: () => void; children: React.ReactNode; tone?: "default" | "danger" | "warn" }) {
  const on = tone === "danger" ? "bg-red-600 text-white border-red-600" : tone === "warn" ? "bg-amber-500 text-white border-amber-500" : "bg-black text-white border-black";
  const off = tone === "danger" ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" : tone === "warn" ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100" : "bg-white text-secondary border-black/10 hover:text-primary hover:bg-black/[0.03]";
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${active ? on : off}`}>
      {children}
    </button>
  );
}

function Count({ n }: { n: number | undefined }) {
  return n === undefined ? null : <span className="tabular-nums opacity-70">{n}</span>;
}

function OrdersView() {
  const router = useRouter();
  const params = useSearchParams();
  const { formatCurrency } = useCurrency();

  // Every filter lives in the URL: the view can be bookmarked, shared, and linked to from an order's page.
  const status = params.get("status") ?? "";
  const payment = params.get("payment") ?? "";
  const delayed = params.get("delayed") === "true";
  const query = params.get("q") ?? "";
  const related = params.get("related") ?? "";
  const match = (params.get("match") ?? "") as RelatedInfo["match"] | "";
  const radiusKm = params.get("radiusKm") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);

  const go = (patch: Record<string, string | null>, keepPage = false) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    if (!keepPage && !("page" in patch)) next.delete("page");
    const qs = next.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  };

  const apiQuery = new URLSearchParams({ page: String(page), limit: String(PAGE_LIMIT) });
  if (status) apiQuery.set("status", status);
  if (payment) apiQuery.set("paymentStatus", payment);
  if (delayed) apiQuery.set("delayed", "true");
  if (query) apiQuery.set("q", query);
  if (related && match) {
    apiQuery.set("related", related);
    apiQuery.set("match", match);
    if (radiusKm) apiQuery.set("radiusKm", radiusKm);
  }
  const key = apiQuery.toString();

  const [result, setResult] = useState<{ key: string; orders: Order[]; meta: { total: number; totalPages: number }; related: RelatedInfo | null; error: string | null } | null>(null);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState(query);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const orders = result?.orders ?? [];
  const isLoading = result?.key !== key;
  const meta = result?.meta ?? { total: 0, totalPages: 0 };
  const relatedInfo = result?.key === key ? result.related : null;

  useEffect(() => {
    let ignore = false;
    fetch(`/api/v1/orders?${key}`, { cache: "no-store" })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (ignore) return;
        if (!res.ok) setResult({ key, orders: [], meta: { total: 0, totalPages: 0 }, related: null, error: body.error || "Failed to load orders" });
        else setResult({ key, orders: body.data ?? [], meta: { total: body.meta?.total ?? 0, totalPages: body.meta?.totalPages ?? 0 }, related: body.related ?? null, error: null });
      })
      .catch(() => !ignore && setResult({ key, orders: [], meta: { total: 0, totalPages: 0 }, related: null, error: "Failed to load orders" }));
    return () => {
      ignore = true;
    };
  }, [key]);

  const loadCounts = useCallback(() => {
    fetch("/api/v1/orders/summary", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => c && setCounts(c))
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  const onSearch = (value: string) => {
    setSearchText(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => go({ q: value.trim() || null }), 350);
  };

  const updateOrder = async (o: Order, field: "status" | "paymentStatus", value: string) => {
    if (field === "status" && value === "CANCELLED" && !confirm(`Cancel ${o.order_number}? Stock goes back to the warehouse.`)) return;
    const k = field === "status" ? "status" : "payment_status";
    const previous = o[k];
    setBusyId(o.order_id);
    setUpdateError(null);
    setResult((r) => r && { ...r, orders: r.orders.map((x) => (x.order_id === o.order_id ? { ...x, [k]: value } : x)) });
    try {
      const res = await fetch(`/api/v1/orders/${o.order_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to update order");
      }
      loadCounts();
    } catch (e) {
      setResult((r) => r && { ...r, orders: r.orders.map((x) => (x.order_id === o.order_id ? { ...x, [k]: previous } : x)) });
      setUpdateError(e instanceof Error ? e.message : "Failed to update order");
    } finally {
      setBusyId(null);
    }
  };

  const anyFilter = !!(status || payment || delayed || query || related);
  const colSpan = 10;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-3xl text-primary mb-1">Orders</h1>
          <p className="text-secondary text-sm">View and manage all B2C and wholesale orders.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-black/10 text-primary rounded-lg hover:bg-black/5 transition-colors text-sm font-medium">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="bg-surface rounded-2xl border border-black/[0.04] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-black/[0.04] space-y-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search by order number, name or phone..."
              aria-label="Search orders"
              className="w-full pl-9 pr-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by order status">
            <Chip active={!status && !delayed} onClick={() => go({ status: null, delayed: null })}>All <Count n={counts?.total} /></Chip>
            {STATUS_CHIPS.map((st) => (
              <Chip key={st} active={status === st} tone={st === "CANCELLED" ? "danger" : "default"} onClick={() => go({ status: status === st ? null : st, delayed: null })}>
                {st === "CANCELLED" && <Ban className="w-3 h-3" />}
                {label(st)} <Count n={counts?.byStatus[st] ?? (counts ? 0 : undefined)} />
              </Chip>
            ))}
            <Chip active={delayed} tone="warn" onClick={() => go({ delayed: delayed ? null : "true", status: null })}>
              <AlertTriangle className="w-3 h-3" /> Delayed <Count n={counts?.delayed} />
            </Chip>
          </div>

          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by payment">
            <span className="text-[11px] uppercase tracking-widest text-secondary mr-1">Payment</span>
            <Chip active={!payment} onClick={() => go({ payment: null })}>Any</Chip>
            {PAYMENT_CHIPS.map((p) => (
              <Chip key={p} active={payment === p} onClick={() => go({ payment: payment === p ? null : p })}>
                {label(p)} <Count n={counts?.byPayment[p] ?? (counts ? 0 : undefined)} />
              </Chip>
            ))}
          </div>

          {related && match && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-sm text-blue-900">
              <span>
                Orders related to{" "}
                <Link href={`/dashboard/orders/${related}`} className="font-semibold underline">
                  {relatedInfo?.orderNumber ?? "this order"}
                </Link>
                {relatedInfo?.name ? ` (${relatedInfo.name})` : ""}:
              </span>
              {MATCHES.map(({ id, label: l, icon: Icon }) => (
                <button key={id} type="button" onClick={() => go({ match: id })} aria-pressed={match === id} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${match === id ? "bg-blue-900 text-white border-blue-900" : "bg-white border-blue-200 hover:bg-blue-100"}`}>
                  <Icon className="w-3 h-3" /> {l}
                </button>
              ))}
              {match === "nearby" && (
                <label className="inline-flex items-center gap-1.5 text-xs">
                  within
                  <select value={radiusKm || "3"} onChange={(e) => go({ radiusKm: e.target.value })} className="rounded-md border border-blue-200 bg-white px-1.5 py-1 text-xs">
                    {["1", "3", "5", "10", "25"].map((km) => (
                      <option key={km} value={km}>{km} km</option>
                    ))}
                  </select>
                </label>
              )}
              <button type="button" onClick={() => go({ related: null, match: null, radiusKm: null })} className="ml-auto inline-flex items-center gap-1 text-xs font-medium underline">
                <X className="w-3 h-3" /> Clear
              </button>
            </div>
          )}
        </div>

        {(updateError || result?.error) && <p role="alert" className="mx-4 my-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{updateError ?? result?.error}</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/[0.01] border-b border-black/[0.04]">
              <tr>
                <th className="px-6 py-4 font-medium text-primary">Order</th>
                <th className="px-6 py-4 font-medium text-primary">Items</th>
                <th className="px-6 py-4 font-medium text-primary">Date</th>
                <th className="px-6 py-4 font-medium text-primary">Customer/Dealer</th>
                <th className="px-6 py-4 font-medium text-primary">Handled by</th>
                <th className="px-6 py-4 font-medium text-primary text-center">Status</th>
                <th className="px-6 py-4 font-medium text-primary text-center">Payment</th>
                <th className="px-6 py-4 font-medium text-primary text-center">Fulfillment</th>
                <th className="px-6 py-4 font-medium text-primary text-right">Total</th>
                <th className="px-6 py-4 font-medium text-primary text-right"></th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-black/[0.04] ${isLoading && orders.length > 0 ? "opacity-60" : ""}`}>
              {isLoading && orders.length === 0 ? (
                <TableSkeletonRows rows={6} cols={10} first="text" />
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="px-6 py-12 text-center text-secondary">
                    <ShoppingCart className="w-12 h-12 text-black/10 mx-auto mb-3" />
                    <p>{anyFilter ? "No orders match these filters." : "No orders yet."}</p>
                    {anyFilter && (
                      <button type="button" onClick={() => { setSearchText(""); router.replace("?", { scroll: false }); }} className="mt-3 text-sm font-medium text-primary underline">
                        Clear all filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const cancelled = o.status === "CANCELLED";
                  const accent = cancelled ? "shadow-[inset_4px_0_0_#ef4444]" : o.is_delayed ? "shadow-[inset_4px_0_0_#f59e0b]" : "";
                  return (
                    <tr
                      key={o.order_id}
                      onClick={() => router.push(`/dashboard/orders/${o.order_id}`)}
                      className={`cursor-pointer ${accent} ${cancelled ? "bg-red-50/70 hover:bg-red-50" : o.is_delayed ? "bg-amber-50/50 hover:bg-amber-50" : "hover:bg-black/[0.01]"}`}
                    >
                      <td className="px-6 py-4 font-medium text-primary">
                        <span className={cancelled ? "text-red-700" : ""}>{o.order_number}</span>
                        {cancelled && <span className="mt-1 flex w-fit items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"><Ban className="w-3 h-3" /> Cancelled</span>}
                        {o.is_delayed && (
                          <span className="mt-1 flex w-fit items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white" title={o.estimated_delivery_date ? `Promised by ${new Date(o.estimated_delivery_date).toLocaleDateString()}` : undefined}>
                            <AlertTriangle className="w-3 h-3" /> Delayed {o.delay_days}d
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <ul className="space-y-1.5 min-w-[200px]">
                          {o.order_items.slice(0, 2).map((it, i) => (
                            <li key={i} className="flex items-center gap-2.5">
                              <div className="w-10 h-10 shrink-0 rounded-lg border border-black/[0.06] bg-black/[0.05] overflow-hidden flex items-center justify-center">
                                {it.image_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={it.image_url} alt="" loading="lazy" className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="w-4 h-4 text-black/25" aria-hidden />
                                )}
                              </div>
                              <span className="min-w-0">
                                <span className="block max-w-[200px] truncate text-primary">{it.product_name}</span>
                                <span className="text-xs text-secondary">Qty {it.quantity}</span>
                              </span>
                            </li>
                          ))}
                          {o.order_items.length > 2 && <li className="pl-12 text-xs text-secondary">+{o.order_items.length - 2} more item{o.order_items.length - 2 === 1 ? "" : "s"}</li>}
                        </ul>
                      </td>
                      <td className="px-6 py-4 text-secondary">
                        {new Date(o.created_date).toLocaleDateString()}
                        {o.estimated_delivery_date && !cancelled && ["PENDING", "PROCESSING", "SHIPPED"].includes(o.status) && (
                          <span className={`block text-xs ${o.is_delayed ? "font-medium text-amber-700" : ""}`}>Due {new Date(o.estimated_delivery_date).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-secondary">
                        <span className="text-primary">{o.customers ? `${o.customers.first_name} ${o.customers.last_name}` : o.dealers ? o.dealers.company_name : "Guest"}</span>
                        {o.shipping_name && o.shipping_name !== (o.customers ? `${o.customers.first_name} ${o.customers.last_name}` : "") && <span className="block text-xs">Deliver to {o.shipping_name}</span>}
                        {(o.shipping_city || o.shipping_postal_code) && <span className="block text-xs">{[o.shipping_city, o.shipping_postal_code].filter(Boolean).join(" · ")}</span>}
                        {o.distance_km !== null && o.distance_km !== undefined && match === "nearby" && <span className="block text-xs text-blue-700">{o.distance_km} km away</span>}
                      </td>
                      <td className="px-6 py-4 text-secondary">
                        {o.warehouses ? (
                          <>
                            <span className="text-primary">{o.warehouses.warehouse_name}</span>
                            {o.claimed_by && <span className="block text-xs">{o.claimed_by.full_name}</span>}
                          </>
                        ) : ["PENDING", "PROCESSING"].includes(o.status) ? (
                          <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-amber-100 text-amber-800" title="No warehouse is handling this order yet. Open the order to assign one, or any warehouse's team can take it.">Unassigned</span>
                        ) : (
                          <span>—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusSelect label={`Status of ${o.order_number}`} value={o.status} options={ORDER_STATUSES} busy={busyId === o.order_id} onChange={(v) => updateOrder(o, "status", v)} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusSelect label={`Payment of ${o.order_number}`} value={o.payment_status} options={PAYMENT_STATUSES} busy={busyId === o.order_id} onChange={(v) => updateOrder(o, "paymentStatus", v)} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                          o.fulfillment_status === 'FULFILLED' ? 'bg-green-100 text-green-700' :
                          o.fulfillment_status === 'SHIPPED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {o.fulfillment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        {formatCurrency(o.grand_total)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/dashboard/orders/${o.order_id}`}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Open ${o.order_number}`}
                          className="inline-flex p-1.5 text-secondary hover:bg-black/5 hover:text-primary rounded-md transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={PAGE_LIMIT} onPageChange={(n: number) => go({ page: n > 1 ? String(n) : null }, true)} />
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto"><TableSkeletonRows rows={6} cols={10} first="text" /></div>}>
      <OrdersView />
    </Suspense>
  );
}
