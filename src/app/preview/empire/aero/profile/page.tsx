"use client";

import React, { useState } from 'react';
import { Inter, Space_Grotesk, Syne } from 'next/font/google';
import { User, MapPin, Package, CreditCard, LogOut, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const inter = Inter({ subsets: ['latin'] });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] });
const syne = Syne({ subsets: ['latin'] });

const TABS = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'orders', label: 'Order History', icon: Package },
  { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
  { id: 'payment', label: 'Payment Methods', icon: CreditCard },
];

export default function AeroProfilePage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="bg-[#f5f5f5] min-h-screen pt-40 pb-32 px-6 md:px-12 text-black overflow-hidden relative selection:bg-black selection:text-white">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-black/[0.03] to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1400px] mx-auto relative z-10">
        <header className="mb-24">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className={`text-6xl md:text-[100px] font-bold tracking-tighter uppercase mb-4 leading-none ${spaceGrotesk.className}`}
          >
            Client <span className="text-black/30 italic font-light">Profile.</span>
          </motion.h1>
        </header>

        <div className="flex flex-col lg:flex-row gap-16 lg:gap-32">
          
          {/* Interactive Navigation Sidebar */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:w-1/4 shrink-0 relative"
          >
            <div className="sticky top-40 flex flex-col gap-2">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative w-full flex items-center justify-between px-8 py-6 text-left group overflow-hidden rounded-2xl transition-colors duration-500 ${isActive ? 'text-white' : 'text-black/60 hover:text-black hover:bg-black/5'}`}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="active-tab"
                        className="absolute inset-0 bg-black rounded-2xl"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-4">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-black/40 group-hover:text-black transition-colors'}`} />
                      <span className={`text-[10px] md:text-xs font-bold uppercase tracking-widest ${spaceGrotesk.className}`}>
                        {tab.label}
                      </span>
                    </span>
                    <ChevronRight className={`relative z-10 w-4 h-4 transition-transform duration-500 ${isActive ? 'opacity-100 translate-x-0 text-white' : 'opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                  </button>
                );
              })}
              
              <div className="h-[1px] w-full bg-black/10 my-4" />
              
              <button className="w-full flex items-center justify-between px-8 py-6 text-left group rounded-2xl text-red-500 hover:bg-red-50 transition-colors">
                <span className="flex items-center gap-4">
                  <LogOut className="w-5 h-5" />
                  <span className={`text-[10px] md:text-xs font-bold uppercase tracking-widest ${spaceGrotesk.className}`}>
                    Sign Out
                  </span>
                </span>
              </button>
            </div>
          </motion.div>

          {/* Dynamic Content Area */}
          <div className="lg:w-3/4 min-h-[60vh] relative">
            <AnimatePresence mode="wait">
              
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-12"
                >
                  <div className="bg-white rounded-[3rem] p-12 shadow-[0_20px_40px_rgba(0,0,0,0.02)] border border-black/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#f5f5f5] rounded-bl-[100%] z-0" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8 mb-16">
                      <div className="w-32 h-32 bg-black rounded-full flex items-center justify-center shadow-2xl">
                        <span className={`text-3xl text-white font-bold tracking-tighter uppercase ${syne.className}`}>A</span>
                      </div>
                      <div>
                        <h2 className={`text-4xl font-bold uppercase tracking-tighter text-black mb-2 ${spaceGrotesk.className}`}>Client 001</h2>
                        <p className={`text-sm text-black/50 font-medium ${inter.className}`}>Member since October 2026</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                      <div className="p-8 bg-[#f5f5f5] rounded-3xl group hover:bg-black transition-colors duration-500 cursor-pointer">
                        <Package className="w-6 h-6 mb-8 text-black group-hover:text-white transition-colors" />
                        <span className={`block text-[10px] uppercase tracking-widest font-bold text-black/40 group-hover:text-white/60 mb-2 ${spaceGrotesk.className}`}>Total Orders</span>
                        <span className={`text-4xl font-bold tracking-tighter text-black group-hover:text-white transition-colors ${syne.className}`}>02</span>
                      </div>
                      <div className="p-8 bg-[#f5f5f5] rounded-3xl group hover:bg-black transition-colors duration-500 cursor-pointer">
                        <MapPin className="w-6 h-6 mb-8 text-black group-hover:text-white transition-colors" />
                        <span className={`block text-[10px] uppercase tracking-widest font-bold text-black/40 group-hover:text-white/60 mb-2 ${spaceGrotesk.className}`}>Addresses</span>
                        <span className={`text-4xl font-bold tracking-tighter text-black group-hover:text-white transition-colors ${syne.className}`}>01</span>
                      </div>
                      <div className="p-8 bg-[#f5f5f5] rounded-3xl group hover:bg-black transition-colors duration-500 cursor-pointer">
                        <CreditCard className="w-6 h-6 mb-8 text-black group-hover:text-white transition-colors" />
                        <span className={`block text-[10px] uppercase tracking-widest font-bold text-black/40 group-hover:text-white/60 mb-2 ${spaceGrotesk.className}`}>Cards</span>
                        <span className={`text-4xl font-bold tracking-tighter text-black group-hover:text-white transition-colors ${syne.className}`}>01</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'orders' && (
                <motion.div
                  key="orders"
                  initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-6"
                >
                  <h3 className={`text-2xl font-bold uppercase tracking-tighter mb-8 ${spaceGrotesk.className}`}>Recent Acquisitions</h3>
                  
                  {[
                    { id: "AERO-9938", date: "Oct 24, 2026", status: "Delivered", price: "€850.00", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80" },
                    { id: "AERO-8821", date: "Sep 12, 2026", status: "Delivered", price: "€1200.00", img: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&q=80" }
                  ].map((order, i) => (
                    <motion.div 
                      key={order.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className="bg-white rounded-[2rem] p-6 shadow-sm border border-black/5 flex flex-col md:flex-row items-center gap-8 group hover:shadow-xl transition-shadow duration-500 cursor-pointer"
                    >
                      <div className="w-full md:w-32 h-32 rounded-xl bg-[#f5f5f5] overflow-hidden shrink-0">
                        <img src={order.img} alt={order.id} className="w-full h-full object-cover mix-blend-multiply group-hover:scale-110 transition-transform duration-700" />
                      </div>
                      <div className="flex-1 flex flex-col md:flex-row justify-between w-full">
                        <div className="space-y-2">
                          <span className={`text-[9px] font-bold uppercase tracking-widest text-black/40 ${spaceGrotesk.className}`}>Order #{order.id}</span>
                          <h4 className={`text-xl font-bold tracking-tighter uppercase ${syne.className}`}>{order.date}</h4>
                          <span className="inline-block px-3 py-1 bg-[#f5f5f5] text-[9px] font-bold uppercase tracking-widest rounded-full">{order.status}</span>
                        </div>
                        <div className="mt-6 md:mt-0 md:text-right flex flex-col justify-between">
                          <span className={`text-2xl font-bold tracking-tighter ${syne.className}`}>{order.price}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-widest text-black/40 group-hover:text-black transition-colors ${spaceGrotesk.className} underline underline-offset-4`}>View Details</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'addresses' && (
                <motion.div
                  key="addresses"
                  initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="flex justify-between items-end mb-8">
                    <h3 className={`text-2xl font-bold uppercase tracking-tighter ${spaceGrotesk.className}`}>Addresses</h3>
                    <button className={`text-[10px] font-bold uppercase tracking-widest underline underline-offset-4 hover:text-black/50 transition-colors ${spaceGrotesk.className}`}>Add New</button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-[2rem] p-10 border-2 border-black relative overflow-hidden group cursor-pointer">
                      <div className="absolute top-6 right-6 px-3 py-1 bg-black text-white text-[9px] font-bold uppercase tracking-widest rounded-full">Default</div>
                      <h4 className={`text-lg font-bold uppercase tracking-tighter mb-4 ${syne.className}`}>Home</h4>
                      <p className={`text-sm text-black/60 leading-relaxed font-medium mb-8 ${inter.className}`}>
                        Client 001<br/>
                        123 Luxury Ave, Penthouse 4<br/>
                        Paris, Île-de-France 75008<br/>
                        France
                      </p>
                      <div className="flex gap-6">
                        <button className={`text-[9px] font-bold uppercase tracking-widest underline underline-offset-4 text-black/40 hover:text-black transition-colors ${spaceGrotesk.className}`}>Edit</button>
                        <button className={`text-[9px] font-bold uppercase tracking-widest underline underline-offset-4 text-red-400 hover:text-red-600 transition-colors ${spaceGrotesk.className}`}>Remove</button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'payment' && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="flex justify-between items-end mb-8">
                    <h3 className={`text-2xl font-bold uppercase tracking-tighter ${spaceGrotesk.className}`}>Payment Methods</h3>
                    <button className={`text-[10px] font-bold uppercase tracking-widest underline underline-offset-4 hover:text-black/50 transition-colors ${spaceGrotesk.className}`}>Add New</button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-tr from-black to-neutral-800 rounded-[2rem] p-10 text-white relative overflow-hidden shadow-2xl transform transition-transform hover:-translate-y-2 cursor-pointer">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
                      <div className="relative z-10 flex flex-col h-full justify-between gap-12">
                        <div className="flex justify-between items-start">
                          <CreditCard className="w-8 h-8 text-white/50" />
                          <div className="px-3 py-1 bg-white/10 backdrop-blur-sm text-[9px] font-bold uppercase tracking-widest rounded-full">Default</div>
                        </div>
                        <div>
                          <p className={`text-[10px] font-medium tracking-[0.4em] text-white/60 mb-2 ${spaceGrotesk.className}`}>•••• •••• •••• 4242</p>
                          <div className="flex justify-between items-end">
                            <h4 className={`text-lg font-bold uppercase tracking-widest ${syne.className}`}>Client 001</h4>
                            <span className={`text-[10px] tracking-widest font-bold ${spaceGrotesk.className}`}>12/28</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
