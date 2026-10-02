"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Check, Loader2, Store, BarChart3, Bot, Globe, ShieldCheck,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { fetchPlanCatalog, computeTotal, formatRupees, type PlanCatalog } from "@/lib/plans";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ADDON_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  advanced_analytics: BarChart3,
  ai_tools: Bot,
  custom_domain: Globe,
};

type Step = "tier" | "advanced_analytics" | "ai_tools" | "custom_domain" | "review";

/**
 * Feature add-on steps are driven entirely by `catalog.addons`, so adding a new paid add-on on the backend
 * (services/plans.ts) automatically gets a wizard step here — nothing to wire up on the frontend.
 */
function stepsFor(catalog: PlanCatalog | null): Step[] {
  const addonSteps = (catalog?.addons.map((a) => a.id) ?? []) as Step[];
  return ["tier", ...addonSteps, "review"];
}

export function PlanConfigurator() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [catalog, setCatalog] = useState<PlanCatalog | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isAnnual, setIsAnnual] = useState(true);
  const [tierId, setTierId] = useState<string | null>(searchParams?.get("tier") ?? null);
  const [addonIds, setAddonIds] = useState<Set<string>>(
    () => new Set((searchParams?.get("addons") ?? "").split(",").filter(Boolean)),
  );
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    fetchPlanCatalog()
      .then((data) => {
        setCatalog(data);
        setTierId((current) => current ?? data.tiers[1]?.id ?? data.tiers[0]?.id ?? null);
      })
      .catch(() => setLoadError(true));
  }, []);

  const steps = useMemo(() => stepsFor(catalog), [catalog]);
  const step = steps[stepIndex];
  const price = catalog && tierId ? computeTotal(catalog, tierId, [...addonIds], isAnnual) : null;

  const goNext = () => setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  const goBack = () => (stepIndex === 0 ? router.push("/pricing") : setStepIndex((i) => Math.max(i - 1, 0)));

  const setAddon = (id: string, enabled: boolean) => {
    setAddonIds((prev) => {
      const next = new Set(prev);
      if (enabled) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleContinueToPayment = () => {
    if (!tierId) return;
    setIsNavigating(true);
    const params = new URLSearchParams({ addons: [...addonIds].join(","), annual: String(isAnnual) });
    router.push(`/checkout/${tierId}?${params.toString()}`);
  };

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white/70 font-body">
        Couldn&apos;t load plans right now. <a href="/pricing" className="text-[#FF4D00] ml-2 underline">Back to pricing</a>
      </div>
    );
  }

  if (!catalog || !tierId) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF4D00] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-body flex flex-col relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#FF4D00]/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] bg-white/5 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />

      {/* Progress */}
      <div className="relative z-10 flex items-center justify-center gap-2 pt-10 pb-4">
        {steps.map((s, i) => (
          <div
            key={s}
            className={cn(
              "h-1.5 rounded-full transition-all duration-500",
              i === stepIndex ? "w-8 bg-[#FF4D00]" : i < stepIndex ? "w-4 bg-[#FF4D00]/50" : "w-4 bg-white/10",
            )}
          />
        ))}
      </div>

      <div className="flex-1 flex items-center justify-center px-6 pb-40">
        <div className="w-full max-w-2xl relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {step === "tier" && (
                <TierStep
                  catalog={catalog}
                  tierId={tierId}
                  onSelect={setTierId}
                  isAnnual={isAnnual}
                  onToggleAnnual={setIsAnnual}
                />
              )}
              {step !== "tier" && step !== "review" && (
                <AddonStep
                  addon={catalog.addons.find((a) => a.id === step)!}
                  isAnnual={isAnnual}
                  selected={addonIds.has(step)}
                  onSelect={(value) => setAddon(step, value)}
                />
              )}
              {step === "review" && price && <ReviewStep price={price} isAnnual={isAnnual} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Sticky footer: running total + navigation */}
      <div className="relative z-10 border-t border-white/10 bg-[#0A0A0A]/90 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-6 py-6 flex items-center justify-between gap-6">
          <button onClick={goBack} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-accent uppercase tracking-widest font-bold">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {price && (
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-accent font-bold">Estimated total</p>
              <p className="font-heading text-2xl tracking-tighter">
                ₹{formatRupees(price.totalMonthly)}<span className="text-sm text-white/40">/mo</span>
              </p>
            </div>
          )}

          {step === "review" ? (
            <button
              onClick={handleContinueToPayment}
              disabled={isNavigating}
              className="group relative flex items-center gap-3 py-4 px-8 rounded-2xl bg-[#FF4D00] text-white overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,77,0,0.3)] disabled:opacity-60"
            >
              {isNavigating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span className="font-accent font-bold uppercase tracking-widest text-xs">Continue to Payment</span>
            </button>
          ) : (
            <button
              onClick={goNext}
              className="group flex items-center gap-3 py-4 px-8 rounded-2xl bg-white text-black hover:bg-[#FF4D00] hover:text-white transition-all duration-300"
            >
              <span className="font-accent font-bold uppercase tracking-widest text-xs">Next</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function TierStep({
  catalog, tierId, onSelect, isAnnual, onToggleAnnual,
}: {
  catalog: PlanCatalog; tierId: string; onSelect: (id: string) => void; isAnnual: boolean; onToggleAnnual: (v: boolean) => void;
}) {
  return (
    <div>
      <h2 className="font-heading text-3xl md:text-4xl uppercase tracking-tighter mb-2">
        Choose Your <span className="text-[#FF4D00]">Pack.</span>
      </h2>
      <p className="text-white/50 mb-8">How many stores do you need to run?</p>

      <div className="flex items-center gap-4 mb-8 text-sm font-accent tracking-wider font-bold">
        <span className={cn("transition-colors", !isAnnual ? "text-white" : "text-white/30")}>MONTHLY</span>
        <button onClick={() => onToggleAnnual(!isAnnual)} className="w-14 h-7 rounded-full bg-white/10 relative cursor-pointer border border-white/20 hover:bg-white/20 transition-colors">
          <motion.div
            className="w-5 h-5 rounded-full bg-[#FF4D00] absolute top-[3px] left-[3px] shadow-[0_2px_8px_rgba(255,77,0,0.5)]"
            animate={{ x: isAnnual ? 28 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </button>
        <div className="flex items-center gap-2">
          <span className={cn("transition-colors", isAnnual ? "text-white" : "text-white/30")}>ANNUALLY</span>
          <span className="px-2 py-0.5 bg-[#FF4D00]/20 text-[#FF4D00] rounded text-[10px] uppercase tracking-widest border border-[#FF4D00]/30">Save 20%</span>
        </div>
      </div>

      <div className="space-y-4">
        {catalog.tiers.map((tier) => {
          const selected = tier.id === tierId;
          const price = isAnnual ? tier.priceAnnual : tier.priceMonthly;
          return (
            <button
              key={tier.id}
              onClick={() => onSelect(tier.id)}
              className={cn(
                "w-full text-left p-6 rounded-3xl border transition-all duration-300 flex items-center justify-between gap-6",
                selected ? "bg-[#FF4D00]/10 border-[#FF4D00]/40 shadow-[0_0_30px_rgba(255,77,0,0.15)]" : "bg-white/[0.02] border-white/10 hover:border-white/20",
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border", selected ? "bg-[#FF4D00]/20 border-[#FF4D00]/40 text-[#FF4D00]" : "bg-white/5 border-white/10 text-white/50")}>
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading text-xl tracking-tight">{tier.name}</h3>
                  <p className="text-sm text-white/50">{tier.tagline}</p>
                  <p className="text-xs text-white/40 mt-1 font-accent uppercase tracking-wider">Up to {tier.maxStores} store{tier.maxStores === 1 ? "" : "s"}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-heading text-2xl tracking-tighter">₹{formatRupees(price)}<span className="text-xs text-white/40">/mo</span></p>
                {selected && <Check className="w-5 h-5 text-[#FF4D00] ml-auto mt-1" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AddonStep({
  addon, isAnnual, selected, onSelect,
}: {
  addon: { id: string; name: string; description: string; priceMonthly: number; priceAnnual: number };
  isAnnual: boolean;
  selected: boolean;
  onSelect: (value: boolean) => void;
}) {
  const Icon = ADDON_ICONS[addon.id] ?? Check;
  const price = isAnnual ? addon.priceAnnual : addon.priceMonthly;

  return (
    <div>
      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8">
        <Icon className="w-7 h-7 text-[#FF4D00]" />
      </div>
      <h2 className="font-heading text-3xl md:text-4xl uppercase tracking-tighter mb-4">
        Do you want <span className="text-[#FF4D00]">{addon.name}?</span>
      </h2>
      <p className="text-white/60 text-lg leading-relaxed mb-10">{addon.description}</p>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onSelect(true)}
          className={cn(
            "p-6 rounded-2xl border text-left transition-all duration-300",
            selected ? "bg-[#FF4D00]/10 border-[#FF4D00]/40" : "bg-white/[0.02] border-white/10 hover:border-white/20",
          )}
        >
          <p className="font-accent font-bold uppercase tracking-widest text-sm mb-1">Yes, add it</p>
          <p className="text-[#FF4D00] font-heading text-lg">+₹{formatRupees(price)}/mo</p>
        </button>
        <button
          onClick={() => onSelect(false)}
          className={cn(
            "p-6 rounded-2xl border text-left transition-all duration-300",
            !selected ? "bg-white/10 border-white/30" : "bg-white/[0.02] border-white/10 hover:border-white/20",
          )}
        >
          <p className="font-accent font-bold uppercase tracking-widest text-sm mb-1">Not right now</p>
          <p className="text-white/40 text-sm">You can add this later from Billing.</p>
        </button>
      </div>
    </div>
  );
}

function ReviewStep({ price, isAnnual }: { price: NonNullable<ReturnType<typeof computeTotal>>; isAnnual: boolean }) {
  return (
    <div>
      <h2 className="font-heading text-3xl md:text-4xl uppercase tracking-tighter mb-2">
        Review Your <span className="text-[#FF4D00]">Setup.</span>
      </h2>
      <p className="text-white/50 mb-8">Here&apos;s what you&apos;re about to subscribe to.</p>

      <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 space-y-4">
        <div className="flex justify-between items-center pb-4 border-b border-white/10">
          <div>
            <p className="font-heading text-xl">{price.tier.name} Plan</p>
            <p className="text-xs text-white/40 uppercase tracking-wider font-accent">Up to {price.tier.maxStores} stores</p>
          </div>
          <p className="font-heading text-xl">₹{formatRupees(price.planMonthly)}/mo</p>
        </div>

        {price.addons.length > 0 ? (
          price.addons.map((addon) => (
            <div key={addon.id} className="flex justify-between items-center text-white/70">
              <p>{addon.name}</p>
              <p>+₹{formatRupees(addon.monthly)}/mo</p>
            </div>
          ))
        ) : (
          <p className="text-white/30 text-sm italic">No add-ons selected.</p>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-white/10">
          <div>
            <p className="font-heading uppercase tracking-widest text-sm text-white/80">Total Due Today</p>
            <p className="text-xs text-white/40">{isAnnual ? "Billed annually" : "Billed monthly"}, cancel anytime.</p>
          </div>
          <p className="font-heading text-3xl text-[#FF4D00] tracking-tighter">₹{formatRupees(price.dueTodayRupees)}</p>
        </div>
      </div>
    </div>
  );
}
