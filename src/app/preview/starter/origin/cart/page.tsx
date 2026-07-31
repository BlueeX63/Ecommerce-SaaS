"use client";

import Link from "next/link";
import { useCart } from "../CartContext";
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react";

export default function OriginCartPage() {
  const { items, updateQuantity, removeFromCart, totalPrice, totalItems } = useCart();

  return (
    <div className="w-full bg-[#fdfbf7] min-h-[80vh] pt-12 pb-32 px-6">
      <div className="max-w-[1200px] mx-auto">
        
        <div className="mb-16">
          <div className="text-[10px] uppercase tracking-widest font-bold text-[#a38c7f] mb-4">Your Bag</div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#402c21] animate-in slide-in-from-bottom-5 fade-in duration-700">
            Shopping Cart ({totalItems})
          </h1>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-24 bg-[#efebe9] rounded-sm animate-in fade-in duration-700">
            <h2 className="font-serif text-2xl font-bold text-[#402c21] mb-6">Your cart is currently empty.</h2>
            <Link 
              href="/preview/starter/origin/products" 
              className="inline-flex items-center gap-4 bg-[#402c21] text-[#fdfbf7] px-8 py-4 text-xs font-bold tracking-widest uppercase hover:bg-[#a38c7f] transition-colors rounded-sm"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 animate-in fade-in duration-700 delay-150">
            
            {/* Cart Items */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              <div className="hidden sm:grid grid-cols-12 pb-4 border-b border-[#402c21]/20 text-[10px] uppercase tracking-widest font-bold text-[#402c21]/50">
                <div className="col-span-6">Product</div>
                <div className="col-span-3 text-center">Quantity</div>
                <div className="col-span-3 text-right">Total</div>
              </div>

              {items.map((item) => (
                <div key={item.product.id} className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center py-6 border-b border-[#402c21]/10 group">
                  <div className="col-span-1 sm:col-span-6 flex items-center gap-6">
                    <Link href={`/preview/starter/origin/products/${item.product.id}`} className="shrink-0 w-24 h-24 bg-[#e5e0dc] rounded-sm overflow-hidden">
                      <img 
                        src={item.product.image} 
                        alt={item.product.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </Link>
                    <div className="flex flex-col gap-1">
                      <Link href={`/preview/starter/origin/products/${item.product.id}`}>
                        <h3 className="font-serif font-bold text-[#402c21] group-hover:text-[#a38c7f] transition-colors line-clamp-1">{item.product.name}</h3>
                      </Link>
                      <div className="text-sm font-bold text-[#402c21]/70">${item.product.price.toFixed(2)}</div>
                    </div>
                  </div>
                  
                  <div className="col-span-1 sm:col-span-3 flex justify-between sm:justify-center items-center">
                    <div className="sm:hidden text-xs font-bold uppercase tracking-widest text-[#402c21]/50">Quantity</div>
                    <div className="flex items-center gap-4 bg-[#efebe9] px-3 py-2 rounded-sm">
                      <button 
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="text-[#402c21] hover:text-[#a38c7f] transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-bold text-[#402c21] w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="text-[#402c21] hover:text-[#a38c7f] transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="col-span-1 sm:col-span-3 flex justify-between sm:justify-end items-center gap-4">
                    <div className="sm:hidden text-xs font-bold uppercase tracking-widest text-[#402c21]/50">Total</div>
                    <div className="font-bold text-[#402c21]">${(item.product.price * item.quantity).toFixed(2)}</div>
                    <button 
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-[#402c21]/40 hover:text-[#402c21] transition-colors ml-2"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-4">
              <div className="bg-[#efebe9] p-8 rounded-sm sticky top-32">
                <h2 className="font-serif text-2xl font-bold text-[#402c21] mb-8">Order Summary</h2>
                
                <div className="flex flex-col gap-4 text-sm font-medium text-[#402c21]/80 mb-8 border-b border-[#402c21]/10 pb-8">
                  <div className="flex justify-between items-center">
                    <span>Subtotal</span>
                    <span className="font-bold text-[#402c21]">${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mb-8">
                  <span className="font-bold text-[#402c21] uppercase tracking-widest text-sm">Total</span>
                  <span className="font-serif text-2xl font-bold text-[#402c21]">${totalPrice.toFixed(2)}</span>
                </div>
                
                <Link href="/preview/starter/origin/checkout" className="w-full bg-[#402c21] text-[#fdfbf7] py-4 flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest hover:bg-[#a38c7f] transition-colors rounded-sm group">
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                
                <div className="mt-6 text-center text-xs font-medium text-[#402c21]/60">
                  Taxes and shipping calculated at checkout.
                </div>
              </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}
