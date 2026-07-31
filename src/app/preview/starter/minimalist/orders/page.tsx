"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useCart } from "../CartContext";

// Mock Orders Data
const MOCK_ORDERS = [
  {
    id: "ORD-MIN-001",
    date: "Jan 10, 2024",
    status: "Delivered",
    total: 155.00,
    items: [
      { name: "Everyday T-Shirt", quantity: 2, price: 45.00 },
      { name: "Minimalist Cap", quantity: 1, price: 65.00 },
    ],
  },
  {
    id: "ORD-MIN-002",
    date: "Feb 14, 2024",
    status: "Shipped",
    total: 210.00,
    items: [
      { name: "Essential Backpack", quantity: 1, price: 210.00 },
    ],
  },
];

export default function MinimalistOrdersPage() {
  const { currencySymbol } = useCart();

  return (
    <div className="flex-grow flex flex-col pt-32 pb-32 px-6 lg:px-12 bg-white">
      <div className="w-full max-w-4xl mx-auto">
        <h1 className="font-heading text-5xl md:text-7xl mb-4 text-[#111111] uppercase tracking-tighter">
          Orders
        </h1>
        <p className="text-black/50 mb-16 text-sm max-w-md">
          Track your recent purchases and view your order history.
        </p>

        {MOCK_ORDERS.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 text-center border-t border-black/10"
          >
            <p className="text-black/50 text-sm mb-8">You haven't placed any orders yet.</p>
            <Link 
              href="/preview/starter/minimalist/products"
              className="bg-[#111111] text-white px-8 py-4 text-xs font-bold tracking-widest uppercase hover:bg-[#FF4D00] transition-colors"
            >
              Start Shopping
            </Link>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-8">
            {MOCK_ORDERS.map((order, index) => (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="border border-black/10 p-6 md:p-10 flex flex-col lg:flex-row justify-between gap-8 group hover:border-[#FF4D00] transition-colors duration-300"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <h3 className="font-heading text-xl text-[#111111]">{order.id}</h3>
                    <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 ${order.status === 'Delivered' ? 'bg-black/5 text-black/60' : 'bg-[#FF4D00]/10 text-[#FF4D00]'}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-black/50 font-medium mb-6 uppercase tracking-widest">{order.date}</p>
                  
                  <div className="space-y-2 border-t border-black/5 pt-4">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm text-[#111111]">
                        <span>{item.name} <span className="text-black/40 text-xs ml-1">x{item.quantity}</span></span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col justify-between items-start lg:items-end border-t lg:border-t-0 lg:border-l border-black/10 pt-6 lg:pt-0 lg:pl-8 min-w-[200px]">
                  <div className="text-left lg:text-right">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-black/40 mb-1">Total</p>
                    <p className="font-heading text-3xl text-[#111111]">{currencySymbol}{order.total.toFixed(2)}</p>
                  </div>
                  
                  <button className="text-xs uppercase tracking-widest font-bold text-black/50 hover:text-[#FF4D00] transition-colors mt-6 lg:mt-0">
                    View Receipt
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
