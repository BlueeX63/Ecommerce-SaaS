"use client";

import { DataCard } from "@/components/dashboard/DataCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { DollarSign, ShoppingBag, Eye, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardOverview() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-3xl text-primary mb-1">Overview</h1>
        <p className="font-body text-secondary">Here's what's happening with your store today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <DataCard
          title="Total Revenue"
          value="$12,426.00"
          trend="12.5%"
          isPositive={true}
          icon={<DollarSign className="w-5 h-5" />}
          delay={0.1}
        />
        <DataCard
          title="Total Orders"
          value="142"
          trend="8.2%"
          isPositive={true}
          icon={<ShoppingBag className="w-5 h-5" />}
          delay={0.2}
        />
        <DataCard
          title="Store Views"
          value="8,234"
          trend="2.4%"
          isPositive={false}
          icon={<Eye className="w-5 h-5" />}
          delay={0.3}
        />
        <DataCard
          title="Conversion Rate"
          value="3.2%"
          trend="4.1%"
          isPositive={true}
          icon={<TrendingUp className="w-5 h-5" />}
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <RevenueChart />

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
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex justify-between items-center p-3 rounded-xl hover:bg-background transition-colors group cursor-pointer border border-transparent hover:border-black/[0.03]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-black/[0.03] flex items-center justify-center font-accent text-sm text-secondary group-hover:bg-white group-hover:shadow-sm transition-all">
                    #{1042 + i}
                  </div>
                  <div>
                    <p className="font-body text-sm font-medium text-primary group-hover:text-accent transition-colors">Sarah Jenkins</p>
                    <p className="font-body text-xs text-secondary">2 items</p>
                  </div>
                </div>
                <p className="font-accent text-sm font-medium text-primary">${(124.50 * i).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
