import { db } from '../lib/supabase.js';
import { ApiError } from '../lib/http.js';
import { getCheckoutSettings, type CheckoutSettings } from './checkout-settings.js';
import { getActiveWarehouses, planFulfillment, type Destination, type FulfillmentPlan } from './fulfillment.js';
import { geocode, isValidPoint } from './geo.js';
import { evaluateCoupon, fromCents, priceLines, toCents, type CouponRow, type OrderLineInput, type PricedLine } from './pricing.js';

export interface QuoteInput {
  tenantId: string;
  customer: { customer_id: string; phone_number: string | null };
  lines: OrderLineInput[];
  couponCode?: string | null;
  deliveryOptionId?: string | null;
  destination: Destination;
}

export interface TaxLine {
  label: string;
  ratePercent: number;
  amount: number;
}

/** Everything the checkout screen shows, plus the exact cent amounts the order is saved with. */
export interface Quote {
  lines: Array<{ productId: string; name: string; unitPrice: number; quantity: number; total: number }>;
  subtotal: number;
  discount: number;
  couponCode: string | null;
  tax: { enabled: boolean; inclusive: boolean; ratePercent: number; total: number; lines: TaxLine[]; gstin: string | null };
  shipping: {
    fee: number;
    free: boolean;
    freeAbove: number;
    amountToFree: number;
    label: string;
    deliveryOptionId: string | null;
  };
  total: number;
  delivery: {
    minDays: number;
    maxDays: number;
    minDate: string;
    maxDate: string;
    basis: FulfillmentPlan['basis'];
    shipFrom: FulfillmentPlan['shipFrom'];
  };
  allInStock: boolean;
  unavailable: Array<{ productId: string; name: string }>;
  /** Server-side only; never serialised to the browser. */
  internal: {
    priced: PricedLine[];
    plan: FulfillmentPlan;
    coupon: CouponRow | null;
    cents: { subtotal: number; discount: number; tax: number; shipping: number; total: number };
    settings: CheckoutSettings;
    point: { lat: number; lng: number } | null;
  };
}

interface TaxResult {
  total: number;
  lines: TaxLine[];
}

/** Splits `taxableCents` into tax lines. `inclusive` extracts tax already inside the price, otherwise adds it. */
export function computeTax(taxableCents: number, settings: CheckoutSettings, intraState: boolean | null): TaxResult {
  if (!settings.tax.enabled || taxableCents <= 0) return { total: 0, lines: [] };

  const components: Array<{ label: string; rate: number }> = [];
  const gst = settings.tax.gstRate;
  if (gst > 0) {
    if (intraState === true) {
      components.push({ label: 'CGST', rate: gst / 2 }, { label: 'SGST', rate: gst / 2 });
    } else if (intraState === false) {
      components.push({ label: 'IGST', rate: gst });
    } else {
      components.push({ label: 'GST', rate: gst });
    }
  }
  for (const extra of settings.tax.extraTaxes) if (extra.ratePercent > 0) components.push({ label: extra.label, rate: extra.ratePercent });
  if (components.length === 0) return { total: 0, lines: [] };

  const totalRate = components.reduce((sum, c) => sum + c.rate, 0);
  const amounts = components.map((c) =>
    settings.tax.inclusive ? Math.round((taxableCents * c.rate) / (100 + totalRate)) : Math.round((taxableCents * c.rate) / 100),
  );
  return {
    total: amounts.reduce((a, b) => a + b, 0),
    lines: components.map((c, i) => ({ label: c.label, ratePercent: Math.round(c.rate * 100) / 100, amount: fromCents(amounts[i]) })),
  };
}

const sameText = (a?: string | null, b?: string | null) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

/** Resolves a delivery destination's coordinates, only calling the geocoder when a warehouse could use them. */
async function resolveDestinationPoint(destination: Destination, hasLocatedWarehouse: boolean) {
  if (destination.point && isValidPoint(destination.point.lat, destination.point.lng)) return destination.point;
  if (!hasLocatedWarehouse) return null;
  if (!destination.postalCode && !destination.city) return null;
  return geocode({ postalCode: destination.postalCode, city: destination.city, state: destination.state, country: destination.country });
}

/**
 * The single source of truth for what an order costs and when it arrives. The storefront asks for a quote while
 * the shopper checks out; placing the order runs the very same function, so the price shown is the price charged.
 */
export async function buildQuote(input: QuoteInput): Promise<Quote> {
  const { tenantId } = input;
  const settings = await getCheckoutSettings(tenantId);
  const priced = await priceLines(tenantId, input.customer, input.lines);

  const subtotalCents = priced.reduce((sum, line) => sum + line.totalCents, 0);

  let discountCents = 0;
  let coupon: CouponRow | null = null;
  if (input.couponCode) {
    const result = await evaluateCoupon(tenantId, input.couponCode, subtotalCents);
    if (!result.ok) throw result.error;
    coupon = result.coupon;
    discountCents = result.discountCents;
  }
  const taxableCents = subtotalCents - discountCents;

  // Delivery estimate + which warehouse ships it
  const warehouses = await getActiveWarehouses(tenantId);
  const point = await resolveDestinationPoint(input.destination, warehouses.some((w) => isValidPoint(w.latitude, w.longitude)));
  const plan = await planFulfillment(tenantId, priced.map((p) => ({ productId: p.productId, quantity: p.quantity })), { ...input.destination, point }, settings, warehouses);

  const unavailable = plan.lines
    .filter((l) => l.status === 'out_of_stock')
    .map((l) => ({ productId: l.productId, name: priced.find((p) => p.productId === l.productId)?.name ?? 'Item' }));

  // Tax: CGST+SGST when shipping within one state, IGST across states, plain GST when we can't tell.
  const originState = plan.shipFrom?.state;
  const intraState = originState && input.destination.state ? sameText(originState, input.destination.state) : null;
  const tax = computeTax(taxableCents, settings, intraState);

  // Delivery charge
  let deliveryOptionId: string | null = null;
  let optionName: string | null = null;
  let baseFeeCents = settings.delivery.enabled ? toCents(settings.delivery.fee) : 0;
  if (input.deliveryOptionId) {
    const { data: option } = await db
      .from('delivery_options')
      .select('delivery_option_id, name, price')
      .eq('delivery_option_id', input.deliveryOptionId)
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .maybeSingle();
    if (!option) throw new ApiError(400, 'Invalid delivery option');
    deliveryOptionId = option.delivery_option_id;
    optionName = option.name;
    baseFeeCents = toCents(option.price);
  }
  const freeAboveCents = settings.delivery.enabled ? toCents(settings.delivery.freeAbove) : 0;
  const qualifiesFree = freeAboveCents > 0 && taxableCents >= freeAboveCents;
  const shippingCents = qualifiesFree ? 0 : baseFeeCents;
  const amountToFreeCents = !qualifiesFree && freeAboveCents > 0 && baseFeeCents > 0 ? freeAboveCents - taxableCents : 0;

  const totalCents = taxableCents + (settings.tax.inclusive ? 0 : tax.total) + shippingCents;

  return {
    lines: priced.map((p) => ({
      productId: p.productId,
      name: p.name,
      unitPrice: fromCents(p.unitCents),
      quantity: p.quantity,
      total: fromCents(p.totalCents),
    })),
    subtotal: fromCents(subtotalCents),
    discount: fromCents(discountCents),
    couponCode: coupon?.code ?? null,
    tax: {
      enabled: settings.tax.enabled && tax.lines.length > 0,
      inclusive: settings.tax.inclusive,
      ratePercent: settings.tax.gstRate + settings.tax.extraTaxes.reduce((s, t) => s + t.ratePercent, 0),
      total: fromCents(tax.total),
      lines: tax.lines,
      gstin: settings.tax.gstin || null,
    },
    shipping: {
      fee: fromCents(baseFeeCents),
      free: baseFeeCents > 0 && shippingCents === 0,
      freeAbove: fromCents(freeAboveCents),
      amountToFree: fromCents(Math.max(0, amountToFreeCents)),
      label: optionName ?? 'Delivery',
      deliveryOptionId,
    },
    total: fromCents(totalCents),
    delivery: { ...plan.eta, basis: plan.basis, shipFrom: plan.shipFrom },
    allInStock: plan.allInStock,
    unavailable,
    internal: {
      priced,
      plan,
      coupon,
      cents: { subtotal: subtotalCents, discount: discountCents, tax: tax.total, shipping: shippingCents, total: totalCents },
      settings,
      point,
    },
  };
}

/** The browser-safe view of a quote. */
export function publicQuote(quote: Quote) {
  const { internal: _internal, ...rest } = quote;
  return rest;
}
