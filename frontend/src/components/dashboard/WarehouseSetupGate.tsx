"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, Warehouse } from "lucide-react";

const EMPTY = { warehouseName: "", addressLine1: "", postalCode: "", city: "", state: "", country: "India", dispatchHours: "24" };

/**
 * Every store needs a place it ships from: delivery estimates, stock and employee accounts all hang off a
 * warehouse. Until the merchant has one, this asks for their current business location (they can add more later
 * under Inventory).
 */
export function WarehouseSetupGate() {
  const router = useRouter();
  const [needed, setNeeded] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/warehouses", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => !cancelled && d && Array.isArray(d.data) && d.data.length === 0 && setNeeded(true))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (!needed) return null;

  const set = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const valid = form.warehouseName.trim() && form.addressLine1.trim().length >= 4 && form.postalCode.trim().length >= 3 && form.city.trim() && form.state.trim();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/warehouses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouseName: form.warehouseName.trim(),
          addressLine1: form.addressLine1.trim(),
          postalCode: form.postalCode.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          country: form.country.trim() || undefined,
          dispatchHours: Number(form.dispatchHours) || 24,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(Array.isArray(data.details) ? data.details.join(" · ") : data.error || "Could not save your location");
      setNeeded(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your location");
    } finally {
      setBusy(false);
    }
  };

  const field = "w-full px-4 py-2.5 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm";
  const label = "block text-xs font-medium text-secondary mb-1.5";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="wh-setup-title">
      <form onSubmit={submit} className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="p-6 border-b border-black/[0.06]">
          <div className="w-11 h-11 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4">
            <Warehouse className="w-5 h-5" />
          </div>
          <h2 id="wh-setup-title" className="font-heading text-2xl text-primary">Where do you ship from?</h2>
          <p className="text-sm text-secondary mt-1.5">
            Enter your current business location. We use it to find the nearest stock for each shopper and estimate delivery times. You can add more warehouses and give each its own team later.
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className={label} htmlFor="wh-name">Location name</label>
            <input id="wh-name" required value={form.warehouseName} onChange={set("warehouseName")} placeholder="e.g. Main warehouse" className={field} />
          </div>
          <div>
            <label className={label} htmlFor="wh-addr">Street address</label>
            <input id="wh-addr" required autoComplete="street-address" value={form.addressLine1} onChange={set("addressLine1")} className={field} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label} htmlFor="wh-pin">PIN / postal code</label>
              <input id="wh-pin" required inputMode="numeric" autoComplete="postal-code" value={form.postalCode} onChange={set("postalCode")} className={field} />
            </div>
            <div>
              <label className={label} htmlFor="wh-city">City</label>
              <input id="wh-city" required autoComplete="address-level2" value={form.city} onChange={set("city")} className={field} />
            </div>
            <div>
              <label className={label} htmlFor="wh-state">State</label>
              <input id="wh-state" required autoComplete="address-level1" value={form.state} onChange={set("state")} className={field} />
            </div>
            <div>
              <label className={label} htmlFor="wh-country">Country</label>
              <input id="wh-country" value={form.country} onChange={set("country")} className={field} />
            </div>
          </div>
          <div>
            <label className={label} htmlFor="wh-dispatch">Time to pack &amp; hand over an order (hours)</label>
            <input id="wh-dispatch" type="number" min={0} max={336} value={form.dispatchHours} onChange={set("dispatchHours")} className={field} />
          </div>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="px-6 pb-6">
          <button type="submit" disabled={busy || !valid} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-xl text-sm font-medium hover:bg-black/90 transition-colors disabled:opacity-50">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
            Save my location
          </button>
        </div>
      </form>
    </div>
  );
}
