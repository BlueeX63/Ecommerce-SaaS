"use client";

import React from "react";
import { Inter, Oswald } from "next/font/google";
import { motion } from "framer-motion";
import { LogOut, Package, Settings, CreditCard, Hexagon } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });
const oswald = Oswald({ subsets: ["latin"] });

export default function ObsidianProfilePage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white pt-40 pb-20 px-6 md:px-12">
      <div className="max-w-[1200px] mx-auto">
        
        <header className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          >
            <span className={`flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] font-bold text-white/40 mb-6 ${inter.className}`}>
              <Hexagon className="w-3 h-3 fill-white/40" /> OPERATIVE_PROFILE
            </span>
            <h1 className={`text-5xl md:text-7xl font-bold uppercase tracking-widest ${oswald.className} mb-4`}>
              ALEX VANCE
            </h1>
            <p className={`text-xs text-white/60 uppercase tracking-[0.2em] font-bold ${inter.className}`}>
              STATUS: ACTIVE // ID: 8492-Omega
            </p>
          </motion.div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          <div className="md:col-span-4 lg:col-span-3 space-y-2">
            {[
              { icon: Package, label: "ACQUISITIONS", active: true },
              { icon: CreditCard, label: "PAYMENT_DATA", active: false },
              { icon: Settings, label: "CONFIG", active: false },
              { icon: LogOut, label: "DISCONNECT", active: false },
            ].map((item, i) => (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                className={`w-full flex items-center gap-4 p-5 border text-left transition-all ${
                  item.active 
                    ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]" 
                    : "bg-[#111] border-white/10 text-white/60 hover:border-white/30 hover:bg-[#1a1a1a] hover:text-white"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className={`text-[10px] font-bold uppercase tracking-[0.3em] ${inter.className}`}>
                  {item.label}
                </span>
              </motion.button>
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="md:col-span-8 lg:col-span-9 bg-[#111] border border-white/10 p-8 md:p-12"
          >
            <h2 className={`text-2xl font-bold uppercase tracking-widest mb-10 ${oswald.className}`}>
              RECENT ACQUISITIONS
            </h2>
            
            <div className="space-y-6">
              {[
                { id: "ORD-993-X", date: "2026.10.15", status: "DISPATCHED", item: "PRIME // V1", price: "$950.00" },
                { id: "ORD-842-Y", date: "2026.08.22", status: "DELIVERED", item: "CORE // V2", price: "$850.00" },
              ].map((order, i) => (
                <div key={order.id} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-6 border border-white/5 bg-[#0a0a0a]">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-sm font-bold uppercase tracking-widest ${oswald.className}`}>{order.id}</span>
                      <span className={`px-2 py-1 text-[8px] uppercase tracking-[0.2em] font-bold ${
                        order.status === 'DELIVERED' ? 'bg-white/10 text-white' : 'bg-white text-black'
                      } ${inter.className}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className={`text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold ${inter.className}`}>
                      {order.date} // {order.item}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 w-full md:w-auto">
                    <span className={`text-lg font-bold tracking-widest ${oswald.className}`}>{order.price}</span>
                    <button className={`px-4 py-2 border border-white/20 text-[9px] uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-black transition-colors ${inter.className}`}>
                      VIEW LOG
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </motion.div>
        </div>

      </div>
    </div>
  );
}
