import { fetchWithCache, kvDel } from '../lib/kv.js';
import { db } from '../lib/supabase.js';
import { FEATURE_ADDONS, PLAN_TIERS, decodePlanId, maxStoresForPlan } from './plans.js';
import type { FeatureFlag, PlanTierId } from './plans.js';

export interface Entitlements {
  active: boolean;
  planTier: PlanTierId | null;
  planName: string | null;
  maxStores: number;
  featureFlags: FeatureFlag[];
}

const NONE: Entitlements = { active: false, planTier: null, planName: null, maxStores: 0, featureFlags: [] };
const ENTITLEMENTS_TTL_SECONDS = 30;

async function loadEntitlements(userId: string): Promise<Entitlements> {
  const { data } = await db
    .from('subscriptions')
    .select('plan_id, status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('updated_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return NONE;

  const { tier, featureFlags } = decodePlanId(data.plan_id);
  if (!tier) return NONE;

  return {
    active: true,
    planTier: tier,
    planName: PLAN_TIERS[tier].name,
    maxStores: maxStoresForPlan(tier),
    featureFlags,
  };
}

/**
 * The merchant's current entitlements, derived from their single active subscription row. This is queried on
 * nearly every dashboard request (every page checks `/auth/context`), so it's cached briefly - a plan change
 * only needs to show up within a few seconds, not on every single request. Anything that actually changes a
 * subscription calls invalidateEntitlements() below to clear this immediately rather than waiting out the TTL.
 */
export async function getEntitlements(userId: string): Promise<Entitlements> {
  return fetchWithCache(`entitlements:${userId}`, () => loadEntitlements(userId), ENTITLEMENTS_TTL_SECONDS);
}

export async function invalidateEntitlements(userId: string): Promise<void> {
  await kvDel(`entitlements:${userId}`);
}

export function hasFeature(entitlements: Entitlements, flag: FeatureFlag): boolean {
  return entitlements.active && entitlements.featureFlags.includes(flag);
}

/**
 * A store's entitlements, derived from its owner's subscription. For storefront-facing checks (the shopper
 * is never the merchant), where all we have is a tenant id, not the merchant's own session.
 */
export async function getStoreEntitlements(tenantId: string): Promise<Entitlements> {
  const { data: tenant } = await db.from('tenant').select('created_by').eq('tenant_id', tenantId).maybeSingle();
  if (!tenant?.created_by) return NONE;
  return getEntitlements(tenant.created_by);
}

/** Human-readable reason shown by the frontend's upgrade prompts. */
export function upgradeMessage(flag: FeatureFlag): string {
  const addon = FEATURE_ADDONS[flag];
  return `${addon.name} is a paid add-on. Upgrade your plan to unlock it.`;
}
