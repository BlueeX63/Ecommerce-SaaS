"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, FileText } from "lucide-react";

// Mock Orders Data
const MOCK_ORDERS = [
  {
    id: "ORD-2023-11-20",
    date: "Nov 20, 2023",
    status: "Delivered",
    total: 215.00,
    items: [
      { name: "Linen Lounge Shirt", quantity: 1, price: 125.00 },
      { name: "Scented Candle", quantity: 2, price: 45.00 },
    ],
  },
  {
    id: "ORD-2023-12-05",
    date: "Dec 05, 2023",
    status: "Processing",
    total: 85.00,
    items: [
      { name: "Ceramic Vase", quantity: 1, price: 85.00 },
    ],
  },
];

export default function EssenceOrdersPage() {
  return (
    <div className="w-full bg-[#F3EDE2] min-h-screen pt-32 pb-32 px-6 md:px-12">
      <div className="max-w-[800px] mx-auto">
        
        <Link href="/preview/starter/essence/products" className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#4A3F35]/50 hover:text-[#4A3F35] transition-colors mb-12 w-fit">
          <ArrowLeft className="w-3 h-3" /> Back to Shop
        </Link>

        <h1 className="font-serif text-4xl md:text-5xl text-[#4A3F35] mb-4">
          Order History
        </h1>
        <p className="text-[#4A3F35]/60 mb-16 font-serif italic">
          Review your past purchases and track current orders.
        </p>

        {MOCK_ORDERS.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center border-t border-[#4A3F35]/10"
          >
            <p className="text-[#4A3F35]/50 text-sm mb-8">You have no order history.</p>
            <Link 
              href="/preview/starter/essence/products"
              className="bg-[#4A3F35] text-[#F3EDE2] px-8 py-4 text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#332B25] transition-colors"
            >
              Start Shopping
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-12">
            {MOCK_ORDERS.map((order, index) => (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white/40 border border-[#4A3F35]/10 p-8 flex flex-col gap-6"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#4A3F35]/10 pb-6 gap-4">
                  <div>
                    <h3 className="font-serif text-xl text-[#4A3F35]">Order #{order.id}</h3>
                    <p className="text-sm text-[#4A3F35]/60 mt-1">{order.date}</p>
                  </div>
                  <div className="flex flex-col sm:items-end gap-1">
                    <span className="font-serif text-xl text-[#4A3F35]">${order.total.toFixed(2)}</span>
                    <span className={`text-xs uppercase tracking-[0.1em] font-bold ${order.status === 'Delivered' ? 'text-[#4A3F35]/50' : 'text-[#4A3F35]'}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="text-[#4A3F35]/80">{item.name} <span className="text-[#4A3F35]/40 italic ml-2">x{item.quantity}</span></span>
                      <span className="font-medium text-[#4A3F35]">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-[#4A3F35]/10 mt-2 flex justify-end">
                  <button className="flex items-center gap-2 text-xs uppercase tracking-[0.1em] font-bold text-[#4A3F35]/60 hover:text-[#4A3F35] transition-colors">
                    <FileText className="w-4 h-4" /> Download Invoice
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
