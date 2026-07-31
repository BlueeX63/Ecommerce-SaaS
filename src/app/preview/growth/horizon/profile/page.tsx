"use client";

import { motion } from "framer-motion";
import { User, Package, Settings, LogOut, Download } from "lucide-react";
import Link from "next/link";
import { HORIZON_PRODUCTS } from "../HorizonContext";

export default function HorizonProfile() {
  // Use first two products as mock past orders
  const pastOrders = [
    { 
      product: HORIZON_PRODUCTS[0], 
      date: "Oct 24, 2026", 
      status: "Acquired" 
    },
    { 
      product: HORIZON_PRODUCTS[2], 
      date: "Sep 12, 2026", 
      status: "Acquired" 
    },
  ];

  return (
    <div className="bg-[#FAFAFA] min-h-screen text-[#111] pt-40 pb-32">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-24 flex flex-col items-start border-b border-black/5 pb-16"
        >
          <span className="font-outfit text-[10px] uppercase tracking-[0.4em] text-black/40 mb-6 block font-medium">
            Client Portal
          </span>
          <h1 className="font-cormorant text-5xl md:text-7xl font-light tracking-tight leading-none text-[#111] flex items-center gap-6">
            <User className="w-12 h-12 stroke-[1] text-black/20 hidden md:block" />
            Your <span className="italic font-medium">Profile</span>.
          </h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-16">
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-black/5 p-10 shadow-[0_20px_40px_rgba(0,0,0,0.02)] sticky top-40">
              <div className="w-20 h-20 rounded-full border border-black/10 mb-8 mx-auto flex items-center justify-center bg-[#FAFAFA]">
                 <span className="font-cormorant font-light italic text-4xl text-[#111]">C</span>
              </div>
              <h3 className="font-cormorant text-3xl font-light text-center mb-2">Creator</h3>
              <p className="font-outfit font-light text-black/40 text-center text-xs mb-10 tracking-wide">creator@horizon.design</p>
              
              <nav className="space-y-2 font-outfit font-medium text-[10px] uppercase tracking-[0.2em]">
                <Link href="#" className="flex items-center gap-4 p-4 bg-[#FAFAFA] text-[#111] pointer-events-auto" style={{ cursor: "none" }}>
                  <Package className="w-4 h-4 stroke-[1.5]" /> Assets Library
                </Link>
                <Link href="#" className="flex items-center gap-4 p-4 text-black/50 hover:text-[#111] hover:bg-[#FAFAFA] transition-colors pointer-events-auto" style={{ cursor: "none" }}>
                  <Settings className="w-4 h-4 stroke-[1.5]" /> Settings
                </Link>
                <Link href="#" className="flex items-center gap-4 p-4 text-red-500/50 hover:text-red-500 hover:bg-red-50 transition-colors mt-8 pointer-events-auto" style={{ cursor: "none" }}>
                  <LogOut className="w-4 h-4 stroke-[1.5]" /> Terminate Session
                </Link>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-black/5 p-12 md:p-16 shadow-[0_20px_40px_rgba(0,0,0,0.02)]">
              <h2 className="font-cormorant text-4xl font-light mb-12 pb-6 border-b border-black/5">
                Acquired Assets
              </h2>
              
              {pastOrders.length > 0 ? (
                <div className="space-y-6">
                  {pastOrders.map((order, i) => (
                    <motion.div 
                      key={order.product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className="border border-black/5 p-6 bg-[#FAFAFA] hover:bg-white transition-colors group flex flex-col md:flex-row justify-between items-start md:items-center gap-8 pointer-events-auto"
                    >
                      <div className="flex items-center gap-6">
                        {/* Small Product Picture */}
                        <div className="w-20 h-24 bg-[#F5F5F5] overflow-hidden shrink-0">
                          <img 
                            src={order.product.image} 
                            alt={order.product.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                             <h3 className="font-cormorant text-2xl font-medium text-[#111]">{order.product.name}</h3>
                             <span className="text-black/50 text-[9px] font-medium uppercase font-outfit tracking-[0.2em] border border-black/10 px-2 py-1 bg-white hidden sm:block">
                               {order.status}
                             </span>
                          </div>
                          <p className="font-outfit font-light text-black/50 text-sm">
                            Acquired on {order.date}
                          </p>
                        </div>
                      </div>
                      
                      <button 
                        className="bg-black text-white px-8 py-4 font-outfit font-medium uppercase text-[9px] tracking-[0.3em] flex items-center gap-3 hover:bg-black/80 transition-colors pointer-events-auto w-full md:w-auto justify-center"
                        style={{ cursor: "none" }}
                      >
                         <Download className="w-3 h-3 stroke-[2]" /> Retrieve Files
                      </button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-32 bg-[#FAFAFA] border border-black/5 flex flex-col items-center">
                  <Package className="w-12 h-12 stroke-[1] text-black/20 mb-8" />
                  <p className="font-cormorant text-3xl font-light text-black/60 mb-8 italic">Your library is currently empty.</p>
                  <Link 
                    href="/preview/growth/horizon/products" 
                    className="bg-black text-white px-8 py-4 font-outfit font-medium uppercase text-[10px] tracking-[0.3em] hover:bg-black/80 transition-colors pointer-events-auto"
                    style={{ cursor: "none" }}
                  >
                    Browse the Archive
                  </Link>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
