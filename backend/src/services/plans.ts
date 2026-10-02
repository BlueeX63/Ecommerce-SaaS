/**
 * Single source of truth for plan tiers, feature add-ons and pricing.
 *
 * Prices are in whole rupees (converted to paise for Stripe at the point of use) and are intentionally
 * gathered in one place — tune them here and both the API (`GET /api/v1/billing/plans`) and the Stripe
 * checkout session pick up the change immediately. The frontend never invents its own numbers; it always
 * renders whatever this module (via the API) reports, and the backend always recomputes the total from here
 * before charging anything — a client can never set its own price.
 */

export type PlanTierId = 'basic' | 'intermediate' | 'professional';
export type FeatureFlag = 'advanced_analytics' | 'ai_tools' | 'custom_domain' | 'online_payments';

export interface PlanTier {
  id: PlanTierId;
  name: string;
  tagline: string;
  maxStores: number;
  /** Rupees per month, billed monthly. */
  priceMonthly: number;
  /** Rupees per month, billed annually (already discounted). */
  priceAnnual: number;
}

export interface FeatureAddon {
  id: FeatureFlag;
  name: string;
  description: string;
  priceMonthly: number;
  priceAnnual: number;
}

export const PLAN_TIERS: Record<PlanTierId, PlanTier> = {
  basic: {
    id: 'basic',
    name: 'Basic',
    tagline: 'For a single brand finding its footing.',
    maxStores: 3,
    priceMonthly: 1999,
    priceAnnual: 1599,
  },
  intermediate: {
    id: 'intermediate',
    name: 'Intermediate',
    tagline: 'For growing catalogs and multiple storefronts.',
    maxStores: 5,
    priceMonthly: 3999,
    priceAnnual: 3199,
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    tagline: 'For teams running a full portfolio of stores.',
    maxStores: 10,
    priceMonthly: 6999,
    priceAnnual: 5599,
  },
};

export const FEATURE_ADDONS: Record<FeatureFlag, FeatureAddon> = {
  advanced_analytics: {
    id: 'advanced_analytics',
    name: 'Advanced Analytics',
    description: 'Deeper insight into your store: top products, average order value, customer trends and a 30-day revenue view instead of 7.',
    priceMonthly: 499,
    priceAnnual: 399,
  },
  ai_tools: {
    id: 'ai_tools',
    name: 'AI Product Tools',
    description: 'AI-assisted product uploads — auto-generate a description, alt text and tags from a product’s name and category.',
    priceMonthly: 799,
    priceAnnual: 639,
  },
  custom_domain: {
    id: 'custom_domain',
    name: 'Custom Domain',
    description: 'Connect your own domain (e.g. www.yourbrand.com) instead of a monolith subdomain.',
    priceMonthly: 599,
    priceAnnual: 479,
  },
  online_payments: {
    id: 'online_payments',
    name: 'Online Payment Integration',
    description: 'Let shoppers pay by UPI and netbanking at checkout, not just Cash on Delivery.',
    priceMonthly: 899,
    priceAnnual: 719,
  },
};

/** Plan ids used before tiers existed. Old subscription rows keep working under an equivalent tier. */
const LEGACY_PLAN_ALIASES: Record<string, PlanTierId> = { pro: 'intermediate' };

export function resolvePlanTierId(planId: string | null | undefined): PlanTierId | null {
  if (!planId) return null;
  if (planId in PLAN_TIERS) return planId as PlanTierId;
  return LEGACY_PLAN_ALIASES[planId] ?? null;
}

export function isValidPlanTier(id: string): id is PlanTierId {
  return id in PLAN_TIERS;
}

export function isValidFeatureFlag(id: string): id is FeatureFlag {
  return id in FEATURE_ADDONS;
}

/** De-duplicates and drops anything that isn't a known add-on id. */
export function sanitizeFeatureFlags(ids: readonly string[]): FeatureFlag[] {
  return [...new Set(ids)].filter(isValidFeatureFlag);
}

// ---------------------------------------------------------------------------------------------
// `subscriptions.plan_id` encoding
//
// Add-ons are encoded into the existing `plan_id` text column as "<tier>:<addon1>,<addon2>,..." instead of
// a new column, so purchased add-ons work against the current schema with no migration required. A bare
// tier id (or the legacy "pro") is still valid and decodes to zero add-ons.
// ---------------------------------------------------------------------------------------------

const TIER_ADDON_SEPARATOR = ':';
const ADDON_LIST_SEPARATOR = ',';

export function encodePlanId(tier: PlanTierId, featureFlags: readonly string[]): string {
  const flags = sanitizeFeatureFlags(featureFlags);
  return flags.length ? `${tier}${TIER_ADDON_SEPARATOR}${flags.join(ADDON_LIST_SEPARATOR)}` : tier;
}

export interface DecodedPlan {
  tier: PlanTierId | null;
  featureFlags: FeatureFlag[];
}

export function decodePlanId(raw: string | null | undefined): DecodedPlan {
  if (!raw) return { tier: null, featureFlags: [] };
  const [tierPart, addonsPart] = raw.split(TIER_ADDON_SEPARATOR);
  return {
    tier: resolvePlanTierId(tierPart),
    featureFlags: addonsPart ? sanitizeFeatureFlags(addonsPart.split(ADDON_LIST_SEPARATOR)) : [],
  };
}

export interface PriceBreakdown {
  planTier: PlanTierId;
  isAnnual: boolean;
  /** Rupees per month. */
  planMonthly: number;
  addons: Array<{ id: FeatureFlag; name: string; monthly: number }>;
  addonsMonthly: number;
  /** Rupees per month, plan + add-ons. */
  totalMonthly: number;
  /** What is actually charged today: one month, or twelve months up front. */
  dueTodayRupees: number;
  /** `dueTodayRupees` converted to paise, for Stripe. */
  dueTodayPaise: number;
}

/** Computes the authoritative price for a plan tier + a set of add-ons. Never trust a client-sent amount. */
export function computePrice(planTier: PlanTierId, featureFlags: readonly string[], isAnnual: boolean): PriceBreakdown {
  const tier = PLAN_TIERS[planTier];
  const flags = sanitizeFeatureFlags(featureFlags);

  const planMonthly = isAnnual ? tier.priceAnnual : tier.priceMonthly;
  const addons = flags.map((id) => {
    const addon = FEATURE_ADDONS[id];
    return { id, name: addon.name, monthly: isAnnual ? addon.priceAnnual : addon.priceMonthly };
  });
  const addonsMonthly = addons.reduce((sum, a) => sum + a.monthly, 0);
  const totalMonthly = planMonthly + addonsMonthly;
  const dueTodayRupees = isAnnual ? totalMonthly * 12 : totalMonthly;

  return {
    planTier,
    isAnnual,
    planMonthly,
    addons,
    addonsMonthly,
    totalMonthly,
    dueTodayRupees,
    dueTodayPaise: Math.round(dueTodayRupees * 100),
  };
}

export function maxStoresForPlan(planTier: PlanTierId | null): number {
  // No recognised active plan: block store creation rather than guessing a default.
  return planTier ? PLAN_TIERS[planTier].maxStores : 0;
}
