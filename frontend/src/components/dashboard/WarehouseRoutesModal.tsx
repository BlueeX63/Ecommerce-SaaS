"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Route, Trash2, X } from "lucide-react";

interface RouteRow {
  destination: string;
  minDays: string;
  maxDays: string;
}

/**
 * Known transit times from a warehouse to a state or PIN-code prefix. They take priority over the distance
 * estimate and are blended with how long real deliveries to that area have taken.
 */
export function WarehouseRoutesModal({ warehouseId, warehouseName, onClose }: { warehouseId: string; warehouseName: string; onClose: () => void }) {
  const [rows, setRows] = useState<RouteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/v1/warehouses/${warehouseId}/routes`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setRows((d?.data ?? []).map((r: any) => ({ destination: r.destination, minDays: String(r.transit_min_days), maxDays: String(r.transit_max_days) }))))
      .catch(() => setError("Could not load routes"))
      .finally(() => setLoading(false));
  }, [warehouseId]);

  const update = (i: number, patch: Partial<RouteRow>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/warehouses/${warehouseId}/routes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routes: rows.filter((r) => r.destination.trim()).map((r) => ({ destination: r.destination, minDays: Number(r.minDays), maxDays: Number(r.maxDays) })) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(Array.isArray(data.details) && data.details.length ? data.details.join(" · ") : data.error || "Could not save routes");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save routes");
    } finally {
      setSaving(false);
    }
  };

  const input = "w-full px-3 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`Shipping routes for ${warehouseName}`}>
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl max-h-[92vh] flex flex-col">
        <div className="flex justify-between items-start p-6 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-xl font-heading font-semibold flex items-center gap-2"><Route className="w-5 h-5" /> Shipping routes · {warehouseName}</h2>
            <p className="text-sm text-secondary mt-0.5">Tell us how long your courier takes to a state or PIN-code area, so estimates match reality. Delivered orders keep refining it automatically.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>

        <div className="overflow-y-auto p-6 space-y-3">
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-primary/40 mx-auto" />
          ) : (
            <>
              {rows.length === 0 && <p className="text-sm text-secondary text-center py-3">No routes yet — estimates use distance and your delivery history.</p>}
              {rows.length > 0 && (
                <div className="grid grid-cols-[1fr_88px_88px_36px] gap-2 text-[11px] font-semibold uppercase tracking-wider text-secondary px-1">
                  <span>State or PIN prefix</span><span>Fastest (days)</span><span>Slowest (days)</span><span />
                </div>
              )}
              {rows.map((r, i) => (
                <div key={i} className="grid grid-cols-[1fr_88px_88px_36px] gap-2 items-center">
                  <input aria-label="State or PIN prefix" placeholder="e.g. Maharashtra or 400" value={r.destination} onChange={(e) => update(i, { destination: e.target.value })} className={input} />
                  <input aria-label="Fastest days" type="number" min={0} max={60} value={r.minDays} onChange={(e) => update(i, { minDays: e.target.value })} className={input} />
                  <input aria-label="Slowest days" type="number" min={0} max={90} value={r.maxDays} onChange={(e) => update(i, { maxDays: e.target.value })} className={input} />
                  <button type="button" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} className="p-2 rounded-md text-secondary hover:bg-red-50 hover:text-red-600" aria-label="Remove route"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              <button type="button" onClick={() => setRows((rs) => [...rs, { destination: "", minDays: "1", maxDays: "3" }])} className="flex items-center gap-1.5 text-sm font-medium text-accent hover:underline">
                <Plus className="w-4 h-4" /> Add route
              </button>
              <p className="text-xs text-secondary">Transit days are courier time only — the warehouse&apos;s packing time is added on top.</p>
            </>
          )}
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-secondary hover:text-primary">Cancel</button>
          <button onClick={save} disabled={saving || loading} className="px-6 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-black/90 disabled:opacity-50 flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save routes
          </button>
        </div>
      </div>
    </div>
  );
}
