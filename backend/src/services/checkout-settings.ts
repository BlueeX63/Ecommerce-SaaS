import { z } from 'zod';
import { db } from '../lib/supabase.js';
import { fetchWithCache } from '../lib/kv.js';

/**
 * Per-store checkout rules, set by the merchant in Settings -> Checkout: GST/taxes, delivery charge with a
 * free-delivery threshold, and delivery-time estimation tuning. Stored as one JSON blob in `tenant_settings`
 * (key `checkout_settings`), like the payment-methods settings, so no schema change is needed per store.
 *
 * Defaults keep existing stores' totals unchanged: prices are treated as GST-inclusive (the tax is shown as part
 * of the price, not added on top) and no delivery charge is applied until the merchant configures one.
 */
export interface ExtraTax {
  label: string;
  ratePercent: number;
}

export interface CheckoutSettings {
  tax: {
    enabled: boolean;
    /** GST rate in percent, e.g. 18. */
    gstRate: number;
    /** true: product prices already include tax. false: tax is added on top at checkout. */
    inclusive: boolean;
    gstin: string;
    /** Other taxes/cess applied on top of GST, e.g. { label: "Cess", ratePercent: 1 }. */
    extraTaxes: ExtraTax[];
  };
  delivery: {
    /** Charge a delivery fee on small orders. */
    enabled: boolean;
    fee: number;
    /** Orders at or above this subtotal ship free. 0 means "never free". */
    freeAbove: number;
  };
  eta: {
    /** Used when no warehouse stock/location data is available. */
    defaultMinDays: number;
    defaultMaxDays: number;
    /** How far a parcel travels per day (km). */
    kmPerDay: number;
  };
}

export const DEFAULT_CHECKOUT_SETTINGS: CheckoutSettings = {
  tax: { enabled: true, gstRate: 18, inclusive: true, gstin: '', extraTaxes: [] },
  delivery: { enabled: false, fee: 0, freeAbove: 0 },
  eta: { defaultMinDays: 4, defaultMaxDays: 7, kmPerDay: 400 },
};

const percent = z.coerce.number().min(0).max(100);

export const checkoutSettingsSchema = z.object({
  tax: z
    .object({
      enabled: z.boolean(),
      gstRate: percent,
      inclusive: z.boolean(),
      gstin: z
        .string()
        .trim()
        .toUpperCase()
        .max(15)
        .refine((v) => v === '' || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(v), 'Enter a valid 15-character GSTIN'),
      extraTaxes: z.array(z.object({ label: z.string().trim().min(1).max(40), ratePercent: percent })).max(5),
    })
    .partial(),
  delivery: z
    .object({
      enabled: z.boolean(),
      fee: z.coerce.number().min(0).max(100_000),
      freeAbove: z.coerce.number().min(0).max(100_000_000),
    })
    .partial(),
  eta: z
    .object({
      defaultMinDays: z.coerce.number().int().min(0).max(60),
      defaultMaxDays: z.coerce.number().int().min(0).max(90),
      kmPerDay: z.coerce.number().min(50).max(3000),
    })
    .partial(),
});

type Partials = z.infer<typeof checkoutSettingsSchema>;

function merge(base: CheckoutSettings, patch: Partials | Record<string, any>): CheckoutSettings {
  const next: CheckoutSettings = {
    tax: { ...base.tax, ...(patch.tax ?? {}) },
    delivery: { ...base.delivery, ...(patch.delivery ?? {}) },
    eta: { ...base.eta, ...(patch.eta ?? {}) },
  };
  if (next.eta.defaultMaxDays < next.eta.defaultMinDays) next.eta.defaultMaxDays = next.eta.defaultMinDays;
  return next;
}

export function mergeCheckoutSettings(current: CheckoutSettings, patch: Partials): CheckoutSettings {
  return merge(current, patch);
}

export async function getCheckoutSettings(tenantId: string): Promise<CheckoutSettings> {
  const raw = await fetchWithCache<string | null>(
    `checkout_settings:${tenantId}`,
    async () => {
      const { data } = await db
        .from('tenant_settings')
        .select('setting_value')
        .eq('tenant_id', tenantId)
        .eq('setting_key', 'checkout_settings')
        .maybeSingle();
      return data?.setting_value ?? null;
    },
    3600,
  );
  if (!raw) return DEFAULT_CHECKOUT_SETTINGS;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const result = checkoutSettingsSchema.safeParse(parsed);
    return result.success ? merge(DEFAULT_CHECKOUT_SETTINGS, result.data) : DEFAULT_CHECKOUT_SETTINGS;
  } catch {
    return DEFAULT_CHECKOUT_SETTINGS;
  }
}

/** The subset a shopper's cart/checkout needs to explain pricing before a quote is requested. */
export function publicCheckoutConfig(settings: CheckoutSettings) {
  return {
    taxEnabled: settings.tax.enabled,
    gstRate: settings.tax.gstRate,
    taxInclusive: settings.tax.inclusive,
    deliveryFee: settings.delivery.enabled ? settings.delivery.fee : 0,
    freeDeliveryAbove: settings.delivery.enabled ? settings.delivery.freeAbove : 0,
  };
}
