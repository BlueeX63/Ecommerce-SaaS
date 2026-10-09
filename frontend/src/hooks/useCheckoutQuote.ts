"use client";

import { useEffect, useMemo, useState } from "react";
import type { Quote, QuoteDestination } from "@/lib/storefront/quote";

export interface QuoteLine {
  id: string;
  quantity: number;
}

interface Options {
  slug: string;
  lines: QuoteLine[];
  couponCode?: string | null;
  deliveryOptionId?: string | null;
  destination: QuoteDestination;
  /** Skip requesting until the shopper is known to be signed in. */
  enabled?: boolean;
}

/**
 * Asks the backend what this cart costs (items, discount, GST, delivery charge) and when it will arrive.
 * Requests are debounced so typing a PIN code doesn't fire one per keystroke, and a slow response can never
 * overwrite a newer one.
 */
export function useCheckoutQuote({ slug, lines, couponCode, deliveryOptionId, destination, enabled = true }: Options) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const key = useMemo(
    () =>
      JSON.stringify({
        l: lines.map((x) => [x.id, x.quantity]),
        c: couponCode || null,
        o: deliveryOptionId || null,
        d: [destination.address, destination.city, destination.state, destination.zip, destination.latitude, destination.longitude],
      }),
    [lines, couponCode, deliveryOptionId, destination.address, destination.city, destination.state, destination.zip, destination.latitude, destination.longitude],
  );

  useEffect(() => {
    if (!enabled || lines.length === 0) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const clean = <T,>(v: T | "" | undefined): T | undefined => (v === "" || v === undefined || v === null ? undefined : (v as T));
        const res = await fetch(`/api/v1/store/quote${slug ? `?slug=${encodeURIComponent(slug)}` : ""}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            slug: slug || undefined,
            items: lines.map((l) => ({ productId: l.id, quantity: l.quantity })),
            couponCode: couponCode || undefined,
            deliveryOptionId: deliveryOptionId || undefined,
            shippingDetails: {
              address: clean(destination.address),
              city: clean(destination.city),
              state: clean(destination.state),
              zip: clean(destination.zip),
              country: clean(destination.country),
              latitude: clean(destination.latitude),
              longitude: clean(destination.longitude),
            },
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (controller.signal.aborted) return;
        if (res.ok) {
          setQuote(data as Quote);
          setError(null);
        } else {
          setError(data.error || "Could not calculate your total.");
        }
      } catch (e) {
        if ((e as Error)?.name !== "AbortError") setError("Could not calculate your total. Check your connection.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 450);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // `key` captures every input; the objects themselves change identity on each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, slug, enabled]);

  return { quote: lines.length === 0 ? null : quote, loading, error };
}
