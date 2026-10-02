"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, CreditCard, Lock, ShieldCheck, CheckCircle2, Store, BarChart3, Bot, Globe, Check, FlaskConical,
} from "lucide-react";
import Link from "next/link";
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

function CheckoutContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const planId = params.planId as string;
  const addonIds = (searchParams?.get("addons") ?? "").split(",").filter(Boolean);
  const isAnnual = searchParams?.get("annual") !== "false";
  const router = useRouter();

  const [catalog, setCatalog] = useState<PlanCatalog | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    fetchPlanCatalog().then(setCatalog).catch(() => setError("Couldn't load plan details."));
  }, []);

  useEffect(() => {
    fetch("/api/v1/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data.isLoggedIn && data.user) setUser(data.user);
        else router.push(`/login?next=${encodeURIComponent(`/checkout/${planId}?${searchParams?.toString() ?? ""}`)}`);
      })
      .catch(() => setUser(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const price = catalog ? computeTotal(catalog, planId, addonIds, isAnnual) : null;

  // DEV/TEST ONLY: skips Stripe entirely and activates the subscription directly via the backend's
  // mock-subscribe endpoint (which itself refuses to run outside development). Never true in production -
  // set NEXT_PUBLIC_TEST_PAYMENTS=true locally only while iterating on the rest of the flow.
  const isTestMode = process.env.NEXT_PUBLIC_TEST_PAYMENTS === "true";

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isTestMode) {
        const res = await fetch("/api/v1/mock-subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planTier: planId, addons: addonIds }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Test payment is not enabled on the backend (set ALLOW_MOCK_SUBSCRIBE=true).");
        router.push(`/payment-success?session_id=${data.sessionId}`);
        return;
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planTier: planId, addons: addonIds, isAnnual }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  if (catalog && !price) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white">
        <div className="text-center">
          <h2 className="text-3xl font-heading mb-4">Plan not found</h2>
          <Link href="/pricing" className="text-accent hover:underline font-body">Return to pricing</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#050505] text-white flex flex-col lg:flex-row relative selection:bg-accent selection:text-white">
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="fixed top-0 left-[20%] w-[800px] h-[800px] bg-accent/5 rounded-full blur-[150px] -translate-y-1/2" />
        <div className="fixed bottom-0 right-[20%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] translate-y-1/2" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="w-full lg:w-7/12 p-8 pt-24 lg:p-16 lg:pt-32 xl:p-24 relative z-10">
        <div className="max-w-2xl mx-auto lg:mx-0">
          <Link href="/onboarding/configure" className="inline-flex items-center text-sm font-medium text-white/50 hover:text-white mb-12 transition-colors group">
            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center mr-3 group-hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </div>
            Edit selection
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
            {price && (
              <div className="inline-flex items-center px-4 py-2 rounded-full border border-accent/20 bg-accent/10 text-accent text-xs font-bold uppercase tracking-widest mb-6">
                {price.tier.name} Package
              </div>
            )}
            <h1 className="font-heading text-5xl md:text-7xl lg:text-[80px] tracking-tighter uppercase leading-[0.9] mb-6">
              Complete Your <br /><span className="text-white/40">Infrastructure.</span>
            </h1>
            <p className="font-body text-xl text-white/60 leading-relaxed mb-16 max-w-xl">
              {price?.tier.tagline}
            </p>
          </motion.div>

          {price && (
            <div className="space-y-4 mb-24">
              <h3 className="font-heading text-2xl uppercase tracking-wider text-white/80 border-b border-white/10 pb-6 mb-8">What&apos;s Included</h3>

              <div className="flex items-start gap-6 p-6 rounded-3xl border border-transparent">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-accent">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-heading text-xl md:text-2xl tracking-tight text-white/90 mb-2">Up to {price.tier.maxStores} store{price.tier.maxStores === 1 ? "" : "s"}</h4>
                  <p className="font-body text-white/50 leading-relaxed text-sm md:text-base">Every template, full dashboard access, unlimited products.</p>
                </div>
              </div>

              {price.addons.map((addon) => {
                const Icon = ADDON_ICONS[addon.id] ?? Check;
                return (
                  <div key={addon.id} className="flex items-start gap-6 p-6 rounded-3xl border border-transparent">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-accent">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-heading text-xl md:text-2xl tracking-tight text-white/90 mb-2">{addon.name}</h4>
                      <p className="font-body text-white/50 leading-relaxed text-sm md:text-base">{addon.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="w-full lg:w-5/12 bg-[#0a0a0a] border-t lg:border-t-0 lg:border-l border-white/5 relative z-20 shadow-2xl flex flex-col">
        <div className="lg:sticky lg:top-0 lg:h-screen flex flex-col justify-center p-8 lg:p-16">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }} className="w-full max-w-md mx-auto">
            <div className="mb-8 text-center lg:text-left">
              <h2 className="text-3xl font-heading uppercase tracking-wider text-white/90 mb-2">Order Summary</h2>
              <div className="h-1 w-12 bg-accent rounded-full mx-auto lg:mx-0"></div>
            </div>

            {isTestMode && (
              <div className="flex items-center gap-3 p-4 mb-8 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <FlaskConical className="w-5 h-5 shrink-0" />
                <p className="font-body text-sm leading-relaxed">
                  <span className="font-bold uppercase tracking-wider text-xs">Test Mode</span> — no Stripe redirect, no real charge. This activates your plan directly for testing.
                </p>
              </div>
            )}

            {price && (
              <div className="bg-white/[0.02] border border-white/10 rounded-[32px] p-8 mb-8 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 blur-[50px] -mr-16 -mt-16 pointer-events-none" />

                <div className="space-y-3 pb-6 border-b border-white/10 mb-6">
                  <div className="flex justify-between items-center text-white/70">
                    <span>{price.tier.name} Plan ({isAnnual ? "Yearly" : "Monthly"})</span>
                    <span>₹{formatRupees(price.planMonthly)}/mo</span>
                  </div>
                  {price.addons.map((addon) => (
                    <div key={addon.id} className="flex justify-between items-center text-white/50 text-sm">
                      <span>{addon.name}</span>
                      <span>+₹{formatRupees(addon.monthly)}/mo</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="font-heading uppercase tracking-widest text-sm text-white/80">Total Due Today</span>
                    {isAnnual && <span className="text-xs text-white/40 mt-1 block">Billed annually</span>}
                  </div>
                  <div className="flex items-end">
                    <span className="font-heading font-bold text-3xl lg:text-4xl text-accent mr-1 mb-1">₹</span>
                    <span className="font-heading font-bold text-4xl lg:text-5xl text-accent leading-none">{formatRupees(price.dueTodayRupees)}</span>
                  </div>
                </div>
              </div>
            )}

            {user ? (
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10 mb-8 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs font-accent uppercase tracking-widest text-white/40 mb-1">Authenticated as</p>
                  <p className="font-body font-medium text-white/90 truncate">{user.email}</p>
                </div>
              </div>
            ) : (
              <div className="bg-blue-500/10 rounded-2xl p-5 border border-blue-500/20 mb-8 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full" />
                </div>
                <p className="font-body font-medium text-blue-400">Verifying session...</p>
              </div>
            )}

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: "auto", y: 0 }} exit={{ opacity: 0, height: 0 }} className="mb-8 p-5 bg-red-500/10 text-red-400 text-sm rounded-2xl border border-red-500/20 flex items-start gap-3">
                  <Lock className="w-5 h-5 shrink-0" />
                  <span className="font-body leading-relaxed">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={handleCheckout}
              disabled={isLoading || !user || !price}
              className={cn(
                "w-full py-5 rounded-2xl font-accent font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden group",
                isLoading || !user || !price ? "bg-white/10 text-white/30 cursor-not-allowed" : "bg-accent text-white hover:bg-white hover:text-black hover:shadow-[0_0_40px_rgba(255,77,0,0.3)]",
              )}
            >
              {isLoading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-6 h-6 border-2 border-current border-t-transparent rounded-full" />
              ) : isTestMode ? (
                <>
                  <FlaskConical className="w-5 h-5 transition-transform group-hover:scale-110 group-hover:-rotate-6" />
                  <span className="relative z-10">Simulate Payment</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 transition-transform group-hover:scale-110 group-hover:-rotate-6" />
                  <span className="relative z-10">Proceed to Payment</span>
                </>
              )}
            </button>

            <div className="mt-8 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-white/40">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-body uppercase tracking-wider font-semibold">256-Bit Secure SSL</span>
              </div>
              <div className="flex items-center gap-2 text-white/40">
                <Lock className="w-4 h-4" />
                <span className="text-xs font-body uppercase tracking-wider font-semibold">
                  {isTestMode ? "Test Mode — No Real Charge" : "Powered by Stripe"}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
      <CheckoutContent />
    </Suspense>
  );
}
