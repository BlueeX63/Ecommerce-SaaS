"use client";

import { useEffect, useState } from "react";
import { Loader2, MapPin, Truck } from "lucide-react";
import { clientStoreKey } from "@/lib/storefront/slug";
import { formatDeliveryWindow, money } from "@/lib/storefront/quote";

interface Estimate {
  inStock: boolean;
  eta: { minDate: string; maxDate: string };
  basis: "warehouse" | "default";
  shipFrom: { city: string | null; distanceKm: number | null; approximate: boolean } | null;
  delivery: { deliveryFee: number; freeDeliveryAbove: number };
}

const PIN_KEY = "monolith_delivery_pin";

/**
 * "Check delivery" box for a product page: the shopper enters a PIN code and sees when it would arrive, based
 * on the nearest warehouse that has the item in stock. Colours come from the surrounding template via `tone`.
 */
export function DeliveryEstimate({
  productId,
  currencySymbol = "₹",
  tone = "light",
  className = "",
}: {
  productId: string;
  currencySymbol?: string;
  tone?: "light" | "dark";
  className?: string;
}) {
  const [pin, setPin] = useState("");
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dark = tone === "dark";
  const text = dark ? "text-white" : "text-[#111111]";
  const muted = dark ? "text-white/55" : "text-black/55";
  const border = dark ? "border-white/20" : "border-black/15";

  const check = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const key = clientStoreKey();
      if (!key) throw new Error("Delivery estimates appear on your live store.");
      const res = await fetch(`/api/v1/public/stores/${encodeURIComponent(key)}/delivery-estimate?productId=${encodeURIComponent(productId)}&pin=${encodeURIComponent(trimmed)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "We couldn't check delivery right now.");
      setEstimate(data);
      try {
        localStorage.setItem(PIN_KEY, trimmed);
      } catch {
        // storage unavailable (private mode) - the check still worked
      }
    } catch (e) {
      setEstimate(null);
      setError(e instanceof Error ? e.message : "We couldn't check delivery right now.");
    } finally {
      setLoading(false);
    }
  };

  // Remember the last PIN the shopper checked.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PIN_KEY);
      if (saved) {
        setPin(saved);
        check(saved);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  return (
    <div className={`${text} ${className}`}>
      <p className={`mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest ${muted}`}>
        <Truck className="h-3.5 w-3.5" aria-hidden /> Delivery
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          check(pin);
        }}
        className="flex max-w-sm gap-2"
      >
        <div className="relative flex-1">
          <MapPin className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${muted}`} aria-hidden />
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            inputMode="numeric"
            maxLength={12}
            placeholder="Enter PIN code"
            aria-label="PIN code"
            className={`w-full border bg-transparent py-2.5 pl-9 pr-3 text-sm focus:outline-none ${border} ${text} placeholder:opacity-40`}
          />
        </div>
        <button type="submit" disabled={loading || !pin.trim()} className={`flex min-w-[84px] items-center justify-center border px-4 text-xs font-bold uppercase tracking-widest transition-opacity hover:opacity-70 disabled:opacity-40 ${border}`}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : "Check"}
        </button>
      </form>

      <div aria-live="polite" className="mt-2.5 text-sm">
        {error && <p className="text-red-500">{error}</p>}
        {estimate &&
          (estimate.inStock ? (
            <>
              <p>
                Arrives <strong>{formatDeliveryWindow(estimate.eta.minDate, estimate.eta.maxDate)}</strong>
              </p>
              <p className={`text-xs ${muted}`}>
                {estimate.shipFrom && estimate.basis === "warehouse"
                  ? `Ships from ${estimate.shipFrom.city ?? "our warehouse"}${estimate.shipFrom.distanceKm !== null ? ` · ${estimate.shipFrom.distanceKm.toLocaleString("en-IN")} km away${estimate.shipFrom.approximate ? " (approx.)" : ""}` : ""}`
                  : "Standard delivery estimate"}
              </p>
            </>
          ) : (
            <p className="text-amber-600">Currently out of stock at our warehouses.</p>
          ))}
        {estimate && estimate.delivery.deliveryFee > 0 && estimate.delivery.freeDeliveryAbove > 0 && (
          <p className={`mt-1 text-xs ${muted}`}>
            Delivery {money(currencySymbol, estimate.delivery.deliveryFee)} · free on orders above {money(currencySymbol, estimate.delivery.freeDeliveryAbove)}
          </p>
        )}
      </div>
    </div>
  );
}
