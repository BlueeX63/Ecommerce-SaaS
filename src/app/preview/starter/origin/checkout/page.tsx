"use client";

import { motion } from "framer-motion";
import { useCart } from "../CartContext";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ArrowRight } from "lucide-react";

type CheckoutStep = 'shipping' | 'payment' | 'placed';

export default function OriginCheckoutPage() {
  const { items, totalPrice, clearCart, appliedCoupon, applyCoupon, removeCoupon, discountAmount, couponError } = useCart();
  const router = useRouter();
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('shipping');
  const [shippingDetails, setShippingDetails] = useState({ name: '', address: '', mobile: '' });
  const [couponCode, setCouponCode] = useState("");

  const finalTotal = totalPrice - discountAmount;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode) {
      applyCoupon(couponCode);
      setCouponCode("");
    }
  };

  if (checkoutStep === 'placed') {
    return (
      <div className="flex flex-col items-center justify-center px-6 min-h-[60vh] bg-[#fdfbf7] w-full pt-12 pb-32 text-[#402c21]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-[#f5f1ea] p-16 w-full max-w-xl rounded-sm shadow-sm"
        >
          <div className="w-20 h-20 bg-[#402c21] text-[#fdfbf7] rounded-full flex items-center justify-center mx-auto mb-10">
            <Check className="w-10 h-10" />
          </div>
          <h1 className="font-serif text-4xl mb-6">Order Complete</h1>
          <p className="text-sm text-[#402c21]/70 leading-relaxed mb-10 max-w-sm mx-auto">
            Your piece of earth has been claimed. We have sent an email with the details of your order.
          </p>
          <Link 
            href="/preview/starter/origin/products"
            className="inline-flex bg-[#402c21] text-[#fdfbf7] px-10 py-5 text-xs font-bold tracking-widest uppercase hover:bg-[#a38c7f] transition-colors w-full sm:w-auto items-center justify-center gap-3 group rounded-sm"
          >
            Continue Exploring <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 min-h-[60vh] bg-[#fdfbf7] text-[#402c21]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="font-serif text-4xl mb-6">Your cart is empty</h1>
          <p className="text-sm text-[#402c21]/70 mb-10">You have no pieces selected yet.</p>
          <Link 
            href="/preview/starter/origin/products"
            className="inline-flex bg-[#402c21] text-[#fdfbf7] px-10 py-5 text-xs font-bold tracking-widest uppercase hover:bg-[#a38c7f] transition-colors items-center justify-center gap-3 group rounded-sm"
          >
            Explore Ceramics <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    );
  }

  if (checkoutStep === 'shipping') {
    return (
      <div className="w-full bg-[#fdfbf7] min-h-screen pt-12 pb-32 px-6 md:px-12 text-[#402c21]">
        <div className="max-w-[600px] mx-auto">
          <Link href="/preview/starter/origin/cart" className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#402c21]/50 hover:text-[#402c21] transition-colors mb-12 w-fit">
            <ArrowLeft className="w-4 h-4" /> Back to Cart
          </Link>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#f5f1ea] p-8 md:p-12 shadow-sm rounded-sm"
          >
            <h1 className="font-serif text-3xl mb-2 text-[#402c21]">Shipping Details</h1>
            <p className="text-[#402c21]/60 mb-10 text-sm">Where should we deliver your ceramics?</p>
            
            <form 
              className="flex flex-col gap-6"
              onSubmit={(e) => {
                e.preventDefault();
                setCheckoutStep('payment');
              }}
            >
              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-[#402c21]/80">Full Name</label>
                <input 
                  type="text" 
                  id="name" 
                  required
                  value={shippingDetails.name}
                  onChange={(e) => setShippingDetails({...shippingDetails, name: e.target.value})}
                  className="w-full bg-white/50 border border-[#402c21]/10 py-4 px-4 text-[#402c21] focus:outline-none focus:border-[#402c21]/40 transition-colors placeholder:text-[#402c21]/30 text-sm rounded-sm"
                  placeholder="Jane Doe"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="mobile" className="text-xs font-bold uppercase tracking-widest text-[#402c21]/80">Mobile Number</label>
                <input 
                  type="tel" 
                  id="mobile" 
                  required
                  value={shippingDetails.mobile}
                  onChange={(e) => setShippingDetails({...shippingDetails, mobile: e.target.value})}
                  className="w-full bg-white/50 border border-[#402c21]/10 py-4 px-4 text-[#402c21] focus:outline-none focus:border-[#402c21]/40 transition-colors placeholder:text-[#402c21]/30 text-sm rounded-sm"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="address" className="text-xs font-bold uppercase tracking-widest text-[#402c21]/80">Delivery Address</label>
                <textarea 
                  id="address" 
                  required
                  rows={3}
                  value={shippingDetails.address}
                  onChange={(e) => setShippingDetails({...shippingDetails, address: e.target.value})}
                  className="w-full bg-white/50 border border-[#402c21]/10 py-4 px-4 text-[#402c21] focus:outline-none focus:border-[#402c21]/40 transition-colors placeholder:text-[#402c21]/30 text-sm rounded-sm resize-none"
                  placeholder="123 Earth Way, Suite 100&#10;New York, NY 10001"
                />
              </div>

              <div className="mt-8">
                <button 
                  type="submit"
                  className="w-full bg-[#402c21] text-[#fdfbf7] py-4 flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest hover:bg-[#a38c7f] transition-colors rounded-sm group"
                >
                  Continue to Payment <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    );
  }

  if (checkoutStep === 'payment') {
    return (
      <div className="w-full bg-[#fdfbf7] min-h-screen pt-12 pb-32 px-6 md:px-12 text-[#402c21]">
        <div className="max-w-[600px] mx-auto">
          <button onClick={() => setCheckoutStep('shipping')} className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#402c21]/50 hover:text-[#402c21] transition-colors mb-12 w-fit">
            <ArrowLeft className="w-4 h-4" /> Back to Shipping
          </button>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#f5f1ea] p-8 md:p-12 shadow-sm rounded-sm"
          >
            <h1 className="font-serif text-3xl mb-10 text-[#402c21]">Review & Pay</h1>
            
            <div className="bg-white/50 border border-[#402c21]/10 p-6 mb-6 rounded-sm">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#402c21]/70 border-b border-[#402c21]/10 pb-3 mb-4">Shipping Destination</h3>
              <p className="text-sm font-medium text-[#402c21] mb-1">{shippingDetails.name}</p>
              <p className="text-sm text-[#402c21]/60 mb-2">{shippingDetails.mobile}</p>
              <p className="text-sm text-[#402c21]/60 whitespace-pre-line leading-relaxed">{shippingDetails.address}</p>
            </div>

            <div className="bg-white/50 border border-[#402c21]/10 p-6 mb-10 rounded-sm">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#402c21]/70 border-b border-[#402c21]/10 pb-3 mb-4">Payment Method</h3>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-[#402c21] flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-[#402c21] rounded-full"></div>
                </div>
                <span className="text-sm font-medium text-[#402c21]">Cash on Delivery (COD)</span>
              </div>
              <p className="text-xs text-[#402c21]/50 mt-3 pl-8 leading-relaxed">Payment will be collected upon delivery. Please ensure exact change is available.</p>
            </div>

            <div className="bg-white/50 border border-[#402c21]/10 p-6 mb-10 rounded-sm">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#402c21]/70 border-b border-[#402c21]/10 pb-3 mb-4">Promotional Code</h3>
              {appliedCoupon ? (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-[#402c21]">{appliedCoupon}</span>
                    <span className="text-xs font-bold uppercase tracking-widest text-green-700 ml-4">-${discountAmount.toFixed(2)} Applied</span>
                  </div>
                  <button onClick={removeCoupon} className="text-xs font-bold uppercase tracking-widest text-[#402c21]/50 hover:text-[#402c21] transition-colors">
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Enter code (e.g. DISCOUNT20)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 bg-white/50 border border-[#402c21]/10 py-2 px-3 text-[#402c21] focus:outline-none focus:border-[#402c21]/40 transition-colors placeholder:text-[#402c21]/30 text-sm rounded-sm"
                  />
                  <button type="submit" className="px-6 bg-[#402c21] text-[#fdfbf7] text-xs font-bold uppercase tracking-widest hover:bg-[#a38c7f] transition-colors rounded-sm">
                    Apply
                  </button>
                </form>
              )}
              {couponError && <p className="text-red-600 text-xs mt-3">{couponError}</p>}
            </div>

            <div className="flex justify-between items-center mb-8 border-t border-[#402c21]/10 pt-8">
              <span className="font-bold tracking-widest uppercase text-xs text-[#402c21]/70">Total Due</span>
              <span className="font-serif text-3xl font-bold">${finalTotal.toFixed(2)}</span>
            </div>

            <button 
              onClick={() => {
                clearCart();
                setCheckoutStep('placed');
              }}
              className="w-full bg-[#402c21] text-[#fdfbf7] py-4 flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest hover:bg-[#a38c7f] transition-colors rounded-sm group"
            >
              Confirm Order <Check className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return null;
}
