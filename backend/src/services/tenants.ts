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
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export async function invalidateTenantCache(
  tenantId: string,
  extra: { keys?: Array<string | null | undefined> } = {},
) {
  const keys = [`tenant_settings:${tenantId}`, `tenant_products:${tenantId}`, `delivery:${tenantId}`];
  for (const k of extra.keys ?? []) if (k) keys.push(`tenant:${k}`);
  await kvDel(...keys).catch((error) => console.warn('[cache] invalidate failed', error));
}
