/** Shapes returned by the backend's POST /api/v1/store/quote (see backend/src/services/quote.ts). */

export interface TaxLine {
  label: string;
  ratePercent: number;
  amount: number;
}

export interface Quote {
  lines: Array<{ productId: string; name: string; unitPrice: number; quantity: number; total: number }>;
  subtotal: number;
  discount: number;
  couponCode: string | null;
  tax: { enabled: boolean; inclusive: boolean; ratePercent: number; total: number; lines: TaxLine[]; gstin: string | null };
  shipping: { fee: number; free: boolean; freeAbove: number; amountToFree: number; label: string; deliveryOptionId: string | null };
  total: number;
  delivery: {
    minDays: number;
    maxDays: number;
    minDate: string;
    maxDate: string;
    basis: "warehouse" | "default";
    shipFrom: { warehouseId: string; name: string; city: string | null; state: string | null; distanceKm: number | null; approximate: boolean } | null;
    /** Why the date is what it is, e.g. "Based on 12 recent deliveries to this area". */
    notes?: string[];
    confidence?: "high" | "medium" | "low";
  };
  allInStock: boolean;
  unavailable: Array<{ productId: string; name: string }>;
}

export interface QuoteDestination {
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

const DAY_FORMAT: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" };

/** "Tue, 14 Oct" or "Tue, 14 Oct – Thu, 16 Oct" */
export function formatDeliveryWindow(minDate: string, maxDate: string): string {
  const min = new Date(minDate);
  const max = new Date(maxDate);
  const a = min.toLocaleDateString("en-IN", DAY_FORMAT);
  const b = max.toLocaleDateString("en-IN", DAY_FORMAT);
  return a === b ? a : `${a} – ${b}`;
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function currencyPrefix(code: string | null | undefined): string {
  switch ((code || "").toUpperCase()) {
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    case "CAD":
      return "C$";
    case "AUD":
      return "A$";
    default:
      return "₹";
  }
}

export function money(symbol: string, amount: number): string {
  return `${symbol}${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
