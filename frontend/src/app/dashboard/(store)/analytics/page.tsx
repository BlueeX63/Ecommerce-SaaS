"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DollarSign, ShoppingBag, TrendingUp, UserPlus, Lock, BarChart3, Loader2 } from "lucide-react";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { useCurrency } from "@/components/dashboard/CurrencyProvider";

import { DashboardPageSkeleton } from "@/components/dashboard/Skeletons";
type Range = "7d" | "30d" | "90d";

interface Analytics {
  range: Range;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  newCustomers: number;
  revenueTrend: { name: string; revenue: number }[];
  statusBreakdown: { status: string; count: number }[];
  topProducts: { name: string; revenue: number; unitsSold: number }[];
  topCustomers: { name: string; revenue: number; orders: number }[];
}

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-gray-400",
  PROCESSING: "bg-blue-400",
  SHIPPED: "bg-indigo-400",
  DELIVERED: "bg-green-500",
  CANCELLED: "bg-red-400",
  REFUNDED: "bg-red-300",
  RETURN_REQUESTED: "bg-amber-400",
};

export default function AnalyticsPage() {
  const { formatCurrency } = useCurrency();
  const [range, setRange] = useState<Range>("30d");
  const [data, setData] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (r: Range) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/tenant/analytics?range=${r}`);
      if (res.status === 403) {
        setIsLocked(true);
        setData(null);
        return;
      }
      const json = await res.json();
      if (res.ok) {
        setIsLocked(false);
        setData(json);
      } else {
        setError(json.error || "Failed to load analytics");
      }
    } catch {
      setError("Failed to load analytics. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(range);
  }, [range, fetchAnalytics]);

  if (isLocked) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="font-heading text-3xl text-primary mb-1">Analytics</h1>
        <p className="text-secondary text-sm mb-8">Deep insights into your store&apos;s performance.</p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-surface rounded-2xl p-12 border border-dashed border-black/[0.08] flex flex-col items-center text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-black/[0.04] text-secondary flex items-center justify-center mb-6">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-heading text-xl text-primary mb-2">Advanced Analytics is a paid add-on</h2>
          <p className="text-secondary text-sm max-w-md mb-8">
            Unlock revenue trends, order breakdowns, top products, and top customers over any time range.
          </p>
          <Link href="/dashboard/settings/billing" className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-black/90 transition-colors text-sm font-medium">
            <BarChart3 className="w-4 h-4" /> Unlock Advanced Analytics
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-3xl text-primary mb-1">Analytics</h1>
          <p className="text-secondary text-sm">Deep insights into your store&apos;s performance.</p>
        </div>
        <div className="flex items-center gap-2 bg-black/[0.04] rounded-full p-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${range === opt.value ? "bg-black text-white" : "text-secondary hover:text-primary"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">{error}</div>}

      {isLoading || !data ? (
        <DashboardPageSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={<DollarSign className="w-5 h-5" />} title="Total Revenue" value={formatCurrency(data.totalRevenue)} />
            <StatCard icon={<ShoppingBag className="w-5 h-5" />} title="Total Orders" value={data.totalOrders.toString()} />
            <StatCard icon={<TrendingUp className="w-5 h-5" />} title="Average Order Value" value={formatCurrency(data.averageOrderValue)} />
            <StatCard icon={<UserPlus className="w-5 h-5" />} title="New Customers" value={data.newCustomers.toString()} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <RevenueChart data={data.revenueTrend} totalRevenue={data.totalRevenue} />

            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-black/[0.03] h-[400px] flex flex-col">
              <h3 className="font-heading text-lg text-primary mb-6">Orders by Status</h3>
              {data.statusBreakdown.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-secondary text-sm">No orders in this period.</div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-4">
                  {data.statusBreakdown
                    .sort((a, b) => b.count - a.count)
                    .map((s) => {
                      const total = data.statusBreakdown.reduce((sum, x) => sum + x.count, 0);
                      const pct = total ? Math.round((s.count / total) * 100) : 0;
                      return (
                        <div key={s.status}>
                          <div className="flex justify-between text-sm mb-1.5">
                            <span className="text-primary">{s.status.replace(/_/g, " ")}</span>
                            <span className="text-secondary">{s.count}</span>
                          </div>
                          <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
                            <div className={`h-full ${STATUS_COLORS[s.status] || "bg-gray-400"}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-black/[0.03]">
              <h3 className="font-heading text-lg text-primary mb-4">Top Products</h3>
              {data.topProducts.length === 0 ? (
                <p className="text-sm text-secondary">No sales in this period.</p>
              ) : (
                <div className="space-y-3">
                  {data.topProducts.map((p) => (
                    <div key={p.name} className="flex justify-between items-center text-sm">
                      <div className="min-w-0 pr-3">
                        <p className="text-primary font-medium truncate">{p.name}</p>
                        <p className="text-xs text-secondary">{p.unitsSold} units sold</p>
                      </div>
                      <span className="text-primary font-medium shrink-0">{formatCurrency(p.revenue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-black/[0.03]">
              <h3 className="font-heading text-lg text-primary mb-4">Top Customers</h3>
              {data.topCustomers.length === 0 ? (
                <p className="text-sm text-secondary">No customers in this period.</p>
              ) : (
                <div className="space-y-3">
                  {data.topCustomers.map((c, i) => (
                    <div key={`${c.name}-${i}`} className="flex justify-between items-center text-sm">
                      <div className="min-w-0 pr-3">
                        <p className="text-primary font-medium truncate">{c.name}</p>
                        <p className="text-xs text-secondary">{c.orders} order{c.orders === 1 ? "" : "s"}</p>
                      </div>
                      <span className="text-primary font-medium shrink-0">{formatCurrency(c.revenue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <div className="bg-surface rounded-2xl p-6 border border-black/[0.03] shadow-sm">
      <div className="w-10 h-10 rounded-lg bg-[#FF4D00]/10 text-[#FF4D00] flex items-center justify-center mb-4">{icon}</div>
      <p className="text-xs text-secondary uppercase tracking-wide mb-1">{title}</p>
      <p className="font-heading text-2xl text-primary">{value}</p>
    </div>
  );
}
