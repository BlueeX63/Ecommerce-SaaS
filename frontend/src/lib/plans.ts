export interface PlanTier {
  id: string;
  name: string;
  tagline: string;
  maxStores: number;
  /** Rupees per month, billed monthly. */
  priceMonthly: number;
  /** Rupees per month, billed annually (already discounted). */
  priceAnnual: number;
}

export interface FeatureAddon {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceAnnual: number;
}

export interface PlanCatalog {
  tiers: PlanTier[];
  addons: FeatureAddon[];
}

/**
 * Fetches the plan/add-on catalog from the backend — the only place prices live. This is display data only:
 * the backend recomputes and charges the authoritative total itself when a checkout session is created, so a
 * stale or tampered client-side catalog can never change what someone actually pays.
 */
export async function fetchPlanCatalog(): Promise<PlanCatalog> {
  const res = await fetch('/api/v1/billing/plans', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load plans');
  return res.json();
}

export interface PriceBreakdown {
  tier: PlanTier;
  addons: Array<FeatureAddon & { monthly: number }>;
  planMonthly: number;
  addonsMonthly: number;
  totalMonthly: number;
  dueTodayRupees: number;
}

/** Mirrors the backend's computePrice() purely for display while the merchant is configuring their plan. */
export function computeTotal(catalog: PlanCatalog, tierId: string, addonIds: string[], isAnnual: boolean): PriceBreakdown | null {
  const tier = catalog.tiers.find((t) => t.id === tierId);
  if (!tier) return null;

  const addons = catalog.addons
    .filter((a) => addonIds.includes(a.id))
    .map((a) => ({ ...a, monthly: isAnnual ? a.priceAnnual : a.priceMonthly }));

  const planMonthly = isAnnual ? tier.priceAnnual : tier.priceMonthly;
  const addonsMonthly = addons.reduce((sum, a) => sum + a.monthly, 0);
  const totalMonthly = planMonthly + addonsMonthly;

  return {
    tier,
    addons,
    planMonthly,
    addonsMonthly,
    totalMonthly,
    dueTodayRupees: isAnnual ? totalMonthly * 12 : totalMonthly,
  };
}

export function formatRupees(amount: number): string {
  return amount.toLocaleString('en-IN');
}
