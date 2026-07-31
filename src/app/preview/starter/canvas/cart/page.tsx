"use client";

import Link from "next/link";
import { useCart } from "../CartContext";
import { X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CanvasCartPage() {
  const { items, updateQuantity, removeFromCart, cartTotal } = useCart();

  const tax = cartTotal * 0.08;
  const shipping = cartTotal > 0 ? 15.00 : 0;
  const finalTotal = cartTotal + tax + shipping;

  return (
    <div className="flex flex-col w-full bg-black text-white min-h-screen pt-32">
      
      {/* Header */}
      <section className="px-6 md:px-12 w-full pb-16 border-b border-white/20">
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-8 text-center md:text-left">
          [ Checkout ]
        </div>
        <h1 className="font-serif text-5xl md:text-8xl tracking-tighter uppercase leading-[0.8] text-center md:text-left">
          Cart.
        </h1>
      </section>

      <section className="w-full flex-grow flex flex-col lg:flex-row pb-32">
        
        {/* Left Side: Cart Items */}
        <div className="w-full lg:w-2/3 border-b lg:border-b-0 lg:border-r border-white/20">
          {items.length === 0 ? (
            <div className="p-12 md:p-24 text-center">
              <h3 className="font-serif text-4xl italic tracking-tighter text-white mb-6">Null.</h3>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-12 leading-loose">
                Your archive is currently empty.
              </p>
              <Link 
                href="/preview/starter/canvas/products"
                className="border border-white/30 px-8 py-4 text-[10px] uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-colors inline-block"
              >
                Return to Index
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/10 border-b border-white/10">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={item.product.id} 
                    className="flex flex-col sm:flex-row gap-8 p-6 md:p-12 group"
                  >
                    <div className="w-full sm:w-32 aspect-[3/4] bg-white/5 overflow-hidden">
                      <img 
                        src={item.product.image} 
                        alt={item.product.name}
                        className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 ease-out"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-serif text-2xl tracking-tight text-white mb-2">{item.product.name}</h3>
                          <p className="text-[10px] text-white/40 uppercase tracking-[0.2em]">ID: {item.product.id}</p>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-white/30 hover:text-white transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="flex items-end justify-between mt-8">
                        <div className="flex items-center gap-6 text-[10px] uppercase tracking-[0.2em]">
                          <button 
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="text-white/50 hover:text-white transition-colors"
                          >
                            [-]
                          </button>
                          <span className="text-white">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="text-white/50 hover:text-white transition-colors"
                          >
                            [+]
                          </button>
                        </div>
                        <p className="font-mono text-sm tracking-widest text-white/70">${(item.product.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Right Side: Summary */}
        <div className="w-full lg:w-1/3">
          <div className="p-6 md:p-12 lg:sticky lg:top-32">
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-12 border-b border-white/10 pb-4">
              [ Summary ]
            </div>
            
            <div className="space-y-6 mb-12">
              <div className="flex justify-between text-[10px] tracking-[0.2em] uppercase text-white/50">
                <span>Subtotal</span>
                <span className="font-mono text-white/80 tracking-widest">${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px] tracking-[0.2em] uppercase text-white/50">
                <span>Shipping</span>
                <span className="font-mono text-white/80 tracking-widest">{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-[10px] tracking-[0.2em] uppercase text-white/50">
                <span>Tax (8%)</span>
                <span className="font-mono text-white/80 tracking-widest">${tax.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="border-t border-white/20 pt-8 mb-16">
              <div className="flex justify-between items-end">
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">Total</span>
                <span className="font-serif text-4xl text-white tracking-tighter">${finalTotal.toFixed(2)}</span>
              </div>
            </div>
            
            <Link 
              href="/preview/starter/canvas/checkout"
              className={`w-full border border-white/30 text-[10px] uppercase tracking-[0.2em] flex items-center justify-between px-8 py-5 hover:bg-white hover:text-black transition-colors duration-500 ${items.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <span>Initiate Payment</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            
          </div>
        </div>
      </section>

    </div>
  );
}
