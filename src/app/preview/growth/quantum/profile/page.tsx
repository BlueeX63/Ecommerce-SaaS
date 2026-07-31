"use client";

import { motion } from "framer-motion";
import { User, Package, Settings, LogOut, ChevronRight } from "lucide-react";
import Link from "next/link";
import { QUANTUM_PRODUCTS } from "../QuantumContext";

export default function QuantumProfilePage() {
  const user = {
    name: "Alex Sterling",
    email: "alex.sterling@example.com",
    memberSince: "2024",
    status: "Visionary Level"
  };

  const menuItems = [
    { icon: <User className="w-5 h-5" />, label: "Personal Details", href: "#" },
    { icon: <Package className="w-5 h-5" />, label: "Acquisitions", href: "#" },
    { icon: <Settings className="w-5 h-5" />, label: "Preferences", href: "#" },
    { icon: <LogOut className="w-5 h-5" />, label: "Sign Out", href: "#", isDestructive: true },
  ];

  const recentOrders = [
    { id: "Q-9482", date: "Oct 12, 2026", status: "Delivered", total: 1200.00, product: QUANTUM_PRODUCTS.find(p => p.id === "q-2") },
    { id: "Q-8192", date: "Sep 04, 2026", status: "Processing", total: 450.00, product: QUANTUM_PRODUCTS.find(p => p.id === "q-1") },
  ];

  return (
    <div className="min-h-screen bg-[#F9F9FB] pt-32 pb-24 px-6 md:px-12">
      <div className="max-w-[1200px] mx-auto">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <h1 className="font-playfair text-4xl md:text-5xl font-bold text-[#121212] mb-4">Client Portal</h1>
          <p className="font-inter text-gray-500 max-w-md">
            Manage your personal gallery, track acquisitions, and customize your Quantum experience.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)]"
            >
              <div className="w-20 h-20 bg-gradient-to-tr from-[#111111] to-gray-800 rounded-full flex items-center justify-center text-white font-playfair text-3xl font-bold mb-6 shadow-inner">
                {user.name.charAt(0)}
              </div>
              <h2 className="font-playfair text-2xl font-bold text-[#121212] mb-1">{user.name}</h2>
              <p className="font-inter text-gray-500 mb-6">{user.email}</p>
              
              <div className="inline-block bg-[#111111]/10 text-[#111111] px-4 py-2 rounded-full font-inter text-xs font-bold uppercase tracking-widest">
                {user.status}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.03)]"
            >
              {menuItems.map((item, index) => (
                <Link 
                  key={index} 
                  href={item.href}
                  className={`flex items-center justify-between p-6 transition-colors border-b border-gray-50 last:border-0 group ${item.isDestructive ? 'hover:bg-red-50 text-red-500' : 'hover:bg-gray-50 text-[#121212]'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`${item.isDestructive ? 'text-red-500' : 'text-gray-400 group-hover:text-[#111111]'} transition-colors`}>
                      {item.icon}
                    </div>
                    <span className="font-inter font-medium">{item.label}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${item.isDestructive ? 'text-red-300' : 'text-gray-300 group-hover:text-[#111111]'} transition-all group-hover:translate-x-1`} />
                </Link>
              ))}
            </motion.div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-8 md:p-12 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)]"
            >
              <h3 className="font-playfair text-2xl font-bold text-[#121212] mb-8">Recent Acquisitions</h3>
              
              <div className="space-y-6">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white transition-colors hover:shadow-md hover:border-gray-200 group">
                    <div className="mb-4 sm:mb-0 flex items-center gap-4">
                      {order.product && (
                        <Link href={`/preview/growth/quantum/products/${order.product.id}`} className="block w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                          <img src={order.product.image} alt={order.product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </Link>
                      )}
                      <div>
                        <div className="font-inter text-sm text-gray-500 mb-1">{order.date} • {order.id}</div>
                        <Link href={`/preview/growth/quantum/products/${order.product?.id}`}>
                          <div className="font-playfair font-bold text-lg text-[#121212] group-hover:text-[#111111] transition-colors">{order.product?.name}</div>
                        </Link>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end sm:gap-12 w-full sm:w-auto mt-4 sm:mt-0">
                      <div className="font-inter font-medium">${order.total.toFixed(2)}</div>
                      <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider font-inter ${
                        order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {order.status}
                      </div>
                      <Link href={`/preview/growth/quantum/products/${order.product?.id}`}>
                        <button className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 group-hover:text-[#111111] group-hover:border-[#111111] transition-colors shrink-0">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 text-center">
                <Link href="#" className="inline-block border-b border-[#121212] pb-1 font-inter text-sm font-bold uppercase tracking-widest hover:text-[#111111] hover:border-[#111111] transition-colors">
                  View Full History
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
