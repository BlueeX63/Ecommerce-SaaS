"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Store, BarChart3, Bot, Globe, Check, ArrowRight, Loader2, AlertTriangle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { fetchPlanCatalog, type FeatureAddon } from "@/lib/plans";
import type { MerchantContext } from "@/lib/api";

const ADDON_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  advanced_analytics: BarChart3,
  ai_tools: Bot,
  custom_domain: Globe,
};

type Phase = "confirming" | "ready" | "failed";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [phase, setPhase] = useState<Phase>("confirming");
  const [context, setContext] = useState<MerchantContext | null>(null);
  const [addonCatalog, setAddonCatalog] = useState<FeatureAddon[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      // Activate the subscription right away instead of waiting for the Stripe webhook to arrive.
      if (sessionId?.startsWith("cs_")) {
        await fetch("/api/v1/billing/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        }).catch(() => null);
      }

      const [contextRes, catalog] = await Promise.all([
        fetch("/api/v1/auth/context").then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetchPlanCatalog().catch(() => null),
      ]);

      if (cancelled) return;
      if (contextRes?.subscriptionActive) {
        setContext(contextRes);
        setAddonCatalog(catalog?.addons ?? []);
        setPhase("ready");
      } else {
        setPhase("failed");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (phase === "confirming") {
    return (
      <Screen>
        <PulseIcon color="green">
          <CheckCircle2 className="w-10 h-10" />
        </PulseIcon>
        <h1 className="font-heading text-4xl md:text-5xl uppercase tracking-tighter text-white mb-4">
          Payment <span className="text-green-500">Secured.</span>
        </h1>
        <p className="text-white/50 mb-12 text-lg max-w-[320px] leading-relaxed">Activating your subscription...</p>
        <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
      </Screen>
    );
  }

  if (phase === "failed") {
    return (
      <Screen>
        <PulseIcon color="amber">
          <AlertTriangle className="w-10 h-10" />
        </PulseIcon>
        <h1 className="font-heading text-4xl md:text-5xl uppercase tracking-tighter text-white mb-4">
          Almost <span className="text-amber-500">There.</span>
        </h1>
        <p className="text-white/50 mb-12 text-lg max-w-[360px] leading-relaxed">
          We couldn&apos;t confirm your payment yet. If you completed checkout, this usually resolves within a minute -
          refresh, or check your dashboard shortly.
        </p>
        <Link
          href="/dashboard"
          className="px-8 py-4 rounded-2xl bg-white/10 border border-white/10 text-white font-accent font-bold uppercase tracking-widest text-xs hover:bg-white/20 transition-colors"
        >
          Go to Dashboard
        </Link>
      </Screen>
    );
  }

  const hasStore = !!context?.hasStore || (context?.stores.length ?? 0) > 0;
  const purchasedAddons = addonCatalog.filter((a) => context?.featureFlags.includes(a.id));

  return (
    <Screen wide>
      <PulseIcon color="green">
        <CheckCircle2 className="w-10 h-10" />
      </PulseIcon>
      <h1 className="font-heading text-4xl md:text-5xl uppercase tracking-tighter text-white mb-4 text-center">
        You&apos;re <span className="text-green-500">All Set.</span>
      </h1>
      <p className="text-white/50 mb-10 text-lg max-w-md leading-relaxed text-center">
        Here&apos;s everything included in your {context?.plan?.name} plan.
      </p>

      <div className="w-full max-w-md bg-white/[0.02] border border-white/10 rounded-3xl p-6 mb-10 space-y-4 text-left">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#FF4D00]/10 border border-[#FF4D00]/30 flex items-center justify-center shrink-0 text-[#FF4D00]">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <p className="font-heading text-white/90">Up to {context?.plan?.maxStores} store{context?.plan?.maxStores === 1 ? "" : "s"}</p>
            <p className="text-xs text-white/40">Every template, full dashboard, unlimited products.</p>
          </div>
        </div>

        {purchasedAddons.map((addon) => {
          const Icon = ADDON_ICONS[addon.id] ?? Check;
          return (
            <div key={addon.id} className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#FF4D00]/10 border border-[#FF4D00]/30 flex items-center justify-center shrink-0 text-[#FF4D00]">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-heading text-white/90">{addon.name}</p>
                <p className="text-xs text-white/40 leading-relaxed">{addon.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {hasStore ? (
        <>
          <p className="text-white/50 mb-8 text-sm max-w-sm leading-relaxed text-center">
            Your upgrade is already active on your existing store{(context?.stores.length ?? 0) > 1 ? "s" : ""} — nothing else to set up.
          </p>
          <Link
            href="/dashboard/overview"
            className="group relative flex items-center gap-3 py-5 px-10 rounded-2xl bg-[#FF4D00] text-white overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,77,0,0.3)] hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="relative z-10 font-accent font-bold uppercase tracking-widest text-sm">Go to Dashboard</span>
            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
          </Link>
        </>
      ) : (
        <Link
          href="/onboarding/template-selection"
          className="group relative flex items-center gap-3 py-5 px-10 rounded-2xl bg-[#FF4D00] text-white overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,77,0,0.3)] hover:scale-[1.02] active:scale-[0.98]"
        >
          <span className="relative z-10 font-accent font-bold uppercase tracking-widest text-sm">Create Your Store</span>
          <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}
    </Screen>
  );
}

function Screen({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden font-body">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-green-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`${wide ? "max-w-lg" : "max-w-md"} w-full relative z-10 flex flex-col items-center text-center`}
      >
        {children}
      </motion.div>
    </div>
  );
}

function PulseIcon({ children, color }: { children: React.ReactNode; color: "green" | "amber" }) {
  const palette = color === "green" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400";
  const glow = color === "green" ? "bg-green-500/20" : "bg-amber-500/20";
  return (
    <div className="relative mb-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
        className={`w-24 h-24 rounded-full flex items-center justify-center relative z-10 border ${palette}`}
      >
        {children}
      </motion.div>
      <motion.div
        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute inset-0 rounded-full z-0 ${glow}`}
      />
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
