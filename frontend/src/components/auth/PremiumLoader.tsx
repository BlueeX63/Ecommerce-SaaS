"use client";

import { motion } from "framer-motion";

export function PremiumLoader() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#F8F7F5]">
      <div className="relative flex flex-col items-center justify-center gap-6">
        {/* Abstract animated shapes */}
        <div className="relative w-16 h-16">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
              borderRadius: ["20%", "50%", "20%"],
            }}
            transition={{
              duration: 2,
              ease: "easeInOut",
              times: [0, 0.5, 1],
              repeat: Infinity,
            }}
            className="absolute inset-0 border border-black/20"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [360, 180, 0],
              borderRadius: ["50%", "20%", "50%"],
            }}
            transition={{
              duration: 2,
              ease: "easeInOut",
              times: [0, 0.5, 1],
              repeat: Infinity,
            }}
            className="absolute inset-0 border border-black bg-black/5 mix-blend-multiply"
          />
        </div>
        
        {/* Loading text with tracking animation */}
        <motion.div 
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="font-accent text-[10px] uppercase font-bold tracking-[0.3em] text-[#111111]"
        >
          Authenticating
        </motion.div>
      </div>
    </div>
  );
}
