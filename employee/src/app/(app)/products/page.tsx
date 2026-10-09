"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Infinity as InfinityIcon, Loader2, Minus, Package, Plus, Search } from "lucide-react";
import { PageHeader, TableSkeleton, inputClass } from "@/components/ui";

interface Row {
  productId: string;
  name: string;
  sku: string | null;
  status: string;
  image: string | null;
  unlimited: boolean;
  trackedHere: boolean;
  quantity: number;
}

const PAGE = 20;

function StockEditor({ row, onSaved, onError }: { row: Row; onSaved: (quantity: number) => void; onError: (message: string) => void }) {
  const [value, setValue] = useState(String(row.quantity));
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const dirty = value.trim() !== String(row.quantity);

  const send = async (mode: "set" | "adjust", quantity: number) => {
    setBusy(true);
    try {
      const res = await fetch("/api/v1/employee/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: row.productId, mode, quantity }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(Array.isArray(data.details) ? data.details.join(" · ") : data.error || "Could not update stock");
      const next = mode === "set" ? quantity : row.quantity + quantity;
      setValue(String(next));
      onSaved(next);
      setSaved(true);
      setTimeout(() => setSaved(false), 1400);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not update stock");
      setValue(String(row.quantity));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-1.5">
      <button type="button" disabled={busy || row.quantity <= 0} onClick={() => send("adjust", -1)} aria-label={`Remove one ${row.name}`} className="p-2 rounded-lg border border-black/10 text-secondary hover:bg-black/5 disabled:opacity-40"><Minus className="w-3.5 h-3.5" /></button>
      <input
        inputMode="numeric"
        aria-label={`Stock of ${row.name}`}
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
        onKeyDown={(e) => e.key === "Enter" && dirty && value !== "" && send("set", Number(value))}
        className="w-20 px-2 py-1.5 text-center bg-black/[0.02] border border-black/[0.08] rounded-lg text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-black/5"
      />
      <button type="button" disabled={busy} onClick={() => send("adjust", 1)} aria-label={`Add one ${row.name}`} className="p-2 rounded-lg border border-black/10 text-secondary hover:bg-black/5 disabled:opacity-40"><Plus className="w-3.5 h-3.5" /></button>
      <button
        type="button"
        disabled={busy || !dirty || value === ""}
        onClick={() => send("set", Number(value))}
        className="ml-1 min-w-[64px] px-3 py-2 bg-black text-white rounded-lg text-xs font-medium disabled:opacity-30 flex items-center justify-center"
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : "Save"}
      </button>
    </div>
  );
}

export default function ProductsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    const id = ++seq.current;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE) });
      if (query) params.set("q", query);
      const res = await fetch(`/api/v1/employee/products?${params}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (id !== seq.current) return;
      if (!res.ok) throw new Error(data.error || "Failed to load products");
      setRows(data.data ?? []);
      setTotal(data.meta?.total ?? 0);
      setError(null);
    } catch (e) {
      if (id === seq.current) setError(e instanceof Error ? e.message : "Failed to load products");
    } finally {
      if (id === seq.current) setLoading(false);
    }
  }, [page, query]);

  useEffect(() => {
    load();
  }, [load]);

  const pages = Math.max(1, Math.ceil(total / PAGE));

  return (
    <div className="space-y-6">
      <PageHeader title="Products & Stock" subtitle="Set how many units this warehouse holds. Orders draw from here when it's the nearest warehouse with stock." />

      {error && <p role="alert" className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">{error}</p>}

      <div className="bg-surface rounded-2xl border border-black/[0.04] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-black/[0.04]">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
            <input type="search" aria-label="Search products" placeholder="Search by name or SKU…" value={search} onChange={(e) => setSearch(e.target.value)} className={`${inputClass} pl-9`} />
          </div>
        </div>

        {loading && rows.length === 0 ? (
          <TableSkeleton rows={6} cols={3} />
        ) : rows.length === 0 ? (
          <div className="p-14 text-center text-secondary">
            <Package className="w-12 h-12 text-black/10 mx-auto mb-3" />
            {query ? "No products match your search." : "No products yet."}
          </div>
        ) : (
          <div className={`overflow-x-auto ${loading ? "opacity-60" : ""}`}>
            <table className="w-full text-left text-sm">
              <thead className="bg-black/[0.01] border-b border-black/[0.04]">
                <tr>
                  <th className="px-6 py-4 font-medium text-primary">Product</th>
                  <th className="px-6 py-4 font-medium text-primary">SKU</th>
                  <th className="px-6 py-4 font-medium text-primary text-right">Stock at this warehouse</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {rows.map((r) => (
                  <tr key={r.productId}>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <div className="w-11 h-11 rounded-lg bg-black/[0.04] overflow-hidden flex items-center justify-center shrink-0 border border-black/[0.04]">
                          {r.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={r.image} alt="" loading="lazy" className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-black/20" aria-hidden />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-primary truncate max-w-[260px]">{r.name}</p>
                          {r.status !== "ACTIVE" && <p className="text-xs text-amber-700">{r.status.toLowerCase()}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-secondary font-mono text-xs">{r.sku || "-"}</td>
                    <td className="px-6 py-3">
                      {r.unlimited && !r.trackedHere ? (
                        <div className="flex items-center justify-end gap-3">
                          <span className="flex items-center gap-1.5 text-xs text-secondary"><InfinityIcon className="w-4 h-4" /> Unlimited (not tracked)</span>
                          <StartTracking row={r} onDone={load} onError={setError} />
                        </div>
                      ) : (
                        <StockEditor row={r} onError={setError} onSaved={(q) => setRows((list) => list.map((x) => (x.productId === r.productId ? { ...x, quantity: q, trackedHere: true } : x)))} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > PAGE && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-black/[0.04] text-sm text-secondary">
            <span>Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 border border-black/10 rounded-lg hover:bg-black/5 disabled:opacity-40">Previous</button>
              <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 border border-black/10 rounded-lg hover:bg-black/5 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** An unlimited product only becomes limited when someone chooses to - here, by entering a first quantity. */
function StartTracking({ row, onDone, onError }: { row: Row; onDone: () => void; onError: (m: string) => void }) {
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="px-3 py-2 border border-black/10 rounded-lg text-xs font-medium hover:bg-black/5">
        Track stock here
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <input autoFocus inputMode="numeric" aria-label="Opening quantity" placeholder="Qty" value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, ""))} className="w-20 px-2 py-1.5 text-center bg-black/[0.02] border border-black/[0.08] rounded-lg text-sm" />
      <button
        type="button"
        disabled={busy || qty === ""}
        onClick={async () => {
          setBusy(true);
          try {
            const res = await fetch("/api/v1/employee/stock", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: row.productId, mode: "set", quantity: Number(qty) }) });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || "Could not update stock");
            onDone();
          } catch (e) {
            onError(e instanceof Error ? e.message : "Could not update stock");
          } finally {
            setBusy(false);
          }
        }}
        className="px-3 py-2 bg-black text-white rounded-lg text-xs font-medium disabled:opacity-40"
      >
        {busy ? "…" : "Start"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-xs text-secondary px-1">Cancel</button>
    </div>
  );
}
