"use client";

import Link from "next/link";
import { useHorizon } from "../HorizonContext";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, X } from "lucide-react";

export default function HorizonCartPage() {
  const { cart, updateQuantity, removeFromCart, currencySymbol, basePath, appliedCoupon, applyCoupon, removeCoupon, discountAmount, couponError } = useHorizon();
  const totalPrice = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const finalTotal = totalPrice - discountAmount;

  return (
    <div className="bg-[#FAFAFA] min-h-screen text-[#111] pt-40 pb-32">
      <div className="max-w-[1000px] mx-auto px-6 md:px-12">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} className="mb-20">
          <span className="font-outfit text-[10px] uppercase tracking-[0.4em] text-black/40 mb-6 block font-medium">Order Summary</span>
          <h1 className="font-cormorant text-5xl md:text-7xl font-light tracking-tight leading-none">
            Your <span className="italic font-medium">Cart</span>.
          </h1>
        </motion.div>

        {cart.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center border border-black/5 bg-white shadow-[0_20px_40px_rgba(0,0,0,0.02)]">
            <ShoppingBag className="w-8 h-8 text-black/20 mb-8" strokeWidth={1} />
            <h2 className="font-cormorant text-3xl font-light text-black/60 mb-6 italic">Your cart is empty.</h2>
            <Link href={`${basePath}/products`} className="font-outfit text-[10px] uppercase tracking-[0.3em] text-[#111] border-b border-black pb-1">
              Explore the Archive
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            <div className="lg:col-span-2 space-y-8">
              <AnimatePresence>
                {cart.map((item) => (
                  <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-6 pb-8 border-b border-black/5">
                    <div className="w-24 h-32 bg-[#F5F5F5] overflow-hidden shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-cormorant text-2xl">{item.name}</h3>
                          <p className="font-outfit text-[10px] text-black/40 mt-1 uppercase tracking-widest">{item.category}</p>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="text-black/30 hover:text-black transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex justify-between items-center mt-4">
                        <p className="font-outfit text-sm">
                          {currencySymbol}
                          {item.price.toFixed(2)}
                        </p>
                        <div className="flex items-center gap-4 text-black/60">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="hover:text-black transition-colors">
                            -
                          </button>
                          <span className="font-outfit text-xs">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="hover:text-black transition-colors">
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="bg-white border border-black/5 p-8 h-fit shadow-[0_20px_40px_rgba(0,0,0,0.02)]">
              <h3 className="font-outfit text-[10px] uppercase tracking-[0.3em] text-black/40 mb-6">Promo Code</h3>
              {appliedCoupon ? (
                <div className="flex justify-between items-center bg-black/[0.02] px-4 py-3 mb-8 border border-black/10">
                  <span className="font-outfit text-xs uppercase tracking-widest">{appliedCoupon}</span>
                  <button onClick={removeCoupon} className="text-black/40 hover:text-black transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const input = (e.target as HTMLFormElement).elements.namedItem("promo") as HTMLInputElement;
                    if (input.value.trim()) applyCoupon(input.value.trim());
                  }}
                  className="flex gap-2 mb-2"
                >
                  <input name="promo" type="text" placeholder="PROMO CODE" className="flex-1 bg-white border border-black/10 px-4 py-3 text-xs uppercase tracking-widest focus:outline-none focus:border-black/40 font-outfit" />
                  <button type="submit" className="px-4 bg-black/5 hover:bg-black/10 text-xs uppercase tracking-widest transition-colors font-outfit">
                    Apply
                  </button>
                </form>
              )}
              {couponError && <p className="text-red-600 text-xs mb-8 font-outfit">{couponError}</p>}

              <div className="space-y-4 mb-8 pt-6 border-t border-black/10">
                <div className="flex justify-between items-center">
                  <span className="font-outfit text-xs uppercase tracking-widest text-black/40">Subtotal</span>
                  <span className="font-outfit text-sm">
                    {currencySymbol}
                    {totalPrice.toFixed(2)}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="font-outfit text-xs uppercase tracking-widest text-black/40">Discount</span>
                    <span className="font-outfit text-sm">
                      -{currencySymbol}
                      {discountAmount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-4 border-t border-black/10">
                  <span className="font-outfit text-sm uppercase tracking-widest font-medium">Total</span>
                  <span className="font-cormorant text-3xl italic">
                    {currencySymbol}
                    {finalTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <Link
                href={`${basePath}/checkout`}
                className="w-full py-5 bg-black text-white font-outfit text-[10px] uppercase tracking-[0.3em] flex items-center justify-center hover:bg-[#222] transition-colors"
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
