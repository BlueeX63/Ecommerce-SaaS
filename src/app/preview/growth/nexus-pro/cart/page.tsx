"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, X, Minus, Plus } from "lucide-react";
import { useShop } from "../ShopContext";

export default function NexusProCartPage() {
  const { cartItems, updateCartQuantity, removeFromCart, cartTotal } = useShop();

  const tax = cartTotal * 0.08;
  const shipping = cartTotal > 0 ? (cartTotal > 200 ? 0 : 25) : 0;
  const finalTotal = cartTotal + tax + shipping;

  return (
    <div className="flex flex-col w-full bg-[#0a0a0a] text-[#ededed] pt-32 pb-32 min-h-screen">
      <section className="px-6 md:px-12 max-w-7xl mx-auto w-full mb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="text-[#d4af37] text-xs font-bold uppercase tracking-[0.3em] mb-6 block">
            Checkout
          </span>
          <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9] mb-8">
            Your Cart.
          </h1>
        </motion.div>
      </section>

      <section className="px-6 md:px-12 max-w-7xl mx-auto w-full flex flex-col xl:flex-row gap-16 lg:gap-24">
        
        {/* Cart Items */}
        <div className="flex-1">
          {cartItems.length === 0 ? (
            <div className="py-24 text-center border-t border-white/10">
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">Cart is Empty</h3>
              <p className="text-white/50 text-sm mb-8">You haven't added any items to your cart yet.</p>
              <Link 
                href="/preview/growth/nexus-pro/products"
                className="inline-block px-8 py-4 bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-[#d4af37] hover:text-white transition-colors rounded-full"
              >
                Return to Archive
              </Link>
            </div>
          ) : (
            <div className="border-t border-white/10">
              <div className="hidden md:grid grid-cols-12 py-4 border-b border-white/10 text-[10px] uppercase tracking-widest font-bold text-white/50">
                <div className="col-span-6">Product</div>
                <div className="col-span-3 text-center">Quantity</div>
                <div className="col-span-3 text-right">Total</div>
              </div>
              <AnimatePresence>
                {cartItems.map((item) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -50 }}
                    key={item.product.id} 
                    className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-8 border-b border-white/10 group"
                  >
                    <div className="col-span-1 md:col-span-6 flex gap-6 items-center">
                      <div className="w-24 md:w-32 aspect-[3/4] bg-white/5 rounded-lg overflow-hidden shrink-0">
                        <img 
                          src={item.product.image} 
                          alt={item.product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Link href={`/preview/growth/nexus-pro/products/${item.product.id}`}>
                          <h3 className="text-lg font-bold group-hover:text-[#d4af37] transition-colors">{item.product.name}</h3>
                        </Link>
                        <p className="text-[10px] text-white/50 uppercase tracking-widest">{item.product.category}</p>
                        <button 
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-[10px] uppercase tracking-widest text-white/30 hover:text-red-500 transition-colors flex items-center gap-2 mt-4"
                        >
                          <X className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    </div>
                    
                    <div className="col-span-1 md:col-span-3 flex justify-start md:justify-center">
                      <div className="flex items-center justify-between border border-white/20 p-2 rounded-full w-32 bg-[#0a0a0a]">
                        <button 
                          onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-sm">{item.quantity}</span>
                        <button 
                          onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="col-span-1 md:col-span-3 text-left md:text-right font-bold text-lg">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="w-full xl:w-[400px]">
          <div className="bg-white/5 p-8 rounded-2xl sticky top-32">
            <h2 className="text-xl font-black uppercase tracking-tighter mb-8">Summary</h2>
            
            <div className="space-y-4 text-sm font-medium border-b border-white/10 pb-6 mb-6">
              <div className="flex justify-between items-center text-white/70">
                <span>Subtotal</span>
                <span className="text-white">${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-white/70">
                <span>Estimated Tax (8%)</span>
                <span className="text-white">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-white/70">
                <span>Shipping</span>
                <span className="text-white">{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center mb-8">
              <span className="text-xs font-bold uppercase tracking-widest text-[#d4af37]">Total</span>
              <span className="text-3xl font-black">${finalTotal.toFixed(2)}</span>
            </div>

            <Link 
              href={cartItems.length > 0 ? "/preview/growth/nexus-pro/checkout" : "#"}
              className={`w-full py-5 rounded-full font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all duration-300 ${cartItems.length === 0 ? 'bg-white/10 text-white/30 cursor-not-allowed' : 'bg-white text-black hover:bg-[#d4af37] hover:text-white'}`}
            >
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </section>
    </div>
  );
}
