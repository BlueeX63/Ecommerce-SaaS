import { db } from '../lib/supabase.js';
import { fetchWithCache, kvDel } from '../lib/kv.js';
import { notFound } from '../lib/http.js';

export interface StoreTenant {
  tenant_id: string;
  code: string;
  tenant_name: string;
  custom_domain: string | null;
}

const STORE_KEY = /^[a-z0-9](?:[a-z0-9.-]{0,251}[a-z0-9])?$/;

/** Lower-cases and validates a store slug / custom-domain host. Returns null if it is not a valid key. */
export function normalizeStoreKey(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const key = raw.trim().toLowerCase();
  return STORE_KEY.test(key) ? key : null;
}

/**
 * Resolves a public store key (tenant code or custom domain) to a tenant.
 * Uses two exact-match queries instead of an interpolated `.or()` filter, so untrusted input can never
 * alter the PostgREST filter expression.
 */
export async function resolveStoreTenant(rawKey: unknown): Promise<StoreTenant | null> {
  const key = normalizeStoreKey(rawKey);
  if (!key) return null;

  return fetchWithCache<StoreTenant | null>(
    `tenant:${key}`,
    async () => {
      const columns = 'tenant_id, code, tenant_name, custom_domain, status';
      let { data } = await db.from('tenant').select(columns).eq('code', key).maybeSingle();
      if (!data) {
        ({ data } = await db.from('tenant').select(columns).eq('custom_domain', key).maybeSingle());
      }
      if (!data || data.status !== 'ACTIVE') return null;
      return {
        tenant_id: data.tenant_id,
        code: data.code,
        tenant_name: data.tenant_name,
        custom_domain: data.custom_domain ?? null,
      };
    },
    3600,
  );
}

export async function requireStoreTenant(rawKey: unknown): Promise<StoreTenant> {
  const tenant = await resolveStoreTenant(rawKey);
  if (!tenant) throw notFound('Store not found');
  return tenant;
}

/**
 * Legacy rows written by the onboarding flow store fields FLAT (`{templateId, brandName, heroTitle, ...}`)
 * instead of nested under `formData` (`{templateId, formData: {brandName, heroTitle, ...}}`), which is what
 * every reader (the Storefront Content editor, the live storefront, `saveSettings`) actually expects. Some
 * rows are also "partially migrated": a single settings save landed before this fix, so they have both the
 * old flat fields AND a `formData` key that only contains whatever was saved that one time. Rather than
 * backfill the database, fold any stray top-level fields into `formData` on every read (formData's own
 * values win on conflict, since they reflect the most recent explicit save) so every shape behaves the same.
 */
function normalizeCustomization(parsed: Record<string, any>): Record<string, any> {
  const { templateId, formData, ...rest } = parsed;
  const mergedFormData = { ...rest, ...(formData && typeof formData === 'object' ? formData : {}) };
  return { ...(templateId ? { templateId } : {}), formData: mergedFormData };
}

/** Parsed `customization` JSON for a tenant (cached for an hour, invalidated on save). */
export async function getCustomization(tenantId: string): Promise<Record<string, any>> {
  const raw = await fetchWithCache<string | null>(
    `tenant_settings:${tenantId}`,
    async () => {
      const { data } = await db
        .from('tenant_settings')
        .select('setting_value')
        .eq('tenant_id', tenantId)
        .eq('setting_key', 'customization')
        .maybeSingle();
      return data?.setting_value ?? null;
    },
    3600,
  );
  if (!raw) return {};
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return parsed && typeof parsed === 'object' ? normalizeCustomization(parsed) : {};
  } catch {
    return {};
  }
}

/**
 * Merchant-configured manual payment methods (UPI / netbanking / COD) and the details shoppers should pay
 * to for each. This is a display-only honor-system flow (see store orders/checkout) - there is no gateway
 * integration, so nothing here is a secret; it's exactly what the merchant wants shown at checkout.
 * Cached for an hour, invalidated on save, same as `getCustomization`.
 */
export interface PaymentMethodsSettings {
  cod: { enabled: boolean };
  upi: { enabled: boolean; upiId: string };
  netbanking: { enabled: boolean; bankName: string; accountName: string; accountNumber: string; ifscCode: string };
}

export const DEFAULT_PAYMENT_METHODS: PaymentMethodsSettings = {
  cod: { enabled: true },
  upi: { enabled: true, upiId: '' },
  netbanking: { enabled: true, bankName: '', accountName: '', accountNumber: '', ifscCode: '' },
};

export async function getPaymentMethodsSettings(tenantId: string): Promise<PaymentMethodsSettings> {
  const raw = await fetchWithCache<string | null>(
    `payment_methods:${tenantId}`,
    async () => {
      const { data } = await db
        .from('tenant_settings')
        .select('setting_value')
        .eq('tenant_id', tenantId)
        .eq('setting_key', 'payment_methods')
        .maybeSingle();
      return data?.setting_value ?? null;
    },
    3600,
  );
  if (!raw) return DEFAULT_PAYMENT_METHODS;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== 'object') return DEFAULT_PAYMENT_METHODS;
    return {
      cod: { enabled: parsed.cod?.enabled !== false },
      upi: { enabled: parsed.upi?.enabled !== false, upiId: typeof parsed.upi?.upiId === 'string' ? parsed.upi.upiId : '' },
      netbanking: {
        enabled: parsed.netbanking?.enabled !== false,
        bankName: typeof parsed.netbanking?.bankName === 'string' ? parsed.netbanking.bankName : '',
        accountName: typeof parsed.netbanking?.accountName === 'string' ? parsed.netbanking.accountName : '',
        accountNumber: typeof parsed.netbanking?.accountNumber === 'string' ? parsed.netbanking.accountNumber : '',
        ifscCode: typeof parsed.netbanking?.ifscCode === 'string' ? parsed.netbanking.ifscCode : '',
      },
    };
  } catch {
    return DEFAULT_PAYMENT_METHODS;
  }
}

/** Only what a shopper should see: enabled methods, and never an empty/unconfigured detail field. */
export function publicPaymentMethods(settings: PaymentMethodsSettings) {
  const result: Record<string, Record<string, unknown>> = {};
  if (settings.cod.enabled) result.cod = { enabled: true };
  if (settings.upi.enabled) result.upi = { enabled: true, ...(settings.upi.upiId ? { upiId: settings.upi.upiId } : {}) };
  if (settings.netbanking.enabled) {
    const { enabled: _enabled, ...details } = settings.netbanking;
    const present = Object.fromEntries(Object.entries(details).filter(([, v]) => v));
    result.netbanking = { enabled: true, ...present };
  }
  return result;
}

export async function invalidateTenantCache(
  tenantId: string,
  extra: { keys?: Array<string | null | undefined> } = {},
) {
  const keys = [`tenant_settings:${tenantId}`, `tenant_products:${tenantId}`, `delivery:${tenantId}`, `payment_methods:${tenantId}`, `checkout_settings:${tenantId}`];
  for (const k of extra.keys ?? []) if (k) keys.push(`tenant:${k}`);
  await kvDel(...keys).catch((error) => console.warn('[cache] invalidate failed', error));
}
