"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, Loader2, MapPin, Undo2, UserX, Warehouse, X } from "lucide-react";
import { Bone } from "@/components/dashboard/Skeletons";

interface Shortage {
  name: string;
  needed: number;
  available: number;
}

interface Candidate {
  warehouseId: string;
  name: string;
  city: string | null;
  state: string | null;
  isCurrent: boolean;
  canFulfil: boolean;
  shortages: Shortage[];
  distanceKm: number | null;
  openOrders: number;
  dailyCapacity: number | null;
}

interface Assignment {
  order: {
    orderId: string;
    orderNumber: string;
    status: string;
    movable: boolean;
    warehouseId: string | null;
    claimedBy: { employeeId: string; name: string | null; since: string | null } | null;
  };
  lines: Array<{ name: string; quantity: number }>;
  warehouses: Candidate[];
}

/** Choose which warehouse fulfils an order. Only warehouses that hold every item can be picked. */
export function AssignWarehouseModal({ orderId, onClose, onChanged }: { orderId: string; onClose: () => void; onChanged: () => void }) {
  const [info, setInfo] = useState<Assignment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // `reload` bumps after a failed move: the order may have changed under us, so fetch what is true now.
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let ignore = false;
    fetch(`/api/v1/orders/${orderId}/assignment`, { cache: "no-store" })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (ignore) return;
        if (!res.ok) setError(body.error || "Could not load warehouses");
        else setInfo(body.data);
      })
      .catch(() => !ignore && setError("Could not load warehouses"));
    return () => {
      ignore = true;
    };
  }, [orderId, reload]);

  const send = async (key: string, url: string, body?: unknown) => {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      onChanged();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setReload((n) => n + 1);
    } finally {
      setBusy(null);
    }
  };

  const assign = (warehouseId: string | null) =>
    send(warehouseId ?? "pool", `/api/v1/orders/${orderId}/assign`, { warehouseId, expectedWarehouseId: info?.order.warehouseId ?? null });

  // Warehouses that can fulfil come first, nearest first within each group.
  const sorted = [...(info?.warehouses ?? [])].sort(
    (a, b) => Number(b.canFulfil) - Number(a.canFulfil) || (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity) || a.name.localeCompare(b.name),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Assign order to a warehouse">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl max-h-[92vh] flex flex-col">
        <div className="flex justify-between items-start p-6 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-xl font-heading font-semibold">{info ? `Assign ${info.order.orderNumber}` : "Assign order"}</h2>
            <p className="text-sm text-secondary mt-0.5">Pick a warehouse that has every item. Stock moves with the order.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-4">
          {error && <p role="alert" className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">{error}</p>}

          {!info && !error ? (
            <div className="space-y-3" role="status" aria-busy="true">
              <Bone className="h-6 w-2/3" />
              <Bone className="h-20 w-full" />
              <Bone className="h-20 w-full" />
            </div>
          ) : info ? (
            <>
              <div className="flex flex-wrap gap-2">
                {info.lines.map((l) => (
                  <span key={l.name} className="px-2.5 py-1 rounded-full bg-black/[0.04] text-xs text-primary">
                    {l.name} × {l.quantity}
                  </span>
                ))}
              </div>

              {!info.order.movable && (
                <p className="p-3 rounded-lg bg-amber-50 text-amber-800 text-sm border border-amber-100">
                  This order is {info.order.status.toLowerCase().replace(/_/g, " ")}, so it can no longer change warehouse.
                </p>
              )}

              {info.order.claimedBy && (
                <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-blue-50 text-blue-900 text-sm border border-blue-100">
                  <span>
                    <strong>{info.order.claimedBy.name ?? "An employee"}</strong> is handling this order. Moving it to another warehouse hands it over.
                  </span>
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => send("clear", `/api/v1/orders/${orderId}/claim/clear`)}
                    className="shrink-0 flex items-center gap-1.5 text-xs font-medium underline disabled:opacity-50"
                  >
                    {busy === "clear" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />} Clear
                  </button>
                </div>
              )}

              <ul className="space-y-3">
                {sorted.map((w) => (
                  <li key={w.warehouseId} className={`rounded-xl border p-4 ${w.isCurrent ? "border-black/30 bg-black/[0.02]" : "border-black/[0.08]"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-primary flex items-center gap-2">
                          <Warehouse className="w-4 h-4 shrink-0" /> <span className="truncate">{w.name}</span>
                          {w.isCurrent && <span className="px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-black text-white">Current</span>}
                        </p>
                        <p className="text-xs text-secondary mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{[w.city, w.state].filter(Boolean).join(", ") || "No address"}</span>
                          {w.distanceKm !== null && <span>{w.distanceKm} km from the customer</span>}
                          <span>{w.openOrders} open order{w.openOrders === 1 ? "" : "s"}{w.dailyCapacity ? ` · packs ${w.dailyCapacity}/day` : ""}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={!info.order.movable || w.isCurrent || !w.canFulfil || busy !== null}
                        onClick={() => assign(w.warehouseId)}
                        className="shrink-0 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-black/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {busy === w.warehouseId && <Loader2 className="w-4 h-4 animate-spin" />} Assign here
                      </button>
                    </div>

                    {w.canFulfil ? (
                      <p className="mt-3 text-xs font-medium text-green-700 flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Has every item in stock</p>
                    ) : (
                      <ul className="mt-3 space-y-1">
                        {w.shortages.map((s) => (
                          <li key={s.name} className="text-xs text-red-700 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {s.name}: needs {s.needed}, has {s.available}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
                {sorted.length === 0 && <p className="text-sm text-secondary text-center py-6">No active warehouses. Add one under Inventory.</p>}
              </ul>

              {info.order.movable && info.order.warehouseId && (
                <div className="pt-4 border-t border-black/[0.06]">
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => assign(null)}
                    className="flex items-center gap-2 text-sm font-medium text-secondary hover:text-primary disabled:opacity-50"
                  >
                    {busy === "pool" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Undo2 className="w-4 h-4" />} Release to the open pool
                  </button>
                  <p className="text-xs text-secondary mt-1">The stock goes back to {info.warehouses.find((w) => w.isCurrent)?.name ?? "the warehouse"}, and any warehouse with every item can take the order.</p>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
