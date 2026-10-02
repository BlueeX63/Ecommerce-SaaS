import { randomBytes } from 'node:crypto';
import { resolveTxt } from 'node:dns/promises';
import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { db } from '../lib/supabase.js';
import { ApiError, badRequest, notFound, parse, uuid } from '../lib/http.js';
import { limit } from '../lib/rate-limit.js';
import { normalizeDomain, sanitizeCustomization } from '../lib/sanitize.js';
import { assertTenantOwner, requireMerchant, tenantCtx } from '../middleware/auth.js';
import { getEntitlements, hasFeature, upgradeMessage } from '../services/entitlements.js';
import { getCustomization, invalidateTenantCache } from '../services/tenants.js';
import { MAX_CUSTOMIZATION_BYTES, TEMPLATE_IDS } from '../services/templates.js';

export const dashboardRouter = Router();
dashboardRouter.use(requireMerchant);

const VERIFY_HOST_PREFIX = '_monolith-verify';
const PENDING_DOMAIN_KEY = 'custom_domain_pending';

// Shares the same cache (and invalidation-on-save) as the public storefront's customization lookup.
const readCustomization = getCustomization;

async function readPendingDomain(tenantId: string): Promise<{ domain: string; token: string } | null> {
  const { data } = await db
    .from('tenant_settings')
    .select('setting_value')
    .eq('tenant_id', tenantId)
    .eq('setting_key', PENDING_DOMAIN_KEY)
    .maybeSingle();
  if (!data?.setting_value) return null;
  try {
    return JSON.parse(data.setting_value);
  } catch {
    return null;
  }
}

async function clearPendingDomain(tenantId: string) {
  await db.from('tenant_settings').delete().eq('tenant_id', tenantId).eq('setting_key', PENDING_DOMAIN_KEY);
}

function verificationInstructions(pending: { domain: string; token: string }) {
  return {
    domain: pending.domain,
    type: 'TXT',
    host: `${VERIFY_HOST_PREFIX}.${pending.domain}`,
    value: pending.token,
    message: `Add a TXT record for ${VERIFY_HOST_PREFIX}.${pending.domain} with the value shown, point the domain to this platform, then save again to verify.`,
  };
}

async function domainOwnershipVerified(domain: string, token: string): Promise<boolean> {
  try {
    const records = await resolveTxt(`${VERIFY_HOST_PREFIX}.${domain}`);
    return records.some((chunks) => chunks.join('').trim() === token);
  } catch {
    return false;
  }
}

/**
 * Applies a requested custom domain. The domain only becomes active once the merchant has proven control of
 * it with a DNS TXT record - otherwise anyone could claim a hostname that a third party points at the platform.
 */
async function applyCustomDomain(tenantId: string, userId: string, requested: string, current: string | null) {
  await assertTenantOwner(tenantId, userId);

  if (requested.trim() === '') {
    if (current) {
      await db.from('tenant').update({ custom_domain: null }).eq('tenant_id', tenantId);
      await invalidateTenantCache(tenantId, { keys: [current] });
    }
    await clearPendingDomain(tenantId);
    return { active: null as string | null, pending: null };
  }

  const domain = normalizeDomain(requested);
  if (!domain) throw badRequest('Please enter a valid domain name (for example www.example.com).');

  const root = env.ROOT_DOMAIN?.toLowerCase();
  if (root && (domain === root || domain.endsWith(`.${root}`))) {
    throw badRequest('Domains under the platform domain cannot be used as a custom domain.');
  }

  if (domain === current) {
    // Re-saving the domain that's already active is a no-op, allowed even if the plan was since downgraded
    // (an existing connection is grandfathered; only connecting a NEW domain requires the entitlement below).
    await clearPendingDomain(tenantId);
    return { active: current, pending: null };
  }

  // Custom domains are a paid add-on; clearing one back to the platform subdomain is always allowed (above),
  // but connecting a new/different one requires the entitlement.
  const entitlements = await getEntitlements(userId);
  if (!hasFeature(entitlements, 'custom_domain')) {
    throw new ApiError(403, upgradeMessage('custom_domain'), undefined, 'UPGRADE_REQUIRED');
  }

  const { data: taken } = await db
    .from('tenant')
    .select('tenant_id')
    .eq('custom_domain', domain)
    .neq('tenant_id', tenantId)
    .maybeSingle();
  if (taken) throw new ApiError(409, 'This domain is already connected to another store.');

  let pending = await readPendingDomain(tenantId);
  if (!pending || pending.domain !== domain) {
    pending = { domain, token: `monolith-site-verification=${randomBytes(16).toString('hex')}` };
    await db.from('tenant_settings').upsert(
      { tenant_id: tenantId, setting_key: PENDING_DOMAIN_KEY, setting_value: JSON.stringify(pending) },
      { onConflict: 'tenant_id,setting_key' },
    );
  }

  if (!(await domainOwnershipVerified(domain, pending.token))) {
    return { active: current, pending };
  }

  const { error } = await db.from('tenant').update({ custom_domain: domain }).eq('tenant_id', tenantId);
  if (error?.code === '23505') throw new ApiError(409, 'This domain is already connected to another store.');
  if (error) throw error;

  await clearPendingDomain(tenantId);
  await invalidateTenantCache(tenantId, { keys: [current, domain] });
  return { active: domain, pending: null };
}

dashboardRouter.get('/settings', async (req, res) => {
  const { tenantId } = tenantCtx(req);

  const customization = await readCustomization(tenantId);
  const { data: tenant } = await db.from('tenant').select('custom_domain').eq('tenant_id', tenantId).maybeSingle();
  const pending = await readPendingDomain(tenantId);

  // Show the active domain, or the pending one so that clients which round-trip formData keep it pending.
  const shownDomain = tenant?.custom_domain ?? pending?.domain;
  if (shownDomain) {
    customization.formData = { ...(customization.formData ?? {}), customDomain: shownDomain };
  }
  if (pending) {
    res.json({ ...customization, customDomainVerification: verificationInstructions(pending) });
    return;
  }
  res.json(customization);
});

const settingsSchema = z.object({
  formData: z.record(z.string(), z.unknown()).optional(),
  templateId: z.enum(TEMPLATE_IDS).optional(),
});

dashboardRouter.post('/settings', limit('settings', 60, 10 * 60_000, (req) => req.merchant?.userId), async (req, res) => {
  const { tenantId, userId } = tenantCtx(req);
  const body = parse(settingsSchema, req.body);

  if (JSON.stringify(body).length > MAX_CUSTOMIZATION_BYTES) throw badRequest('Settings payload is too large');

  const existing = await readCustomization(tenantId);
  const { data: tenant } = await db.from('tenant').select('custom_domain').eq('tenant_id', tenantId).maybeSingle();
  if (!tenant) throw notFound('Store not found');

  const incoming = sanitizeCustomization(body.formData ?? {});
  const { customDomain, ...formRest } = incoming as Record<string, unknown>;

  let pending: { domain: string; token: string } | null = null;
  let activeDomain = tenant.custom_domain as string | null;
  if (typeof customDomain === 'string') {
    const result = await applyCustomDomain(tenantId, userId, customDomain, activeDomain);
    activeDomain = result.active;
    pending = result.pending;
  }

  const next = {
    ...existing,
    ...(body.templateId ? { templateId: body.templateId } : {}),
    formData: { ...(existing.formData ?? {}), ...formRest },
  };
  delete next.formData.customDomain;

  const { error } = await db.from('tenant_settings').upsert(
    { tenant_id: tenantId, setting_key: 'customization', setting_value: JSON.stringify(next) },
    { onConflict: 'tenant_id,setting_key' },
  );
  if (error) {
    console.error('[settings] failed to save', error);
    throw new ApiError(500, 'Failed to save settings');
  }

  await invalidateTenantCache(tenantId);

  const response: Record<string, unknown> = {
    ...next,
    formData: { ...next.formData, ...(activeDomain || pending ? { customDomain: activeDomain ?? pending?.domain } : {}) },
  };
  if (pending) response.customDomainVerification = verificationInstructions(pending);
  res.json(response);
});

// ---------------------------------------------------------------------------------------------
// Delivery options
// ---------------------------------------------------------------------------------------------

const deliveryFields = {
  name: z.string().trim().min(1).max(100),
  price: z.coerce.number().min(0).max(1_000_000),
  estimated_days: z.string().trim().max(50).optional().nullable(),
};

dashboardRouter.get('/delivery-options', async (req, res) => {
  const { tenantId } = tenantCtx(req);
  const { data, error } = await db
    .from('delivery_options')
    .select('delivery_option_id, name, price, estimated_days, is_active, created_date')
    .eq('tenant_id', tenantId)
    .order('created_date', { ascending: false });
  if (error) throw error;
  res.json(data ?? []);
});

dashboardRouter.post('/delivery-options', async (req, res) => {
  const { tenantId, userId } = tenantCtx(req);
  const body = parse(z.object(deliveryFields), req.body);

  const { data, error } = await db
    .from('delivery_options')
    .insert({
      tenant_id: tenantId,
      name: body.name,
      price: body.price,
      estimated_days: body.estimated_days || null,
      created_by: userId,
    })
    .select('delivery_option_id, name, price, estimated_days, is_active, created_date')
    .single();
  if (error) throw error;
  res.status(201).json(data);
});

dashboardRouter.patch('/delivery-options/:id', async (req, res) => {
  const { tenantId } = tenantCtx(req);
  const id = uuid(req.params.id);
  const body = parse(
    z.object({
      name: deliveryFields.name.optional(),
      price: deliveryFields.price.optional(),
      estimated_days: deliveryFields.estimated_days,
      is_active: z.boolean().optional(),
    }),
    req.body,
  );

  const update: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) if (value !== undefined) update[key] = value;
  if (Object.keys(update).length === 0) throw badRequest('Nothing to update');

  const { data, error } = await db
    .from('delivery_options')
    .update(update)
    .eq('delivery_option_id', id)
    .eq('tenant_id', tenantId)
    .select('delivery_option_id, name, price, estimated_days, is_active, created_date')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound('Delivery option not found');
  res.json(data);
});

dashboardRouter.delete('/delivery-options/:id', async (req, res) => {
  const { tenantId } = tenantCtx(req);
  const id = uuid(req.params.id);
  const { error } = await db.from('delivery_options').delete().eq('delivery_option_id', id).eq('tenant_id', tenantId);
  if (error) throw error;
  res.json({ success: true });
});
