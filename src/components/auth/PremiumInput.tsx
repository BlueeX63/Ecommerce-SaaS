"use client";

import { motion } from "framer-motion";
import { useState } from "react";

export function PremiumInput({
  label,
  type = "text",
  value,
  onChange,
  autoComplete
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: string;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const isActive = isFocused || value.length > 0;

  return (
    <div className="relative w-full pt-4 pb-2 group">
      <input
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoComplete={autoComplete}
        className="w-full bg-transparent border-none outline-none text-[#111111] font-medium text-lg peer relative z-10 py-1 cursor-text"
        placeholder=""
      />
      <label
        className={`absolute left-0 top-6 font-medium transition-all duration-300 pointer-events-none z-0 ${
          isActive 
            ? "-translate-y-6 text-xs text-[#111111]/50 font-bold tracking-widest uppercase font-accent" 
            : "text-[#111111]/40 text-lg"
        }`}
      >
        {label}
      </label>
      
      {/* Base border */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-black/10" />
      
      {/* Animated focus border */}
      <motion.div 
        initial={{ scaleX: 0 }}
        animate={{ scaleX: isFocused ? 1 : 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-0 left-0 w-full h-[2px] bg-black origin-left"
      />
    </div>
  );
}
