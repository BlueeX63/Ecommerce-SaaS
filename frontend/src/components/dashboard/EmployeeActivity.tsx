"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Box, ClipboardList, Hand, Loader2, Package, Pencil, RotateCcw, Search, Truck, UserCheck, Warehouse as WarehouseIcon } from "lucide-react";
import { Bone } from "@/components/dashboard/Skeletons";

interface Summary {
  employee_id: string | null;
  employee_name: string | null;
  warehouse_name: string | null;
  total_actions: number;
  stock_changes: number;
  units_added: number;
  units_removed: number;
  orders_taken: number;
  orders_updated: number;
  last_active: string | null;
}

interface Activity {
  activity_id: string;
  actor_type: "EMPLOYEE" | "ADMIN";
  employee_id: string | null;
  actor_name: string | null;
  warehouse_name: string | null;
  action: string;
  product_id: string | null;
  product_name: string | null;
  order_id: string | null;
  order_number: string | null;
  quantity_before: number | null;
  quantity_after: number | null;
  quantity_change: number | null;
  note: string | null;
  details: { from?: string; to?: string; from_warehouse?: string | null; to_warehouse?: string | null; changes?: Record<string, { from: unknown; to: unknown }> } | null;
  created_date: string;
}

interface LedgerRow {
  transactionId: string;
  type: string;
  change: number;
  quantityAfter: number | null;
  notes: string | null;
  actorName: string | null;
  warehouseName: string | null;
  createdAt: string;
}

type Option = { value: string; label: string };

const KINDS: Array<{ id: string; label: string; actions: string }> = [
  { id: "all", label: "Everything", actions: "" },
  { id: "stock", label: "Stock changes", actions: "STOCK_SET,STOCK_ADJUST" },
  { id: "orders", label: "Order handling", actions: "ORDER_STATUS,ORDER_PAYMENT,ORDER_CLAIMED,ORDER_UNCLAIMED,ORDER_TAKEN,ORDER_RELEASED" },
  { id: "assign", label: "Assignments", actions: "ORDER_ASSIGNED,ORDER_UNASSIGNED,ORDER_TAKEN,ORDER_RELEASED" },
  { id: "warehouse", label: "Warehouse settings", actions: "WAREHOUSE_UPDATED" },
];

const field = "px-3 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 min-w-0";

function ago(iso: string | null) {
  if (!iso) return "never";
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const units: Array<[number, string]> = [[60, "min"], [3600, "h"], [86400, "d"]];
  for (let i = units.length - 1; i >= 0; i--) if (s >= units[i][0]) return `${Math.floor(s / units[i][0])} ${units[i][1]} ago`;
  return "just now";
}

const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

function describe(a: Activity): { icon: React.ReactNode; text: React.ReactNode } {
  const who = <strong className="font-medium text-primary">{a.actor_name ?? "Someone"}</strong>;
  const order = a.order_id ? (
    <Link href={`/dashboard/orders/${a.order_id}`} className="font-medium text-accent hover:underline">{a.order_number ?? "order"}</Link>
  ) : (
    <span>an order</span>
  );
  const where = a.warehouse_name ? <> at {a.warehouse_name}</> : null;
  const d = a.details;
  switch (a.action) {
    case "STOCK_SET":
    case "STOCK_ADJUST":
      return {
        icon: <Box className="w-4 h-4" />,
        text: (
          <>
            {who} {a.action === "STOCK_SET" ? "set" : "adjusted"} <strong className="font-medium text-primary">{a.product_name}</strong> stock{where}: {a.quantity_before} → <strong className="font-medium text-primary">{a.quantity_after}</strong>{" "}
            <span className={(a.quantity_change ?? 0) >= 0 ? "text-green-700" : "text-red-600"}>({signed(a.quantity_change ?? 0)})</span>
          </>
        ),
      };
    case "ORDER_STATUS":
      return { icon: <Truck className="w-4 h-4" />, text: <>{who} moved {order} from {d?.from} to <strong className="font-medium text-primary">{d?.to}</strong></> };
    case "ORDER_PAYMENT":
      return { icon: <Pencil className="w-4 h-4" />, text: <>{who} set payment of {order} from {d?.from} to <strong className="font-medium text-primary">{d?.to}</strong></> };
    case "ORDER_CLAIMED":
      return { icon: <Hand className="w-4 h-4" />, text: <>{who} started handling {order}{where}</> };
    case "ORDER_UNCLAIMED":
      return { icon: <Hand className="w-4 h-4" />, text: <>{who} stopped handling {order}</> };
    case "ORDER_TAKEN":
      return { icon: <UserCheck className="w-4 h-4" />, text: <>{who} took {order} from the open pool{where}</> };
    case "ORDER_RELEASED":
      return { icon: <RotateCcw className="w-4 h-4" />, text: <>{who} handed {order} back to the pool{where}</> };
    case "ORDER_ASSIGNED":
      return { icon: <WarehouseIcon className="w-4 h-4" />, text: <>{who} assigned {order} to <strong className="font-medium text-primary">{d?.to_warehouse}</strong>{d?.from_warehouse ? <> (was {d.from_warehouse})</> : null}</> };
    case "ORDER_UNASSIGNED":
      return { icon: <RotateCcw className="w-4 h-4" />, text: <>{who} released {order} to the open pool</> };
    case "WAREHOUSE_UPDATED":
      return { icon: <ClipboardList className="w-4 h-4" />, text: <>{who} changed warehouse settings{where}: {Object.keys(d?.changes ?? {}).map((k) => k.replace(/_/g, " ")).join(", ")}</> };
    default:
      return { icon: <ClipboardList className="w-4 h-4" />, text: <>{who} · {a.action.toLowerCase().replace(/_/g, " ")}</> };
  }
}

/** Monitors what warehouse employees changed: per-person summary, a filterable feed and a per-product stock ledger. */
export function EmployeeActivity({ warehouses }: { warehouses: Option[] }) {
  const [days, setDays] = useState(7);
  const [employee, setEmployee] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [kind, setKind] = useState("all");
  const [product, setProduct] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [people, setPeople] = useState<Option[]>([]);
  const [products, setProducts] = useState<Option[]>([]);
  const [more, setMore] = useState(false);

  // Each piece of loaded data remembers what it was loaded for, so a change of filter shows "loading" without any
  // state being reset inside an effect, and a slow older response can never overwrite a newer one.
  const [summaryState, setSummaryState] = useState<{ days: number; data: Summary[] } | null>(null);
  const [feed, setFeed] = useState<{ key: string; rows: Activity[]; cursor: string | null; error: string | null } | null>(null);
  const [stockState, setStockState] = useState<{ product: string; data: Array<{ warehouse: string; quantity: number }> } | null>(null);
  const [ledgerState, setLedgerState] = useState<{ product: string; rows: LedgerRow[]; cursor: string | null } | null>(null);

  const query = useCallback(
    (cursorValue: string | null) => {
      const p = new URLSearchParams({ limit: "25" });
      if (employee) p.set("employeeId", employee);
      if (warehouse) p.set("warehouseId", warehouse);
      if (product) p.set("productId", product);
      const actions = KINDS.find((k) => k.id === kind)?.actions;
      if (actions) p.set("actions", actions);
      if (from) p.set("from", from);
      if (to) p.set("to", to);
      if (cursorValue) p.set("cursor", cursorValue);
      return p.toString();
    },
    [employee, warehouse, product, kind, from, to],
  );
  const key = query(null);

  const summary = summaryState?.days === days ? summaryState.data : null;
  const loading = feed?.key !== key;
  const rows = feed?.rows ?? [];
  const cursor = feed?.cursor ?? null;
  const error = feed?.key === key ? feed.error : null;
  const stock = stockState?.product === product ? stockState.data : null;
  const ledger = ledgerState?.product === product ? ledgerState.rows : null;
  const ledgerCursor = ledgerState?.product === product ? ledgerState.cursor : null;

  // Filter choices: employees who acted in the last year, and the store's products.
  useEffect(() => {
    fetch("/api/v1/warehouses/activity/summary?days=365", { cache: "no-store" })
      .then((r) => r.json())
      .then((b) => setPeople((b.data ?? []).filter((s: Summary) => s.employee_id).map((s: Summary) => ({ value: s.employee_id as string, label: s.employee_name ?? "Employee" }))))
      .catch(() => undefined);
    fetch("/api/v1/products?limit=100")
      .then((r) => r.json())
      .then((b) => setProducts((b.data ?? []).map((p: { product_id: string; product_name: string; sku: string | null }) => ({ value: p.product_id, label: p.sku ? `${p.product_name} (${p.sku})` : p.product_name }))))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let ignore = false;
    fetch(`/api/v1/warehouses/activity/summary?days=${days}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((b) => !ignore && setSummaryState({ days, data: b.data ?? [] }))
      .catch(() => !ignore && setSummaryState({ days, data: [] }));
    return () => {
      ignore = true;
    };
  }, [days]);

  useEffect(() => {
    let ignore = false;
    fetch(`/api/v1/warehouses/activity?${key}`, { cache: "no-store" })
      .then(async (r) => {
        const b = await r.json().catch(() => ({}));
        if (ignore) return;
        if (!r.ok) setFeed({ key, rows: [], cursor: null, error: b.error || "Could not load activity" });
        else setFeed({ key, rows: b.data ?? [], cursor: b.nextCursor ?? null, error: null });
      })
      .catch(() => !ignore && setFeed({ key, rows: [], cursor: null, error: "Could not load activity" }));
    return () => {
      ignore = true;
    };
  }, [key]);

  // Picking a product also shows how many units each warehouse holds right now.
  useEffect(() => {
    if (!product) return;
    let ignore = false;
    fetch(`/api/v1/inventory?productId=${product}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((b) => {
        const byWarehouse = new Map<string, number>();
        for (const row of b.data ?? []) {
          const name = row.warehouses?.warehouse_name ?? "Warehouse";
          byWarehouse.set(name, (byWarehouse.get(name) ?? 0) + (row.quantity_available ?? 0));
        }
        if (!ignore) setStockState({ product, data: [...byWarehouse].map(([w, quantity]) => ({ warehouse: w, quantity })) });
      })
      .catch(() => !ignore && setStockState({ product, data: [] }));
    return () => {
      ignore = true;
    };
  }, [product]);

  const loadMore = async () => {
    if (!cursor) return;
    setMore(true);
    try {
      const r = await fetch(`/api/v1/warehouses/activity?${query(cursor)}`, { cache: "no-store" });
      const b = await r.json();
      if (r.ok) setFeed((prev) => (prev && prev.key === key ? { ...prev, rows: [...prev.rows, ...(b.data ?? [])], cursor: b.nextCursor ?? null } : prev));
    } finally {
      setMore(false);
    }
  };

  const loadLedger = async (next?: string | null) => {
    const p = new URLSearchParams({ productId: product, limit: "20" });
    if (warehouse) p.set("warehouseId", warehouse);
    if (employee) p.set("employeeId", employee);
    if (next) p.set("cursor", next);
    const r = await fetch(`/api/v1/inventory/history?${p}`, { cache: "no-store" });
    const b = await r.json().catch(() => ({}));
    if (r.ok) setLedgerState((prev) => ({ product, rows: next && prev?.product === product ? [...prev.rows, ...b.data] : b.data, cursor: b.nextCursor ?? null }));
  };

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading text-lg text-primary">Team at a glance</h3>
          <select aria-label="Period" value={days} onChange={(e) => setDays(Number(e.target.value))} className={field}>
            <option value={1}>Last 24 hours</option>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
        {summary === null ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" role="status" aria-busy="true">
            {[0, 1, 2].map((i) => <Bone key={i} className="h-32 rounded-2xl" />)}
          </div>
        ) : summary.length === 0 ? (
          <p className="bg-surface rounded-2xl border border-black/[0.04] p-8 text-center text-sm text-secondary">No employee activity in this period. Changes made on the employee panel appear here.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {summary.map((s, i) => (
              <button
                key={s.employee_id ?? `gone-${i}`}
                type="button"
                disabled={!s.employee_id}
                onClick={() => s.employee_id && setEmployee(employee === s.employee_id ? "" : s.employee_id)}
                className={`text-left bg-surface rounded-2xl border p-5 shadow-sm transition-colors ${employee && employee === s.employee_id ? "border-black" : "border-black/[0.04] hover:border-black/20"}`}
              >
                <p className="font-medium text-primary truncate">{s.employee_name ?? "Removed employee"}</p>
                <p className="text-xs text-secondary mb-3 truncate">{s.warehouse_name ?? "—"} · active {ago(s.last_active)}</p>
                <dl className="grid grid-cols-3 gap-2 text-center">
                  <div><dd className="font-heading text-xl tabular-nums">{s.total_actions}</dd><dt className="text-[10px] uppercase tracking-wider text-secondary">Actions</dt></div>
                  <div><dd className="font-heading text-xl tabular-nums flex items-center justify-center gap-1"><span className="text-green-700 text-sm flex items-center"><ArrowUp className="w-3 h-3" />{s.units_added}</span><span className="text-red-600 text-sm flex items-center"><ArrowDown className="w-3 h-3" />{s.units_removed}</span></dd><dt className="text-[10px] uppercase tracking-wider text-secondary">Units in / out</dt></div>
                  <div><dd className="font-heading text-xl tabular-nums">{s.orders_taken}<span className="text-secondary text-sm"> / {s.orders_updated}</span></dd><dt className="text-[10px] uppercase tracking-wider text-secondary">Taken / updated</dt></div>
                </dl>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="bg-surface rounded-2xl border border-black/[0.04] shadow-sm">
        <div className="p-4 border-b border-black/[0.04] flex flex-wrap items-center gap-2">
          <select aria-label="Employee" value={employee} onChange={(e) => setEmployee(e.target.value)} className={field}>
            <option value="">All employees</option>
            {people.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <select aria-label="Warehouse" value={warehouse} onChange={(e) => setWarehouse(e.target.value)} className={field}>
            <option value="">All warehouses</option>
            {warehouses.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
          </select>
          <select aria-label="Product" value={product} onChange={(e) => setProduct(e.target.value)} className={`${field} max-w-[14rem]`}>
            <option value="">All products</option>
            {products.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <select aria-label="Kind of change" value={kind} onChange={(e) => setKind(e.target.value)} className={field}>
            {KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
          </select>
          <input aria-label="From date" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={field} />
          <input aria-label="To date" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={field} />
          {(employee || warehouse || product || kind !== "all" || from || to) && (
            <button type="button" onClick={() => { setEmployee(""); setWarehouse(""); setProduct(""); setKind("all"); setFrom(""); setTo(""); }} className="text-xs font-medium text-secondary hover:text-primary underline">Clear filters</button>
          )}
        </div>

        {product && (
          <div className="p-4 border-b border-black/[0.04] bg-black/[0.015]">
            <p className="text-xs uppercase tracking-widest text-secondary mb-2 flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /> Stock right now</p>
            {stock === null ? <Bone className="h-6 w-48" /> : stock.length === 0 ? (
              <p className="text-sm text-secondary">Not tracked: this product is sold without a stock count.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {stock.map((s) => <span key={s.warehouse} className="px-3 py-1.5 rounded-full bg-white border border-black/[0.08] text-sm"><span className="text-secondary">{s.warehouse}</span> <strong className="tabular-nums">{s.quantity}</strong></span>)}
                <span className="px-3 py-1.5 rounded-full bg-black text-white text-sm">Total <strong className="tabular-nums">{stock.reduce((n, s) => n + s.quantity, 0)}</strong></span>
              </div>
            )}
            <button type="button" onClick={() => (ledger ? setLedgerState(null) : loadLedger())} className="mt-3 text-xs font-medium text-accent hover:underline">
              {ledger ? "Hide stock ledger" : "Show every stock movement for this product"}
            </button>
            {ledger && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-secondary"><tr><th className="py-1.5 pr-3 font-medium">When</th><th className="pr-3 font-medium">Warehouse</th><th className="pr-3 font-medium">Change</th><th className="pr-3 font-medium">Left</th><th className="pr-3 font-medium">By</th><th className="font-medium">Why</th></tr></thead>
                  <tbody className="divide-y divide-black/[0.05]">
                    {ledger.map((l) => (
                      <tr key={l.transactionId}>
                        <td className="py-1.5 pr-3 whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</td>
                        <td className="pr-3">{l.warehouseName}</td>
                        <td className={`pr-3 tabular-nums font-medium ${l.change >= 0 ? "text-green-700" : "text-red-600"}`}>{signed(l.change)}</td>
                        <td className="pr-3 tabular-nums">{l.quantityAfter ?? "—"}</td>
                        <td className="pr-3">{l.actorName ?? "System / owner"}</td>
                        <td className="text-secondary max-w-[16rem] truncate" title={l.notes ?? ""}>{l.notes ?? l.type.toLowerCase().replace(/_/g, " ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {ledgerCursor && <button type="button" onClick={() => loadLedger(ledgerCursor)} className="mt-2 text-xs font-medium text-accent hover:underline">Load older movements</button>}
              </div>
            )}
          </div>
        )}

        {error && <p role="alert" className="m-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">{error}</p>}

        {loading && rows.length === 0 ? (
          <div className="p-4 space-y-3" role="status" aria-busy="true">{[0, 1, 2, 3, 4].map((i) => <Bone key={i} className="h-12 w-full" />)}</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-sm text-secondary"><Search className="w-8 h-8 text-black/10 mx-auto mb-2" />Nothing matches these filters.</div>
        ) : (
          <ul className={`divide-y divide-black/[0.05] ${loading ? "opacity-60" : ""}`}>
            {rows.map((a) => {
              const { icon, text } = describe(a);
              return (
                <li key={a.activity_id} className="px-5 py-3.5 flex items-start gap-3">
                  <span className="mt-0.5 w-8 h-8 shrink-0 rounded-lg bg-black/[0.04] flex items-center justify-center text-primary">{icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-secondary leading-relaxed">{text}</p>
                    {a.note && <p className="text-xs text-secondary mt-0.5">“{a.note}”</p>}
                  </div>
                  <time dateTime={a.created_date} title={new Date(a.created_date).toLocaleString()} className="text-xs text-secondary whitespace-nowrap shrink-0">{ago(a.created_date)}</time>
                </li>
              );
            })}
          </ul>
        )}

        {cursor && (
          <div className="p-4 border-t border-black/[0.04] text-center">
            <button type="button" onClick={loadMore} disabled={more} className="px-5 py-2 bg-white border border-black/10 rounded-lg text-sm font-medium hover:bg-black/5 disabled:opacity-50 inline-flex items-center gap-2">
              {more && <Loader2 className="w-4 h-4 animate-spin" />} Load older activity
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
