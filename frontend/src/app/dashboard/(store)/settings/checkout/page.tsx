"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Receipt, Save, Trash2, Truck } from "lucide-react";
import { useCurrency } from "@/components/dashboard/CurrencyProvider";
import { SettingsSkeleton } from "@/components/dashboard/SettingsSkeleton";

interface Settings {
  tax: { enabled: boolean; gstRate: number; inclusive: boolean; gstin: string; extraTaxes: Array<{ label: string; ratePercent: number }> };
  delivery: { enabled: boolean; fee: number; freeAbove: number };
  eta: { defaultMinDays: number; defaultMaxDays: number; kmPerDay: number };
}

const EMPTY: Settings = {
  tax: { enabled: true, gstRate: 18, inclusive: true, gstin: "", extraTaxes: [] },
  delivery: { enabled: false, fee: 0, freeAbove: 0 },
  eta: { defaultMinDays: 4, defaultMaxDays: 7, kmPerDay: 400 },
};

const inputClass = "w-full px-4 py-2.5 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm";

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <label className="flex items-start justify-between gap-4 cursor-pointer">
      <span>
        <span className="block text-sm font-medium text-primary">{label}</span>
        {description && <span className="block text-xs text-secondary mt-0.5 max-w-md">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-black" : "bg-black/20"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
        <span className="sr-only">{label}</span>
      </button>
    </label>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-primary">{label}</label>
      {children}
      {hint && <p className="text-xs text-secondary">{hint}</p>}
    </div>
  );
}

export default function CheckoutSettingsPage() {
  const { formatCurrency, currencySymbol } = useCurrency();
  const [settings, setSettings] = useState<Settings>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/v1/dashboard/checkout-settings", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => body?.data && setSettings(body.data))
      .catch(() => setMessage({ type: "error", text: "Couldn't load your current settings." }))
      .finally(() => setIsLoading(false));
  }, []);

  const setTax = (patch: Partial<Settings["tax"]>) => setSettings((s) => ({ ...s, tax: { ...s.tax, ...patch } }));
  const setDelivery = (patch: Partial<Settings["delivery"]>) => setSettings((s) => ({ ...s, delivery: { ...s.delivery, ...patch } }));
  const setEta = (patch: Partial<Settings["eta"]>) => setSettings((s) => ({ ...s, eta: { ...s.eta, ...patch } }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/v1/dashboard/checkout-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSettings(data.data);
        setMessage({ type: "success", text: "Saved. Your store's checkout uses these rules right away." });
      } else {
        const details = Array.isArray(data.details) ? ` ${data.details.join(" · ")}` : "";
        setMessage({ type: "error", text: `${data.error || "Failed to save"}${details}` });
      }
    } catch {
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  // A worked example so the merchant can see exactly what a shopper will see.
  const example = useMemo(() => {
    const subtotal = Math.max(settings.delivery.freeAbove > 0 ? settings.delivery.freeAbove / 2 : 1000, 100);
    const rates = [
      ...(settings.tax.gstRate > 0 ? [{ label: `GST ${settings.tax.gstRate}%`, rate: settings.tax.gstRate }] : []),
      ...settings.tax.extraTaxes.filter((t) => t.ratePercent > 0).map((t) => ({ label: `${t.label} ${t.ratePercent}%`, rate: t.ratePercent })),
    ];
    const total = rates.reduce((s, r) => s + r.rate, 0);
    const taxEnabled = settings.tax.enabled && rates.length > 0;
    const lines = taxEnabled
      ? rates.map((r) => ({ label: r.label, amount: settings.tax.inclusive ? (subtotal * r.rate) / (100 + total) : (subtotal * r.rate) / 100 }))
      : [];
    const tax = lines.reduce((s, l) => s + l.amount, 0);
    const free = settings.delivery.enabled && settings.delivery.freeAbove > 0 && subtotal >= settings.delivery.freeAbove;
    const shipping = settings.delivery.enabled && !free ? settings.delivery.fee : 0;
    return { subtotal, lines, tax, shipping, total: subtotal + (settings.tax.inclusive ? 0 : tax) + shipping };
  }, [settings]);

  if (isLoading) return <SettingsSkeleton fields={5} />;

  return (
    <form onSubmit={save} className="space-y-10">
      <div>
        <h2 className="text-2xl font-semibold text-primary mb-1">Taxes &amp; Delivery Charges</h2>
        <p className="text-secondary text-sm">Control the GST shoppers see at checkout and when delivery is charged. These apply to every order automatically.</p>
      </div>

      {message && (
        <div role="status" className={`p-4 rounded-xl text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-100"}`}>
          {message.text}
        </div>
      )}

      {/* ----------------------------------------------------------------- delivery charge */}
      <section className="space-y-5">
        <div className="flex items-center gap-2 text-primary">
          <Truck className="w-4 h-4" />
          <h3 className="font-heading text-sm uppercase tracking-widest">Delivery charge</h3>
        </div>
        <Toggle
          checked={settings.delivery.enabled}
          onChange={(v) => setDelivery({ enabled: v })}
          label="Charge for delivery"
          description="When off, delivery is free on every order."
        />
        {settings.delivery.enabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
            <Field label={`Delivery charge (${currencySymbol})`} hint="Added to orders below the minimum on the right.">
              <input
                type="number"
                min={0}
                step="0.01"
                value={settings.delivery.fee}
                onChange={(e) => setDelivery({ fee: Number(e.target.value) })}
                className={inputClass}
              />
            </Field>
            <Field label={`Free delivery above (${currencySymbol})`} hint="Orders at or above this subtotal ship free. Enter 0 to always charge.">
              <input
                type="number"
                min={0}
                step="0.01"
                value={settings.delivery.freeAbove}
                onChange={(e) => setDelivery({ freeAbove: Number(e.target.value) })}
                className={inputClass}
              />
            </Field>
          </div>
        )}
        <p className="text-xs text-secondary max-w-xl">
          Prefer speed-based pricing (Standard / Express)? Add <Link href="/dashboard/settings/delivery" className="underline">delivery options</Link> — shoppers pick one at checkout and its price replaces the charge above.
        </p>
      </section>

      {/* ----------------------------------------------------------------- taxes */}
      <section className="space-y-5 pt-8 border-t border-black/[0.06]">
        <div className="flex items-center gap-2 text-primary">
          <Receipt className="w-4 h-4" />
          <h3 className="font-heading text-sm uppercase tracking-widest">GST &amp; taxes</h3>
        </div>
        <Toggle checked={settings.tax.enabled} onChange={(v) => setTax({ enabled: v })} label="Show GST / taxes at checkout" description="Shoppers see the tax split on checkout, in their order history and on invoices." />

        {settings.tax.enabled && (
          <div className="space-y-6 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="GST rate (%)" hint="Intra-state orders show CGST + SGST (half each); inter-state orders show IGST.">
                <input type="number" min={0} max={100} step="0.01" value={settings.tax.gstRate} onChange={(e) => setTax({ gstRate: Number(e.target.value) })} className={inputClass} />
              </Field>
              <Field label="Your GSTIN (optional)" hint="Printed on the checkout summary.">
                <input
                  type="text"
                  maxLength={15}
                  value={settings.tax.gstin}
                  onChange={(e) => setTax({ gstin: e.target.value.toUpperCase() })}
                  placeholder="22AAAAA0000A1Z5"
                  className={`${inputClass} font-mono uppercase`}
                />
              </Field>
            </div>

            <fieldset>
              <legend className="block text-sm font-medium text-primary mb-2">How are your product prices set?</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { value: true, title: "Prices include tax", body: "The tax is already inside each price. Totals don't change; shoppers see how much of it is GST." },
                  { value: false, title: "Add tax on top", body: "Tax is calculated on top of the price and added to the total at checkout." },
                ].map((opt) => (
                  <label
                    key={String(opt.value)}
                    className={`cursor-pointer rounded-xl border p-4 text-left transition-colors ${settings.tax.inclusive === opt.value ? "border-black bg-black/[0.03]" : "border-black/10 hover:bg-black/[0.02]"}`}
                  >
                    <input type="radio" name="taxMode" className="sr-only" checked={settings.tax.inclusive === opt.value} onChange={() => setTax({ inclusive: opt.value })} />
                    <span className="block text-sm font-medium text-primary">{opt.title}</span>
                    <span className="block text-xs text-secondary mt-1">{opt.body}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="block text-sm font-medium text-primary">Other taxes (cess, etc.)</span>
                {settings.tax.extraTaxes.length < 5 && (
                  <button type="button" onClick={() => setTax({ extraTaxes: [...settings.tax.extraTaxes, { label: "", ratePercent: 0 }] })} className="flex items-center gap-1 text-xs font-medium text-accent hover:underline">
                    <Plus className="w-3 h-3" /> Add tax
                  </button>
                )}
              </div>
              {settings.tax.extraTaxes.length === 0 && <p className="text-xs text-secondary">None.</p>}
              <div className="space-y-2">
                {settings.tax.extraTaxes.map((t, i) => (
                  <div key={i} className="flex gap-3">
                    <input
                      aria-label="Tax name"
                      placeholder="Name, e.g. Cess"
                      value={t.label}
                      onChange={(e) => setTax({ extraTaxes: settings.tax.extraTaxes.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })}
                      className={`${inputClass} flex-1`}
                    />
                    <input
                      aria-label="Rate in percent"
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={t.ratePercent}
                      onChange={(e) => setTax({ extraTaxes: settings.tax.extraTaxes.map((x, j) => (j === i ? { ...x, ratePercent: Number(e.target.value) } : x)) })}
                      className={`${inputClass} w-28`}
                    />
                    <button type="button" aria-label="Remove tax" onClick={() => setTax({ extraTaxes: settings.tax.extraTaxes.filter((_, j) => j !== i) })} className="p-2.5 text-secondary hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ----------------------------------------------------------------- delivery time */}
      <section className="space-y-5 pt-8 border-t border-black/[0.06]">
        <div className="flex items-center gap-2 text-primary">
          <Truck className="w-4 h-4" />
          <h3 className="font-heading text-sm uppercase tracking-widest">Delivery time estimate</h3>
        </div>
        <p className="text-xs text-secondary max-w-xl">
          Shoppers see an arrival date based on the distance to the nearest <Link href="/dashboard/inventory" className="underline">warehouse that has their items in stock</Link>. These values tune that estimate, and are used when no warehouse can be matched.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-2xl">
          <Field label="Fallback: fastest (days)">
            <input type="number" min={0} max={60} value={settings.eta.defaultMinDays} onChange={(e) => setEta({ defaultMinDays: Number(e.target.value) })} className={inputClass} />
          </Field>
          <Field label="Fallback: slowest (days)">
            <input type="number" min={0} max={90} value={settings.eta.defaultMaxDays} onChange={(e) => setEta({ defaultMaxDays: Number(e.target.value) })} className={inputClass} />
          </Field>
          <Field label="Courier speed (km/day)" hint="400 is typical for road delivery.">
            <input type="number" min={50} max={3000} value={settings.eta.kmPerDay} onChange={(e) => setEta({ kmPerDay: Number(e.target.value) })} className={inputClass} />
          </Field>
        </div>
      </section>

      {/* ----------------------------------------------------------------- preview */}
      <section className="pt-8 border-t border-black/[0.06]">
        <h3 className="font-heading text-sm uppercase tracking-widest text-primary mb-4">What a shopper sees</h3>
        <div className="max-w-sm rounded-2xl border border-black/10 p-5 bg-black/[0.015] space-y-2 text-sm">
          <div className="flex justify-between text-secondary"><span>Items</span><span className="tabular-nums">{formatCurrency(example.subtotal)}</span></div>
          <div className="flex justify-between text-secondary">
            <span>Delivery charge</span>
            <span className="tabular-nums">{example.shipping === 0 ? "Free" : formatCurrency(example.shipping)}</span>
          </div>
          {!settings.tax.inclusive && example.lines.map((l) => (
            <div key={l.label} className="flex justify-between text-secondary"><span>{l.label}</span><span className="tabular-nums">{formatCurrency(l.amount)}</span></div>
          ))}
          {settings.tax.inclusive && example.tax > 0 && (
            <div className="flex justify-between text-secondary"><span>Includes taxes</span><span className="tabular-nums">{formatCurrency(example.tax)}</span></div>
          )}
          <div className="flex justify-between font-semibold text-primary pt-2 border-t border-black/10"><span>Total</span><span className="tabular-nums">{formatCurrency(example.total)}</span></div>
        </div>
      </section>

      <div className="pt-6 border-t border-black/[0.06] flex justify-end">
        <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-lg hover:bg-black/90 transition-colors text-sm font-medium disabled:opacity-50">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}
