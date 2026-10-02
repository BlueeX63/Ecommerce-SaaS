"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart3, Bot, Globe, Check, Store } from "lucide-react";
import { fetchPlanCatalog, formatRupees, type PlanCatalog } from "@/lib/plans";
import type { MerchantContext } from "@/lib/api";
import { BillingSkeleton } from "@/components/dashboard/SettingsSkeleton";

const ADDON_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  advanced_analytics: BarChart3,
  ai_tools: Bot,
  custom_domain: Globe,
};

export default function BillingSettingsPage() {
  const router = useRouter();
  const [catalog, setCatalog] = useState<PlanCatalog | null>(null);
  const [context, setContext] = useState<MerchantContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchPlanCatalog(),
      fetch("/api/v1/auth/context").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([catalogData, contextData]) => {
        setCatalog(catalogData);
        setContext(contextData);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // The subscription's actual billing cadence isn't stored anywhere yet (see migrations), so rather than
  // silently assume one, the merchant picks it explicitly before buying an add-on.
  const [isAnnual, setIsAnnual] = useState(true);

  const buyAddon = (addonId: string) => {
    if (!context?.plan) return;
    const nextAddons = new Set(context.featureFlags);
    nextAddons.add(addonId);
    router.push(`/checkout/${context.plan.id}?addons=${[...nextAddons].join(",")}&annual=${isAnnual}`);
  };

  if (isLoading) {
    return <BillingSkeleton />;
  }

  const activePlan = context?.plan;
  const ownedAddons = catalog?.addons.filter((a) => context?.featureFlags.includes(a.id)) ?? [];
  const availableAddons = catalog?.addons.filter((a) => !context?.featureFlags.includes(a.id)) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-primary mb-1">Billing & Subscription</h2>
        <p className="text-secondary text-sm">Manage your plan, add-ons, and payment method.</p>
      </div>

      {!activePlan ? (
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="font-semibold text-primary mb-1">No active subscription</p>
          <p className="text-sm text-secondary mb-4">Subscribe to a plan to create and run stores.</p>
          <Link href="/pricing" className="inline-block px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors text-sm font-medium">
            View Plans
          </Link>
        </div>
      ) : (
        <div className="p-6 bg-black/[0.02] border border-black/[0.08] rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-primary mb-1">{activePlan.name} Plan</h3>
              <p className="text-sm text-secondary">Up to {activePlan.maxStores} store{activePlan.maxStores === 1 ? "" : "s"}.</p>
            </div>
          </div>
          <Link
            href={`/onboarding/configure?tier=${activePlan.id}&addons=${context?.featureFlags.join(",")}`}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors text-sm font-medium shrink-0"
          >
            Change Plan
          </Link>
        </div>
      )}

      {activePlan && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-primary">Add-ons</h3>
            <div className="flex items-center gap-2 bg-black/[0.04] rounded-full p-1">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${!isAnnual ? "bg-black text-white" : "text-secondary"}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${isAnnual ? "bg-black text-white" : "text-secondary"}`}
              >
                Annual
              </button>
            </div>
          </div>

          {ownedAddons.length > 0 && (
            <div className="space-y-3 mb-6">
              {ownedAddons.map((addon) => {
                const Icon = ADDON_ICONS[addon.id] ?? Check;
                return (
                  <div key={addon.id} className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-primary">{addon.name}</p>
                      <p className="text-xs text-secondary">{addon.description}</p>
                    </div>
                    <Check className="w-5 h-5 text-green-600 shrink-0" />
                  </div>
                );
              })}
            </div>
          )}

          {availableAddons.length > 0 && (
            <div className="space-y-3">
              {availableAddons.map((addon) => {
                const Icon = ADDON_ICONS[addon.id] ?? Check;
                return (
                  <div key={addon.id} className="p-4 bg-white border border-black/10 rounded-xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-black/5 text-primary/60 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-primary">{addon.name}</p>
                      <p className="text-xs text-secondary">{addon.description}</p>
                    </div>
                    <button
                      onClick={() => buyAddon(addon.id)}
                      className="px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors text-sm font-medium shrink-0"
                    >
                      Add for ₹{formatRupees(isAnnual ? addon.priceAnnual : addon.priceMonthly)}/mo
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
