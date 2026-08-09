"use client";

import { DataCard } from "@/components/dashboard/DataCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { DollarSign, ShoppingBag, Users, Package, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useCurrency } from "@/components/dashboard/CurrencyProvider";

export default function DashboardOverview() {
  const [tenant, setTenant] = useState<any>(null);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    chartData: [],
    recentOrders: []
  });
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    fetch("/api/v1/tenant/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.tenant) setTenant(data.tenant);
      });

    fetch("/api/v1/tenant/metrics")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setMetrics(data);
        }
      });
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="font-heading text-3xl text-primary mb-1">Overview</h1>
          <p className="font-body text-secondary">Here's what's happening with your store today.</p>
        </div>
        {tenant && (
          <a
            href={`http://${tenant.code}.localhost:3000`}
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
            <button className="text-sm font-body text-accent hover:text-primary transition-colors">View All</button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {metrics.recentOrders.length === 0 ? (
              <div className="flex items-center justify-center h-full text-secondary font-body text-sm">
                No orders yet.
              </div>
            ) : (
              metrics.recentOrders.map((order: any, i: number) => (
                <div key={order.id} className="flex justify-between items-center p-3 rounded-xl hover:bg-background transition-colors group cursor-pointer border border-transparent hover:border-black/[0.03]">
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
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
