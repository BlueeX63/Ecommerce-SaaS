"use client";

import { AlertTriangle, MapPin, Tag, Truck } from "lucide-react";
import { formatDeliveryWindow, money, type Quote } from "@/lib/storefront/quote";

export interface SummaryTheme {
  panel: string;
  heading: string;
  muted: string;
  border: string;
  accent: string;
  success: string;
  danger: string;
  chip: string;
}

export interface SummaryLine {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface Props {
  theme: SummaryTheme;
  symbol: string;
  lines: SummaryLine[];
  quote: Quote | null;
  loading: boolean;
  error: string | null;
  /** Shown when no quote is available, so the shopper always sees an honest subtotal. */
  fallbackSubtotal: number;
  className?: string;
}

function Row({ label, value, strong, tone, theme }: { label: React.ReactNode; value: React.ReactNode; strong?: boolean; tone?: string; theme: SummaryTheme }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 ${strong ? "text-base font-semibold" : "text-sm"}`}>
      <span className={strong ? "" : theme.muted}>{label}</span>
      <span className={`tabular-nums ${tone ?? ""}`}>{value}</span>
    </div>
  );
}

/**
 * Order summary used on every storefront checkout: items, the full price breakdown (discount, delivery charge,
 * GST/taxes) and the estimated delivery date computed from the nearest warehouse that has the items in stock.
 */
export function OrderSummary({ theme, symbol, lines, quote, loading, error, fallbackSubtotal, className = "" }: Props) {
  const showQuote = !!quote;
  const eta = quote?.delivery;

  return (
    <aside className={`rounded-2xl border p-5 sm:p-6 ${theme.panel} ${theme.border} ${className}`} aria-label="Order summary">
      <h2 className={`mb-4 text-sm font-semibold uppercase tracking-widest ${theme.heading}`}>Order summary</h2>

      <ul className="mb-5 max-h-64 space-y-3 overflow-y-auto pr-1">
        {lines.map((line) => (
          <li key={line.id} className="flex items-center gap-3">
            <div className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border ${theme.border} ${theme.chip}`}>
              {line.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={line.image} alt="" className="h-full w-full object-cover" />
              ) : null}
              <span className="absolute -right-0 -top-0 flex h-5 min-w-5 items-center justify-center rounded-bl-lg bg-black/70 px-1 text-[10px] font-bold text-white">
                {line.quantity}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{line.name}</p>
              <p className={`text-xs ${theme.muted}`}>
                {symbol}
                {line.price.toFixed(2)} each
              </p>
            </div>
            <p className="text-sm font-medium tabular-nums">{money(symbol, line.price * line.quantity)}</p>
          </li>
        ))}
      </ul>

      {/* Delivery estimate */}
      {eta && (
        <div className={`mb-5 rounded-xl border p-3.5 ${theme.border} ${theme.chip}`}>
          <div className="flex items-start gap-3">
            <Truck className={`mt-0.5 h-4 w-4 shrink-0 ${theme.accent}`} aria-hidden />
            <div className="min-w-0 text-sm">
              <p className="font-semibold">Arrives {formatDeliveryWindow(eta.minDate, eta.maxDate)}</p>
              {eta.shipFrom && eta.basis === "warehouse" ? (
                <p className={`mt-1 flex items-start gap-1.5 text-xs leading-snug ${theme.muted}`}>
                  <MapPin className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                  <span>
                    Ships from {eta.shipFrom.city || eta.shipFrom.name}
                    {eta.shipFrom.distanceKm !== null ? ` · about ${eta.shipFrom.distanceKm.toLocaleString("en-IN")} km from you${eta.shipFrom.approximate ? " (approx.)" : ""}` : ""}
                  </span>
                </p>
              ) : (
                <p className={`mt-1 text-xs ${theme.muted}`}>Standard delivery estimate. Enter your PIN code for a precise date.</p>
              )}
              {eta.notes && eta.notes.length > 0 && <p className={`mt-1 text-xs ${theme.muted}`}>{eta.notes.join(" · ")}</p>}
            </div>
          </div>
        </div>
      )}

      {quote && quote.unavailable.length > 0 && (
        <div className={`mb-5 flex items-start gap-2.5 rounded-xl border p-3.5 text-sm ${theme.border} ${theme.danger}`} role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            {quote.unavailable.map((u) => u.name).join(", ")} {quote.unavailable.length > 1 ? "are" : "is"} out of stock right now. Remove {quote.unavailable.length > 1 ? "them" : "it"} from your cart to continue.
          </p>
        </div>
      )}

      {/* Price breakdown */}
      <div className={`space-y-2.5 border-t pt-4 ${theme.border} ${loading && showQuote ? "opacity-60 transition-opacity" : ""}`}>
        <Row theme={theme} label={`Items (${lines.reduce((n, l) => n + l.quantity, 0)})`} value={money(symbol, quote ? quote.subtotal : fallbackSubtotal)} />

        {quote && quote.discount > 0 && (
          <Row
            theme={theme}
            label={
              <span className="inline-flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" aria-hidden /> Discount{quote.couponCode ? ` (${quote.couponCode})` : ""}
              </span>
            }
            value={`− ${money(symbol, quote.discount)}`}
            tone={theme.success}
          />
        )}

        {quote && (
          <Row
            theme={theme}
            label={quote.shipping.label === "Delivery" ? "Delivery charge" : quote.shipping.label}
            value={quote.shipping.fee === 0 || quote.shipping.free ? <span className={theme.success}>{quote.shipping.free ? <><s className={`mr-1.5 ${theme.muted}`}>{money(symbol, quote.shipping.fee)}</s>Free</> : "Free"}</span> : money(symbol, quote.shipping.fee)}
          />
        )}
        {quote && !quote.shipping.free && quote.shipping.amountToFree > 0 && (
          <p className={`text-xs ${theme.accent}`}>
            Add {money(symbol, quote.shipping.amountToFree)} more to get free delivery.
          </p>
        )}

        {quote?.tax.enabled && (
          <div className="space-y-1.5">
            {!quote.tax.inclusive &&
              quote.tax.lines.map((line) => (
                <Row key={line.label} theme={theme} label={`${line.label} (${line.ratePercent}%)`} value={money(symbol, line.amount)} />
              ))}
            {quote.tax.inclusive && (
              <>
                <Row theme={theme} label={`Includes taxes (${quote.tax.ratePercent}%)`} value={money(symbol, quote.tax.total)} />
                {quote.tax.lines.length > 1 &&
                  quote.tax.lines.map((line) => (
                    <div key={line.label} className={`flex justify-between pl-3 text-xs ${theme.muted}`}>
                      <span>
                        {line.label} ({line.ratePercent}%)
                      </span>
                      <span className="tabular-nums">{money(symbol, line.amount)}</span>
                    </div>
                  ))}
              </>
            )}
          </div>
        )}

        <div className={`border-t pt-3 ${theme.border}`}>
          <Row theme={theme} strong label="Total" value={money(symbol, quote ? quote.total : fallbackSubtotal)} />
          {quote?.tax.enabled && quote.tax.inclusive && <p className={`mt-1 text-right text-[11px] ${theme.muted}`}>Inclusive of all taxes</p>}
        </div>

        {!quote && !loading && (
          <p className={`pt-1 text-xs ${theme.muted}`}>{error ?? "Delivery, taxes and the final total are calculated once your details are in."}</p>
        )}
        {quote?.tax.gstin && <p className={`pt-1 text-[11px] ${theme.muted}`}>Seller GSTIN: {quote.tax.gstin}</p>}
      </div>
    </aside>
  );
}
