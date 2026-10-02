"use client";

import { motion } from "framer-motion";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

import { useCurrency } from "@/components/dashboard/CurrencyProvider";

type RevenueChartProps = {
  data: { name: string; revenue: number }[];
  totalRevenue: number;
};

export function RevenueChart({ data, totalRevenue }: RevenueChartProps) {
  const { formatCurrency, currencySymbol } = useCurrency();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="bg-surface rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04),_0_8px_24px_rgba(0,0,0,0.06)] border border-black/[0.03] col-span-1 lg:col-span-2 h-[400px] flex flex-col"
    >
      <div className="mb-6">
        <h3 className="text-secondary font-body text-sm mb-1">Total Revenue</h3>
        <p className="font-heading text-3xl text-primary">{formatCurrency(totalRevenue)}</p>
      </div>
      
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF4D00" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#FF4D00" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.04)" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6B6B6B', fontSize: 12, fontFamily: 'var(--font-body)' }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6B6B6B', fontSize: 12, fontFamily: 'var(--font-body)' }}
              tickFormatter={(value) => `${currencySymbol}${value/1000}k`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#FFFFFF', 
                borderRadius: '12px',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                fontFamily: 'var(--font-body)'
              }}
              itemStyle={{ color: '#0A0A0A', fontWeight: 500 }}
              cursor={{ stroke: '#FF4D00', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="#FF4D00" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorRevenue)" 
              animationDuration={1500}
              animationEasing="ease-in-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
