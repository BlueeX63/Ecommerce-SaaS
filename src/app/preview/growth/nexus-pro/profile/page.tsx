"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { User, Package, Heart, LogOut, Settings, ChevronRight } from "lucide-react";
import { useShop } from "../ShopContext";
import { useState } from "react";

export default function NexusProProfilePage() {
  const { orders } = useShop();
  const [activeTab, setActiveTab] = useState<"orders" | "settings">("orders");

  return (
    <div className="flex flex-col w-full bg-[#0a0a0a] text-[#ededed] pt-32 pb-32 min-h-screen">
      <section className="px-6 md:px-12 max-w-7xl mx-auto w-full mb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="text-[#d4af37] text-xs font-bold uppercase tracking-[0.3em] mb-6 block">
            My Account
          </span>
          <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9] mb-8">
            Profile.
          </h1>
        </motion.div>
      </section>

      <section className="px-6 md:px-12 max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-16">
        
        {/* Sidebar */}
        <div className="w-full lg:w-64 shrink-0 space-y-2">
          <button 
            onClick={() => setActiveTab("orders")}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-lg text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'orders' ? 'bg-[#d4af37] text-black' : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'}`}
          >
            <Package className="w-4 h-4" /> Order History
          </button>
          <button 
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-lg text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'settings' ? 'bg-[#d4af37] text-black' : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'}`}
          >
            <Settings className="w-4 h-4" /> Settings
          </button>
          <Link 
            href="/preview/growth/nexus-pro/wishlist"
            className="w-full flex items-center gap-4 px-6 py-4 rounded-lg text-sm font-bold uppercase tracking-widest bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Heart className="w-4 h-4" /> Wishlist
          </Link>
          <div className="pt-8 mt-8 border-t border-white/10">
            <button className="w-full flex items-center gap-4 px-6 py-4 rounded-lg text-sm font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-colors">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === "orders" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-8">Order History</h2>
              
              {orders.length === 0 ? (
                <div className="py-16 text-center border border-white/10 rounded-2xl bg-white/5">
                  <Package className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/50 text-sm mb-6">You haven't placed any orders yet.</p>
                  <Link 
                    href="/preview/growth/nexus-pro/products"
                    className="inline-block px-8 py-3 bg-[#d4af37] text-black font-bold uppercase tracking-widest text-xs rounded-full hover:bg-white transition-colors"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div key={order.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 lg:p-8 flex flex-col gap-6 hover:border-white/20 transition-colors">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-6 gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-lg">{order.id}</h3>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${order.status === 'Delivered' ? 'bg-green-500/20 text-green-400' : 'bg-[#d4af37]/20 text-[#d4af37]'}`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-xs text-white/50">{order.date}</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Total Amount</p>
                          <p className="font-black text-2xl">${order.total.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-16 bg-black rounded overflow-hidden">
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <p className="font-bold">{item.name}</p>
                                <p className="text-xs text-white/50">Qty: {item.quantity}</p>
                              </div>
                            </div>
                            <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                        <Link href={`/preview/growth/nexus-pro/products`} className="text-xs font-bold uppercase tracking-widest text-[#d4af37] hover:text-white transition-colors">
                          Buy Again
                        </Link>
                        <button className="text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors flex items-center gap-1">
                          View Invoice <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8 max-w-2xl"
            >
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-8">Account Settings</h2>
              
              <form className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#d4af37] border-b border-white/10 pb-2">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2 col-span-2 sm:col-span-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">First Name</label>
                      <input type="text" defaultValue="John" className="bg-white/5 border border-white/10 rounded-lg p-4 text-sm focus:outline-none focus:border-[#d4af37] text-white" />
                    </div>
                    <div className="flex flex-col gap-2 col-span-2 sm:col-span-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Last Name</label>
                      <input type="text" defaultValue="Doe" className="bg-white/5 border border-white/10 rounded-lg p-4 text-sm focus:outline-none focus:border-[#d4af37] text-white" />
                    </div>
                    <div className="flex flex-col gap-2 col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Email Address</label>
                      <input type="email" defaultValue="john@example.com" className="bg-white/5 border border-white/10 rounded-lg p-4 text-sm focus:outline-none focus:border-[#d4af37] text-white" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#d4af37] border-b border-white/10 pb-2">Password</h3>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Current Password</label>
                    <input type="password" placeholder="••••••••" className="bg-white/5 border border-white/10 rounded-lg p-4 text-sm focus:outline-none focus:border-[#d4af37] text-white" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">New Password</label>
                    <input type="password" placeholder="••••••••" className="bg-white/5 border border-white/10 rounded-lg p-4 text-sm focus:outline-none focus:border-[#d4af37] text-white" />
                  </div>
                </div>

                <button type="button" className="px-8 py-4 bg-[#d4af37] text-black font-bold uppercase tracking-widest text-xs rounded-full hover:bg-white transition-colors">
                  Save Changes
                </button>
              </form>
            </motion.div>
          )}
        </div>

      </section>
    </div>
  );
}
