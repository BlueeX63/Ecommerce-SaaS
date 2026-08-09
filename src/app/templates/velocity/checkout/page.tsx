"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { PremiumPaymentSelector, PaymentMethod } from "@/components/storefront/PremiumPaymentSelector";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight, Zap, Tag, X } from "lucide-react";
import { useVelocity } from "../VelocityContext";

export default function VelocityCheckoutPage() {
  const { cart, clearCart, setIsCartOpen, appliedCoupon, discountAmount, couponError, applyCoupon, removeCoupon , currencySymbol } = useVelocity();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [couponCode, setCouponCode] = useState('');

  const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const discountedTotal = Math.max(0, totalPrice - discountAmount);
  const tax = discountedTotal * 0.08;
  const shipping = totalPrice > 0 ? (totalPrice > 200 ? 0 : 25) : 0;
  const finalTotal = discountedTotal + tax + shipping;

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    setTimeout(() => {
      clearCart();
      setIsProcessing(false);
      setIsSuccess(true);
      // We would normally place an order object here, but we will simulate it.
    }, 2000);
  };

  
  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    setIsPlacingOrder(true);
    try {
      const slug = 'velocity';
      const subtotal = cart.reduce((sum: number, item: any) => sum + (item.price || item.product?.price || 0) * item.quantity, 0);
      const discount = typeof discountAmount !== 'undefined' ? discountAmount : 0;
      
      const res = await fetch(`/api/v1/store/orders?slug=${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          items: cart,
          subtotal: subtotal,
          taxTotal: 0,
          shippingTotal: 0,
          discountTotal: discount,
          grandTotal: subtotal - discount,
          shippingDetails: { address: "Address provided" }, // { address: 'Not provided' },
          paymentMethod
        })
      });
      if (res.ok) {
        clearCart();
        setIsSuccess(true);
      }
    } catch(err) {
      console.error(err);
    } finally {
      setIsPlacingOrder(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f11] text-[#e0e0e0] p-6 font-mono relative overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,170,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,170,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [transform:perspective(1000px)_rotateX(60deg)_translateY(-200px)_translateZ(-200px)] opacity-50 pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-[#1a1a1f] p-12 rounded-lg border border-[#00ffaa]/30 text-center max-w-lg w-full relative z-10 shadow-[0_0_50px_rgba(0,255,170,0.1)]"
        >
          <div className="w-20 h-20 bg-[#00ffaa]/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-[#00ffaa]/30 shadow-[0_0_20px_rgba(0,255,170,0.2)]">
            <Zap className="w-10 h-10 text-[#00ffaa]" />
          </div>
          <h1 className="text-3xl font-bold uppercase tracking-widest text-white mb-4">Transmission Secure.</h1>
          <p className="text-[#a0a0a0] text-sm mb-8 leading-relaxed">
            Order successfully registered in the main frame. Delivery protocols initiated.
          </p>
          <div className="flex flex-col gap-4">
            <Link 
              href="/templates/velocity/profile"
              className="w-full py-4 bg-[#00ffaa] text-black font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors text-center"
            >
              Access Order Status
            </Link>
            <Link 
              href="/templates/velocity/products"
              className="w-full py-4 bg-transparent border border-[#00ffaa]/30 text-[#00ffaa] font-bold uppercase tracking-widest text-xs hover:bg-[#00ffaa]/10 transition-colors text-center"
            >
              Return to Grid
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f11] text-[#e0e0e0] font-mono">
        <p>No payload detected.</p>
        <Link href="/templates/velocity/products" className="mt-4 text-[#00ffaa] hover:underline">Access the Grid</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-[#0f0f11] text-[#e0e0e0] pt-32 pb-32 min-h-screen font-mono relative">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,170,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,170,0.02)_1px,transparent_1px)] bg-[size:100px_100px] pointer-events-none" />

      <section className="px-6 md:px-12 max-w-7xl mx-auto w-full mb-16 relative z-10">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-[#a0a0a0] mb-8">
          <button onClick={() => setIsCartOpen(true)} className="hover:text-[#00ffaa] transition-colors">Inventory</button>
          <ChevronRight className="w-3 h-3 text-[#00ffaa]" />
          <span className="text-[#00ffaa]">Secure Uplink</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-widest text-white mb-8 border-l-4 border-[#00ffaa] pl-4">
          Data Transfer
        </h1>
      </section>

      <section className="px-6 md:px-12 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
        
        {/* Form */}
        <div className="lg:col-span-7">
          <form onSubmit={handleCheckout} className="space-y-12">
            
            {/* Contact */}
            <div>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-4 text-white uppercase tracking-wider">
                <span className="w-8 h-8 bg-[#00ffaa]/10 border border-[#00ffaa]/30 flex items-center justify-center text-xs text-[#00ffaa]">01</span>
                Contact Information
              </h2>
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <input type="email" required placeholder="Email Address" className="w-full bg-[#1a1a1f] border border-white/10 rounded-none p-4 text-sm focus:outline-none focus:border-[#00ffaa] focus:shadow-[0_0_15px_rgba(0,255,170,0.2)] transition-all placeholder:text-gray-600" />
                </div>
              </div>
            </div>

            {/* Shipping */}
            <div>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-4 text-white uppercase tracking-wider">
                <span className="w-8 h-8 bg-[#00ffaa]/10 border border-[#00ffaa]/30 flex items-center justify-center text-xs text-[#00ffaa]">02</span>
                Shipping Address
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" required placeholder="First Name" className="col-span-1 bg-[#1a1a1f] border border-white/10 rounded-none p-4 text-sm focus:outline-none focus:border-[#00ffaa] transition-all placeholder:text-gray-600" />
                <input type="text" required placeholder="Last Name" className="col-span-1 bg-[#1a1a1f] border border-white/10 rounded-none p-4 text-sm focus:outline-none focus:border-[#00ffaa] transition-all placeholder:text-gray-600" />
                <input type="tel" required placeholder="Phone Number" className="col-span-2 bg-[#1a1a1f] border border-white/10 rounded-none p-4 text-sm focus:outline-none focus:border-[#00ffaa] transition-all placeholder:text-gray-600" />
                <input type="text" required placeholder="Address" className="col-span-2 bg-[#1a1a1f] border border-white/10 rounded-none p-4 text-sm focus:outline-none focus:border-[#00ffaa] transition-all placeholder:text-gray-600" />
                <input type="text" placeholder="Landmark (Optional)" className="col-span-2 bg-[#1a1a1f] border border-white/10 rounded-none p-4 text-sm focus:outline-none focus:border-[#00ffaa] transition-all placeholder:text-gray-600" />
                <input type="text" required placeholder="City" className="col-span-2 md:col-span-1 bg-[#1a1a1f] border border-white/10 rounded-none p-4 text-sm focus:outline-none focus:border-[#00ffaa] transition-all placeholder:text-gray-600" />
                <input type="text" required placeholder="Postal Code" className="col-span-2 md:col-span-1 bg-[#1a1a1f] border border-white/10 rounded-none p-4 text-sm focus:outline-none focus:border-[#00ffaa] transition-all placeholder:text-gray-600" />
              </div>
            </div>

            {/* Payment */}
            <div>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-4 text-white uppercase tracking-wider">
                <span className="w-8 h-8 bg-[#00ffaa]/10 border border-[#00ffaa]/30 flex items-center justify-center text-xs text-[#00ffaa]">03</span>
                Payment Method
              </h2>
              <div className="bg-[#1a1a1f] border border-white/10 p-6 space-y-6">
                
                {/* Payment Method Selector */}
                <div className="grid grid-cols-3 gap-2 p-1 bg-black/50 border border-white/10">
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod("netbanking")}
                    className={`py-3 text-xs font-bold uppercase tracking-wider transition-all ${paymentMethod === "netbanking" ? 'bg-[#00ffaa] text-black shadow-[0_0_15px_rgba(0,255,170,0.3)]' : 'text-white/50 hover:text-white'}`}
                  >
                    Credit Card
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`py-3 text-xs font-bold uppercase tracking-wider transition-all ${paymentMethod === 'upi' ? 'bg-[#00ffaa] text-black shadow-[0_0_15px_rgba(0,255,170,0.3)]' : 'text-white/50 hover:text-white'}`}
                  >
                    UPI
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`py-3 text-xs font-bold uppercase tracking-wider transition-all ${paymentMethod === 'cod' ? 'bg-[#00ffaa] text-black shadow-[0_0_15px_rgba(0,255,170,0.3)]' : 'text-white/50 hover:text-white'}`}
                  >
                    Cash on Delivery
                  </button>
                </div>

                {/* Conditional Inputs */}
                {paymentMethod === "netbanking" && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <input type="text" required placeholder="Card Number" className="w-full bg-transparent border-b border-white/20 py-3 text-sm focus:outline-none focus:border-[#00ffaa] placeholder:text-gray-600" />
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" required placeholder="Expiry (MM/YY)" className="w-full bg-transparent border-b border-white/20 py-3 text-sm focus:outline-none focus:border-[#00ffaa] placeholder:text-gray-600" />
                      <input type="text" required placeholder="CVC" className="w-full bg-transparent border-b border-white/20 py-3 text-sm focus:outline-none focus:border-[#00ffaa] placeholder:text-gray-600" />
                    </div>
                  </div>
                )}

                {paymentMethod === 'upi' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <input type="text" required placeholder="UPI ID" className="w-full bg-transparent border-b border-white/20 py-3 text-sm focus:outline-none focus:border-[#00ffaa] placeholder:text-gray-600" />
                    <p className="text-xs text-[#a0a0a0] italic">Approve the request on your UPI app after placing the order.</p>
                  </div>
                )}

                {paymentMethod === 'cod' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 bg-[#00ffaa]/10 border border-[#00ffaa]/30 text-sm text-[#00ffaa]">
                      Please have exact cash ready when your order arrives.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="my-8"><PremiumPaymentSelector theme="dark" selected={paymentMethod} onSelect={setPaymentMethod} /></div>
              <button 
              type="submit" 
              disabled={isProcessing}
              className={`w-full py-5 font-bold uppercase tracking-widest text-xs flex items-center justify-center transition-all duration-300 ${isProcessing ? 'bg-white/10 text-white cursor-wait' : 'bg-[#00ffaa] text-black hover:bg-white hover:text-black hover:shadow-[0_0_30px_rgba(0,255,170,0.5)]'}`}
            >{isPlacingOrder ? "Processing..." : "{isProcessing ? 'Processing...' : `Place Order - $${finalTotal.toFixed(2)}`}"}</button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-5">
          <div className="bg-[#1a1a1f] border border-white/10 p-8 sticky top-32">
            <h2 className="text-xl font-bold uppercase tracking-widest text-white mb-8 border-l-4 border-[#00ffaa] pl-3">Payload Summary</h2>
            
            <div className="space-y-6 mb-8 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {cart.map((item, index) => (
                <div key={`${item.id}-${index}`} className="flex gap-4">
                  <div className="w-16 h-20 bg-black/50 border border-white/10 overflow-hidden shrink-0 relative">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover opacity-80" />
                    <span className="absolute -top-2 -right-2 bg-[#00ffaa] text-black text-[10px] w-5 h-5 flex items-center justify-center font-bold border border-black">{item.quantity}</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h4 className="font-bold text-sm text-white mb-1 tracking-wide">{item.name}</h4>
                    <p className="text-[10px] uppercase tracking-widest text-[#a0a0a0]">{item.category}</p>
                  </div>
                  <div className="font-bold text-sm text-[#00ffaa] flex items-center">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-6 pt-6 border-t border-white/10">
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-[#00ffaa]/10 border border-[#00ffaa]/30 p-4">
                  <div className="flex items-center gap-3 text-[#00ffaa]">
                    <Tag className="w-4 h-4" />
                    <span className="font-bold text-sm tracking-widest uppercase">{appliedCoupon} Activated</span>
                  </div>
                  <button onClick={removeCoupon} type="button" className="text-white/50 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Auth Code" 
                      className="flex-1 bg-[#1a1a1f] border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-[#00ffaa] transition-colors placeholder:text-[#a0a0a0]"
                    />
                    <button 
                      type="button" 
                      onClick={() => applyCoupon(couponCode)}
                      className="bg-[#00ffaa]/20 hover:bg-[#00ffaa] text-[#00ffaa] hover:text-black border border-[#00ffaa]/50 px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all"
                    >
                      Override
                    </button>
                  </div>
                  {couponError && <p className="text-red-500 text-xs px-1">{couponError}</p>}
                </div>
              )}
            </div>

            <div className="space-y-4 text-sm font-medium border-t border-white/10 pt-6 mb-6">
              <div className="flex justify-between items-center text-[#a0a0a0]">
                <span>Payload Base</span>
                <span className="text-white">{currencySymbol}{totalPrice.toFixed(2)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between items-center text-[#00ffaa]">
                  <span>Discount ({appliedCoupon})</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-[#a0a0a0]">
                <span>Network Tax</span>
                <span className="text-white">{currencySymbol}{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-[#a0a0a0]">
                <span>Drop Fee</span>
                <span className="text-[#00ffaa]">{shipping === 0 ? 'Complimentary' : `${currencySymbol}${shipping.toFixed(2)}`}</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-6 border-t border-white/10">
              <span className="text-xs font-bold uppercase tracking-widest text-[#00ffaa]">Final Protocol</span>
              <span className="text-3xl font-bold text-white">{currencySymbol}{finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

      </section>
    </div>
  );
}
