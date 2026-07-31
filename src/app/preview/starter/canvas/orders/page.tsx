"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

// Mock Orders Data
const MOCK_ORDERS = [
  {
    id: "ORD-2023-08-01",
    date: "Aug 01, 2023",
    status: "Delivered",
    total: 355.00,
    items: [
      { name: "Structural Tote Bag", quantity: 1, price: 120.00 },
      { name: "Industrial Chair", quantity: 1, price: 235.00 },
    ],
  },
  {
    id: "ORD-2023-09-15",
    date: "Sep 15, 2023",
    status: "Processing",
    total: 85.00,
    items: [
      { name: "Steel Bookend", quantity: 1, price: 85.00 },
    ],
  },
];

export default function CanvasOrdersPage() {
  return (
    <div className="flex flex-col w-full bg-black text-white min-h-screen pt-32">
      {/* Header */}
      <section className="px-6 md:px-12 w-full pb-16 border-b border-white/20">
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-8 text-center md:text-left">
          [ History ]
        </div>
        <h1 className="font-serif text-5xl md:text-8xl tracking-tighter uppercase leading-[0.8] text-center md:text-left">
          Orders.
        </h1>
      </section>

      <section className="w-full flex-grow px-6 md:px-12 py-16">
        {MOCK_ORDERS.length === 0 ? (
          <div className="py-24 text-center">
            <h3 className="font-serif text-4xl italic tracking-tighter text-white mb-6">Null.</h3>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-12 leading-loose">
              No previous transactions found.
            </p>
            <Link 
              href="/preview/starter/canvas/products"
              className="border border-white/30 px-8 py-4 text-[10px] uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-colors inline-block"
            >
              Return to Index
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-12 max-w-4xl mx-auto">
            {MOCK_ORDERS.map((order, index) => (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                className="border border-white/20 p-8 hover:bg-white/5 transition-colors duration-500"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-white/10 pb-6">
                  <div>
                    <h3 className="font-mono text-sm tracking-widest text-white mb-2">{order.id}</h3>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">{order.date}</p>
                  </div>
                  <div className="mt-4 md:mt-0 text-left md:text-right">
                    <p className="font-serif text-2xl text-white">${order.total.toFixed(2)}</p>
                    <p className={`text-[10px] uppercase tracking-[0.2em] mt-2 ${order.status === 'Delivered' ? 'text-white/50' : 'text-white'}`}>
                      [{order.status}]
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-[10px] uppercase tracking-[0.2em]">
                      <span className="text-white/70">{item.name} <span className="text-white/30">x{item.quantity}</span></span>
                      <span className="font-mono text-white/50">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 pt-6 border-t border-white/10">
                  <button className="text-[10px] uppercase tracking-[0.2em] text-white/50 hover:text-white flex items-center gap-4 transition-colors">
                    <span>View Invoice</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
