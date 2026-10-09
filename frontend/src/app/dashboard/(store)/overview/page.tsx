"use client";

import Link from "next/link";
import { DataCard } from "@/components/dashboard/DataCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { DollarSign, ShoppingBag, Users, Package, ExternalLink, BarChart3, Lock, TrendingUp, UserPlus, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useCurrency } from "@/components/dashboard/CurrencyProvider";

import { DashboardPageSkeleton } from "@/components/dashboard/Skeletons";
interface AdvancedMetrics {
  averageOrderValue: number;
  newCustomersLast30Days: number;
  trend30d: Array<{ date: string; revenue: number }>;
  topProducts: Array<{ name: string; revenue: number; unitsSold: number }>;
}

interface Tenant {
  code: string;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  amount: number;
  date: string;
}

export default function DashboardOverview() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [metrics, setMetrics] = useState<{
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    chartData: { name: string; revenue: number }[];
    recentOrders: RecentOrder[];
    advanced?: AdvancedMetrics;
  }>({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    chartData: [],
    recentOrders: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/tenant/me").then((res) => res.json()),
      fetch("/api/v1/tenant/metrics").then((res) => res.json()),
    ])
      .then(([tenantData, metricsData]) => {
        if (tenantData.tenant) setTenant(tenantData.tenant);
        if (!metricsData.error) setMetrics(metricsData);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const storeUrl = (() => {
    if (!tenant) return null;
    const isLocalhost = typeof window !== "undefined" && window.location.hostname.includes("localhost");
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || (isLocalhost ? "localhost:3000" : "your-saas.com");
    const protocol = isLocalhost ? "http://" : "https://";
    return `${protocol}${tenant.code}.${rootDomain}`;
  })();

  if (isLoading) {
    return <DashboardPageSkeleton />;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="font-heading text-3xl text-primary mb-1">Overview</h1>
          <p className="font-body text-secondary">Here&apos;s what&apos;s happening with your store today.</p>
        </div>
        {storeUrl && (
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF4D00]/10 text-[#FF4D00] rounded-xl font-accent text-xs font-bold uppercase tracking-widest hover:bg-[#FF4D00] hover:text-white transition-colors"
          >
            Visit Live Store <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <DataCard
          title="Total Revenue"
          value={formatCurrency(metrics.totalRevenue)}
          trend="Live"
          isPositive={true}
          icon={<DollarSign className="w-5 h-5" />}
          delay={0.1}
        />
        <DataCard
          title="Total Orders"
          value={metrics.totalOrders.toString()}
          trend="Live"
          isPositive={true}
          icon={<ShoppingBag className="w-5 h-5" />}
          delay={0.2}
        />
        <DataCard
          title="Total Customers"
          value={metrics.totalCustomers.toString()}
          trend="Live"
          isPositive={true}
          icon={<Users className="w-5 h-5" />}
          delay={0.3}
        />
        <DataCard
          title="Total Products"
          value={metrics.totalProducts.toString()}
          trend="Live"
          isPositive={true}
          icon={<Package className="w-5 h-5" />}
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <RevenueChart data={metrics.chartData} totalRevenue={metrics.totalRevenue} />

        {/* Recent Orders (Right column) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="bg-surface rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04),_0_8px_24px_rgba(0,0,0,0.06)] border border-black/[0.03] col-span-1 h-[400px] flex flex-col"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-heading text-xl text-primary">Recent Orders</h3>
            <Link href="/dashboard/orders" className="text-sm font-body text-accent hover:text-primary transition-colors">View All</Link>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {metrics.recentOrders.length === 0 ? (
              <div className="flex items-center justify-center h-full text-secondary font-body text-sm">
                No orders yet.
              </div>
            ) : (
              metrics.recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/dashboard/orders/${order.id}`}
                  className="flex justify-between items-center p-3 rounded-xl hover:bg-background transition-colors group cursor-pointer border border-transparent hover:border-black/[0.03]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-black/[0.03] flex items-center justify-center font-accent text-sm text-secondary group-hover:bg-white group-hover:shadow-sm transition-all">
                      #{order.orderNumber.substring(order.orderNumber.length - 4)}
                    </div>
                    <div>
                      <p className="font-body text-sm font-medium text-primary group-hover:text-accent transition-colors">{order.customerName}</p>
                      <p className="font-body text-xs text-secondary">{new Date(order.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className="font-accent text-sm font-medium text-primary">{formatCurrency(order.amount)}</p>
                </Link>
              ))
            )}
          </div>
        </motion.div>
      </div>

      <AdvancedAnalyticsSection advanced={metrics.advanced} formatCurrency={formatCurrency} />
    </div>
  );
}

function AdvancedAnalyticsSection({
  advanced,
  formatCurrency,
}: {
  advanced?: AdvancedMetrics;
  formatCurrency: (amount: number) => string;
}) {
  if (!advanced) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mt-6 bg-surface rounded-2xl p-8 border border-dashed border-black/[0.08] flex items-center justify-between gap-6 flex-wrap"
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-black/[0.04] text-secondary flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading text-lg text-primary">Advanced Analytics</h3>
            <p className="font-body text-sm text-secondary">Average order value, 30-day trend and your top products.</p>
          </div>
        </div>
        <Link
          href="/dashboard/settings/billing"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-lg hover:bg-black/90 transition-colors text-sm font-medium shrink-0"
        >
          <BarChart3 className="w-4 h-4" /> Unlock
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      <div className="bg-surface rounded-2xl p-6 border border-black/[0.03] shadow-[0_1px_3px_rgba(0,0,0,0.04),_0_8px_24px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#FF4D00]/10 text-[#FF4D00] flex items-center justify-center"><TrendingUp className="w-5 h-5" /></div>
          <h3 className="font-heading text-lg text-primary">Average Order Value</h3>
        </div>
        <p className="font-heading text-3xl text-primary">{formatCurrency(advanced.averageOrderValue)}</p>
      </div>

      <div className="bg-surface rounded-2xl p-6 border border-black/[0.03] shadow-[0_1px_3px_rgba(0,0,0,0.04),_0_8px_24px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#FF4D00]/10 text-[#FF4D00] flex items-center justify-center"><UserPlus className="w-5 h-5" /></div>
          <h3 className="font-heading text-lg text-primary">New Customers (30d)</h3>
        </div>
        <p className="font-heading text-3xl text-primary">{advanced.newCustomersLast30Days}</p>
      </div>

      <div className="bg-surface rounded-2xl p-6 border border-black/[0.03] shadow-[0_1px_3px_rgba(0,0,0,0.04),_0_8px_24px_rgba(0,0,0,0.06)]">
        <h3 className="font-heading text-lg text-primary mb-4">Top Products</h3>
        {advanced.topProducts.length === 0 ? (
          <p className="font-body text-sm text-secondary">No sales yet.</p>
        ) : (
          <div className="space-y-3">
            {advanced.topProducts.map((product) => (
              <div key={product.name} className="flex justify-between items-center text-sm">
                <span className="text-primary font-medium truncate pr-2">{product.name}</span>
                <span className="text-secondary shrink-0">{formatCurrency(product.revenue)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
