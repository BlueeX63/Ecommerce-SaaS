"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DataCardProps {
  title: string;
  value: string;
  trend?: string;
  isPositive?: boolean;
  icon: ReactNode;
  className?: string;
  delay?: number;
}

export function DataCard({ title, value, trend, isPositive, icon, className, delay = 0 }: DataCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(0,0,0,0.08)" }}
      className={cn(
        "bg-surface rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04),_0_8px_24px_rgba(0,0,0,0.06)] border border-black/[0.03] transition-all duration-300 group",
        className
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-background rounded-xl text-secondary group-hover:text-accent group-hover:bg-accent/5 transition-colors">
          {icon}
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-medium font-body px-2.5 py-1 rounded-full",
            isPositive ? "bg-[#00C896]/10 text-[#00C896]" : "bg-red-500/10 text-red-500"
          )}>
            {isPositive ? "+" : ""}{trend}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-secondary font-body text-sm mb-1">{title}</h3>
        <p className="font-heading text-3xl text-primary">{value}</p>
      </div>
    </motion.div>
  );
}
