"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Package } from "lucide-react";

// Mock Orders Data
const MOCK_ORDERS = [
  {
    id: "ORD-ORG-100",
    date: "March 12, 2024",
    status: "Delivered",
    total: 125.00,
    items: [
      { name: "Organic Cotton Throw", quantity: 1, price: 125.00 },
    ],
  },
  {
    id: "ORD-ORG-101",
    date: "April 02, 2024",
    status: "Processing",
    total: 310.00,
    items: [
      { name: "Handcrafted Ceramic Set", quantity: 2, price: 85.00 },
      { name: "Woven Linen Cushion", quantity: 2, price: 70.00 },
    ],
  },
];

export default function OriginOrdersPage() {
  return (
    <div className="w-full bg-[#fdfbf7] min-h-[80vh] pt-32 pb-32 px-6">
      <div className="max-w-[800px] mx-auto">
        
        <Link href="/preview/starter/origin/products" className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-[#a38c7f] hover:text-[#402c21] transition-colors mb-12 w-fit">
          <ArrowLeft className="w-3 h-3" /> Back to Collection
        </Link>

        <div className="mb-16">
          <div className="text-[10px] uppercase tracking-widest font-bold text-[#a38c7f] mb-4">Your Account</div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#402c21] animate-in slide-in-from-bottom-5 fade-in duration-700">
            Order History
          </h1>
        </div>

        {MOCK_ORDERS.length === 0 ? (
          <div className="text-center py-24 bg-[#efebe9] rounded-sm animate-in fade-in duration-700">
            <h2 className="font-serif text-2xl font-bold text-[#402c21] mb-6">No orders found.</h2>
            <Link 
              href="/preview/starter/origin/products" 
              className="inline-flex items-center gap-4 bg-[#402c21] text-[#fdfbf7] px-8 py-4 text-xs font-bold tracking-widest uppercase hover:bg-[#a38c7f] transition-colors rounded-sm"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-8 animate-in fade-in duration-700 delay-150">
            {MOCK_ORDERS.map((order, index) => (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white border border-[#402c21]/10 rounded-sm p-6 sm:p-8 flex flex-col gap-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#402c21]/10 pb-6 gap-4">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-[#402c21]">Order #{order.id}</h3>
                    <p className="text-sm font-medium text-[#402c21]/60 mt-1">{order.date}</p>
                  </div>
                  <div className="flex flex-col sm:items-end gap-2">
                    <span className="font-bold text-[#402c21] text-lg">${order.total.toFixed(2)}</span>
                    <span className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full ${order.status === 'Delivered' ? 'bg-[#efebe9] text-[#402c21]/60' : 'bg-[#402c21]/5 text-[#402c21]'}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="font-medium text-[#402c21]/80">{item.name} <span className="text-[#a38c7f] ml-2">x{item.quantity}</span></span>
                      <span className="font-bold text-[#402c21]/70">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-[#402c21]/10 flex justify-start">
                  <button className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-[#402c21]/60 hover:text-[#402c21] transition-colors">
                    <Package className="w-4 h-4" /> Track Package
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
