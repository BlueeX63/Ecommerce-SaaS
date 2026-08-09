"use client";

import Link from "next/link";
import { useCart } from "../CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trash2, Plus, Minus } from "lucide-react";

export default function EssenceCartPage() {
  const { currencySymbol } = useCart();
  const { items, updateQuantity, removeFromCart, totalPrice } = useCart();

  return (
    <div className="w-full bg-[#F3EDE2] min-h-screen pt-12 pb-32 px-6 md:px-12">
      <div className="max-w-[1200px] mx-auto">
        
        <Link href="/templates/essence/products" className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#4A3F35]/50 hover:text-[#4A3F35] transition-colors mb-12 w-fit">
          <ArrowLeft className="w-3 h-3" /> Continue Shopping
        </Link>

        <h1 className="font-serif text-4xl md:text-5xl text-[#4A3F35] mb-16">
          Your Cart
        </h1>

        {items.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center border-t border-[#4A3F35]/10"
          >
            <p className="text-[#4A3F35]/50 text-sm mb-8">Your cart is currently empty.</p>
            <Link 
              href="/templates/essence/products"
              className="bg-[#4A3F35] text-[#F3EDE2] px-8 py-4 text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#332B25] transition-colors"
            >
              Return to Shop
            </Link>
          </motion.div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-16">
            
            {/* Cart Items */}
            <div className="w-full lg:w-2/3 flex flex-col">
              <div className="grid grid-cols-12 gap-4 border-b border-[#4A3F35]/10 pb-4 mb-8 text-[10px] uppercase tracking-[0.2em] font-bold text-[#4A3F35]/40 hidden md:grid">
                <div className="col-span-6">Product</div>
                <div className="col-span-3 text-center">Quantity</div>
                <div className="col-span-3 text-right">Total</div>
              </div>

              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.product.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center py-8 border-b border-[#4A3F35]/5 group"
                  >
                    <div className="col-span-1 md:col-span-6 flex gap-6 items-center">
                      <Link href={`/templates/essence/products/${item.product.id}`}>
                        <div className="w-24 md:w-32 aspect-[3/4] bg-[#E3D8C8] overflow-hidden">
                          <img 
                            src={item.product.image} 
                            alt={item.product.name} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        </div>
                      </Link>
                      <div className="flex flex-col gap-2">
                        <Link href={`/templates/essence/products/${item.product.id}`}>
                          <h3 className="font-serif text-lg text-[#4A3F35]">{item.product.name}</h3>
                        </Link>
                        <div className="text-sm text-[#4A3F35]/60 italic font-serif">{currencySymbol}{item.product.price.toFixed(2)}</div>
                        <button 
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-[10px] uppercase tracking-[0.2em] text-[#4A3F35]/40 hover:text-[#4A3F35] transition-colors mt-2 text-left flex items-center gap-2 w-fit"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    </div>

                    <div className="col-span-1 md:col-span-3 flex justify-start md:justify-center">
                      <div className="flex items-center justify-between border border-[#4A3F35]/20 px-3 py-2 w-28 bg-[#F3EDE2]">
                        <button 
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="text-[#4A3F35]/50 hover:text-[#4A3F35] transition-colors p-1"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-medium text-[#4A3F35]">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="text-[#4A3F35]/50 hover:text-[#4A3F35] transition-colors p-1"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="col-span-1 md:col-span-3 text-left md:text-right font-serif text-lg text-[#4A3F35]">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Order Summary */}
            <div className="w-full lg:w-1/3">
              <div className="bg-[#E3D8C8]/30 p-8 md:p-10 sticky top-32">
                <h3 className="font-serif text-2xl text-[#4A3F35] mb-8">Order Summary</h3>
                
                <div className="flex flex-col gap-4 text-sm text-[#4A3F35]/70 mb-8">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{currencySymbol}{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="italic">Calculated at checkout</span>
                  </div>
                </div>
                
                <div className="h-px w-full bg-[#4A3F35]/10 mb-6" />
                
                <div className="flex justify-between items-end mb-10 text-[#4A3F35]">
                  <span className="text-sm uppercase tracking-[0.1em] font-medium">Total</span>
                  <span className="font-serif text-3xl italic">{currencySymbol}{totalPrice.toFixed(2)}</span>
                </div>
                
                <Link href="/templates/essence/checkout" className="w-full flex items-center justify-center bg-[#4A3F35] text-[#F3EDE2] py-5 text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#332B25] transition-colors mb-4">
                  Proceed to Checkout
                </Link>
                <div className="text-center text-[10px] text-[#4A3F35]/50 uppercase tracking-[0.1em]">
                  Secure Checkout
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
