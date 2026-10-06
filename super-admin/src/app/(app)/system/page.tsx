"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Skeleton, PanelSkeleton } from "@/components/Skeleton";

interface SystemStatus {
  environment: string;
  rootDomain: string | null;
  integrations: Record<string, boolean>;
  devFlags: Record<string, boolean>;
}

const INTEGRATION_LABELS: Record<string, string> = {
  stripe: "Stripe (billing)",
  stripeWebhook: "Stripe webhook signing",
  redis: "Upstash Redis (cache / rate limits)",
  cloudinary: "Cloudinary (image uploads)",
  smtp: "SMTP (transactional email)",
  firebase: "Firebase (shopper phone verification)",
};

const FLAG_LABELS: Record<string, string> = {
  allowDummyOtp: "Dummy OTP bypass",
  allowMockSubscribe: "Mock subscribe endpoint",
};

function Row({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-primary">{label}</span>
      {ok ? (
        <span className="flex items-center gap-1.5 text-xs font-medium text-green-700">
          <CheckCircle2 className="w-3.5 h-3.5" /> Configured
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-xs font-medium text-secondary">
          <XCircle className="w-3.5 h-3.5" /> Not configured
        </span>
      )}
    </div>
  );
}

export default function SystemStatusPage() {
  const [data, setData] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/super-admin/system-status")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl text-primary mb-1">System status</h1>
          <p className="text-sm text-secondary">Which integrations the backend has configured. Never shows secret values.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface border border-black/10 rounded-lg p-5">
            <Skeleton className="h-3 w-24 mb-2" />
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="bg-surface border border-black/10 rounded-lg p-5">
            <Skeleton className="h-3 w-24 mb-2" />
            <Skeleton className="h-6 w-28" />
          </div>
        </div>
        <PanelSkeleton lines={6} />
        <PanelSkeleton lines={2} />
      </div>
    );
  }

  const devFlagsOn = Object.values(data.devFlags).some(Boolean);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-primary mb-1">System status</h1>
        <p className="text-sm text-secondary">Which integrations the backend has configured. Never shows secret values.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface border border-black/10 rounded-lg p-5">
          <p className="text-xs text-secondary uppercase tracking-wide mb-1">Environment</p>
          <p className="font-heading text-xl text-primary capitalize">{data.environment}</p>
        </div>
        <div className="bg-surface border border-black/10 rounded-lg p-5">
          <p className="text-xs text-secondary uppercase tracking-wide mb-1">Root domain</p>
          <p className="font-heading text-xl text-primary">{data.rootDomain ?? "Not set"}</p>
        </div>
      </div>

      <div className="bg-surface border border-black/10 rounded-lg p-5">
        <h2 className="text-sm font-medium text-primary mb-1">Integrations</h2>
        <div className="divide-y divide-black/5">
          {Object.entries(data.integrations).map(([key, ok]) => (
            <Row key={key} label={INTEGRATION_LABELS[key] ?? key} ok={ok} />
          ))}
        </div>
      </div>

      <div className="bg-surface border border-black/10 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-sm font-medium text-primary">Development flags</h2>
          {devFlagsOn && data.environment !== "production" && (
            <span className="flex items-center gap-1 text-xs text-amber-700">
              <AlertTriangle className="w-3.5 h-3.5" /> Must be off before deploying
            </span>
          )}
        </div>
        <div className="divide-y divide-black/5">
          {Object.entries(data.devFlags).map(([key, ok]) => (
            <Row key={key} label={FLAG_LABELS[key] ?? key} ok={ok} />
          ))}
        </div>
      </div>
    </div>
  );
}
