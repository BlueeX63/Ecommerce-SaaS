"use client";

import { motion } from "framer-motion";
import { useCart } from "../CartContext";
import { X, Minus, Plus } from "lucide-react";
import Link from "next/link";

export default function StarterCartPage() {
  const { items, removeFromCart, updateQuantity, totalPrice, currencySymbol } = useCart();

  if (items.length === 0) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center px-6 min-h-[60vh]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="font-heading text-4xl mb-4 text-[#111111]">Your cart is empty</h1>
          <p className="text-black/50 mb-8">Looks like you haven't added anything yet.</p>
          <Link 
            href="/preview/starter/minimalist/products"
            className="inline-block bg-[#111111] text-white px-8 py-4 text-xs font-bold tracking-widest uppercase hover:bg-[#FF4D00] transition-colors"
          >
            Shop Collection
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-6 py-16 md:py-24 max-w-5xl mx-auto w-full">
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-heading text-4xl md:text-5xl tracking-tighter text-[#111111] mb-12"
      >
        Shopping Cart
      </motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-12 gap-4 pb-4 border-b border-black/10 text-xs font-bold uppercase tracking-widest text-[#111111]">
            <div className="col-span-6">Product</div>
            <div className="col-span-3 text-center">Quantity</div>
            <div className="col-span-3 text-right">Total</div>
          </div>

          {/* Items */}
          <div className="flex flex-col gap-8 py-8 border-b border-black/10">
            {items.map((item, i) => (
              <motion.div 
                key={item.product.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center"
              >
                <div className="sm:col-span-6 flex gap-4 items-center">
                  <div className="w-20 h-24 bg-black/5 relative overflow-hidden">
                    <img src={item.product.image} alt={item.product.name} className="absolute inset-0 w-full h-full object-cover mix-blend-multiply" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-[#111111]">{item.product.name}</h3>
                    <p className="text-xs text-black/50">{currencySymbol}{item.product.price.toFixed(2)}</p>
                    <button 
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-xs text-black/40 hover:text-[#FF4D00] transition-colors mt-2 uppercase tracking-wide font-medium flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-3 flex justify-start sm:justify-center">
                  <div className="flex items-center border border-black/10">
                    <button 
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-black/5 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-black/5 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-3 text-left sm:text-right font-medium text-sm">
                  {currencySymbol}{(item.product.price * item.quantity).toFixed(2)}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white p-8 border border-black/5">
            <h2 className="font-heading text-2xl mb-6 text-[#111111]">Order Summary</h2>
            <div className="flex justify-between items-center mb-4 text-sm">
              <span className="text-black/60">Subtotal</span>
              <span className="font-medium">{currencySymbol}{totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-6 text-sm">
              <span className="text-black/60">Shipping</span>
              <span className="font-medium">{totalPrice > 100 ? "Free" : `${currencySymbol}10.00`}</span>
            </div>
            <div className="flex justify-between items-center mb-8 pb-8 border-b border-black/10">
              <span className="font-bold tracking-widest uppercase text-xs">Total</span>
              <span className="font-medium text-xl">{currencySymbol}{(totalPrice + (totalPrice > 100 ? 0 : 10)).toFixed(2)}</span>
            </div>
            
            <Link 
              href="/preview/starter/minimalist/checkout"
              className="w-full inline-block text-center bg-[#111111] text-white py-4 text-xs font-bold tracking-widest uppercase hover:bg-[#FF4D00] transition-colors"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
