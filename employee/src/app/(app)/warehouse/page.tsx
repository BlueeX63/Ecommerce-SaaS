"use client";

import { useEffect, useState } from "react";
import { Loader2, MapPin, Save } from "lucide-react";
import { Bone, LoadingRegion, PageHeader, inputClass } from "@/components/ui";

interface Warehouse {
  warehouse_name: string;
  address_line_1: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  country: string | null;
  latitude: number | null;
  dispatch_hours: number | null;
  daily_capacity: number | null;
}

export default function WarehousePage() {
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState({ warehouseName: "", addressLine1: "", city: "", state: "", postalCode: "", country: "", dispatchHours: "24", dailyCapacity: "50" });
  const [located, setLocated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/v1/employee/auth/session", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const w: Warehouse | undefined = d?.warehouse;
        if (!w) return;
        setForm({
          warehouseName: w.warehouse_name ?? "",
          addressLine1: w.address_line_1 ?? "",
          city: w.city ?? "",
          state: w.state_province ?? "",
          postalCode: w.postal_code ?? "",
          country: w.country ?? "",
          dispatchHours: String(w.dispatch_hours ?? 24),
          dailyCapacity: String(w.daily_capacity ?? 50),
        });
        setLocated(w.latitude !== null);
      })
      .finally(() => setLoaded(true));
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/v1/employee/warehouse", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouseName: form.warehouseName,
          addressLine1: form.addressLine1,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode,
          country: form.country,
          dispatchHours: Number(form.dispatchHours),
          dailyCapacity: Number(form.dailyCapacity),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(Array.isArray(data.details) && data.details.length ? data.details.join(" · ") : data.error || "Could not save");
      setLocated(data.data?.latitude !== null && data.data?.latitude !== undefined);
      setMessage({ type: "success", text: "Saved. Delivery estimates use these details right away." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Could not save" });
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return (
      <LoadingRegion className="space-y-6">
        <Bone className="h-8 w-56" />
        <Bone className="h-96 rounded-2xl" />
      </LoadingRegion>
    );
  }

  const label = "block text-xs font-medium text-secondary mb-1.5";

  return (
    <div className="space-y-6">
      <PageHeader title="Warehouse" subtitle="Where this warehouse is and how quickly it ships. Shoppers' delivery dates are based on this." />

      <form onSubmit={save} className="bg-surface rounded-2xl border border-black/[0.04] shadow-sm p-6 sm:p-8 space-y-5 max-w-2xl">
        {message && (
          <p role="status" className={`p-3 rounded-lg text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-100"}`}>{message.text}</p>
        )}

        <div>
          <label className={label} htmlFor="name">Warehouse name</label>
          <input id="name" required value={form.warehouseName} onChange={set("warehouseName")} className={inputClass} />
        </div>
        <div>
          <label className={label} htmlFor="addr">Street address</label>
          <input id="addr" value={form.addressLine1} onChange={set("addressLine1")} className={inputClass} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div><label className={label} htmlFor="pin">PIN / postal code</label><input id="pin" inputMode="numeric" value={form.postalCode} onChange={set("postalCode")} className={inputClass} /></div>
          <div><label className={label} htmlFor="city">City</label><input id="city" value={form.city} onChange={set("city")} className={inputClass} /></div>
          <div><label className={label} htmlFor="state">State</label><input id="state" value={form.state} onChange={set("state")} className={inputClass} /></div>
          <div><label className={label} htmlFor="country">Country</label><input id="country" value={form.country} onChange={set("country")} className={inputClass} /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-black/[0.05]">
          <div>
            <label className={label} htmlFor="dispatch">Time to pack &amp; hand over (hours)</label>
            <input id="dispatch" type="number" min={0} max={336} value={form.dispatchHours} onChange={set("dispatchHours")} className={inputClass} />
          </div>
          <div>
            <label className={label} htmlFor="cap">Orders packed per day</label>
            <input id="cap" type="number" min={1} value={form.dailyCapacity} onChange={set("dailyCapacity")} className={inputClass} />
            <p className="text-xs text-secondary mt-1">A longer queue than this adds days to delivery estimates.</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 pt-2">
          <span className={`flex items-center gap-1.5 text-xs ${located ? "text-green-700" : "text-amber-700"}`}>
            <MapPin className="w-3.5 h-3.5" /> {located ? "Located on the map" : "Add a PIN code so we can place this warehouse on the map"}
          </span>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-black/90 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
