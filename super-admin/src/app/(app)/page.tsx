"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Store, CreditCard, TrendingUp, Users, ArrowUpRight } from "lucide-react";
import { Skeleton, StatCardSkeleton } from "@/components/Skeleton";

interface Overview {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  totalCustomers: number;
  newTenantsLast30Days: number;
  activeSubscriptions: number;
  planBreakdown: { id: string; name: string; count: number }[];
  estimatedMrr: number;
  totalGmv: number;
  recentActivity: { action: string; actorEmail: string; timestamp: string; tenantId: string; details?: Record<string, unknown> }[];
}

function formatRupees(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-surface border border-black/10 rounded-lg p-5">
      <div className="flex items-center gap-2 text-secondary mb-3">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="font-heading text-2xl text-primary">{value}</p>
    </div>
  );
}

const ACTION_LABELS: Record<string, string> = {
  SUSPEND_TENANT: "Suspended store",
  REACTIVATE_TENANT: "Reactivated store",
  CHANGE_PLAN: "Changed plan",
  REVOKE_SESSIONS: "Revoked sessions",
  UPDATE_TEAM_MEMBER_STATUS: "Updated team member",
  DELETE_TENANT: "Deleted store",
  IMPERSONATE_START: "Signed in as owner",
};

export default function SuperAdminOverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/super-admin/overview")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || !data) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-heading text-2xl text-primary mb-1">Overview</h1>
          <p className="text-sm text-secondary">Platform-wide activity across every store.</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-surface border border-black/10 rounded-lg p-5">
            <Skeleton className="h-4 w-14 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1.5">
                    <Skeleton className="h-3.5 w-20" />
                    <Skeleton className="h-3.5 w-6" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-sm" />
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-black/10 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3.5 w-10" />
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-surface border border-black/10 rounded-lg p-5">
            <Skeleton className="h-4 w-44 mb-4" />
            <div className="divide-y divide-black/5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2.5">
                  <Skeleton className="h-3.5 w-48" />
                  <Skeleton className="h-3.5 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl text-primary mb-1">Overview</h1>
        <p className="text-sm text-secondary">Platform-wide activity across every store.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Store className="w-4 h-4" />} label="Stores" value={`${data.activeTenants}/${data.totalTenants}`} />
        <StatCard icon={<CreditCard className="w-4 h-4" />} label="Active subscriptions" value={String(data.activeSubscriptions)} />
        <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Est. MRR" value={formatRupees(data.estimatedMrr)} />
        <StatCard icon={<Users className="w-4 h-4" />} label="Total customers" value={String(data.totalCustomers)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-surface border border-black/10 rounded-lg p-5">
          <h2 className="text-sm font-medium text-primary mb-4">Plans</h2>
          <div className="space-y-3">
            {data.planBreakdown.map((p) => {
              const pct = data.activeSubscriptions ? Math.round((p.count / data.activeSubscriptions) * 100) : 0;
              return (
                <div key={p.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-primary">{p.name}</span>
                    <span className="text-secondary">{p.count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/5 rounded-sm overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 pt-4 border-t border-black/10 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-secondary">New stores (30d)</span>
              <span className="text-primary font-medium">{data.newTenantsLast30Days}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Suspended</span>
              <span className="text-primary font-medium">{data.suspendedTenants}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Total GMV</span>
              <span className="text-primary font-medium">{formatRupees(data.totalGmv)}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-surface border border-black/10 rounded-lg p-5">
          <h2 className="text-sm font-medium text-primary mb-4">Recent super admin activity</h2>
          {data.recentActivity.length === 0 ? (
            <p className="text-sm text-secondary py-8 text-center">No actions taken yet.</p>
          ) : (
            <div className="divide-y divide-black/5">
              {data.recentActivity.map((entry, i) => (
                <Link
                  key={i}
                  href={`/tenants/${entry.tenantId}`}
                  className="flex items-center justify-between py-2.5 text-sm hover:bg-black/[0.02] -mx-2 px-2 rounded-md transition-colors group"
                >
                  <div>
                    <span className="text-primary">{ACTION_LABELS[entry.action] ?? entry.action}</span>
                    <span className="text-secondary"> &middot; {entry.actorEmail}</span>
                  </div>
                  <div className="flex items-center gap-2 text-secondary">
                    <span className="text-xs">{new Date(entry.timestamp).toLocaleString()}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
