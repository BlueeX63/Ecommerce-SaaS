"use client";

import { motion } from "framer-motion";
import { useCart } from "../CartContext";
import Link from "next/link";
import { useState, useEffect } from "react";
import { PremiumPaymentSelector, PaymentMethod } from "@/components/storefront/PremiumPaymentSelector";
import { useRouter } from "next/navigation";
import { PremiumLoader } from "@/components/auth/PremiumLoader";
import { ArrowLeft, Check } from "lucide-react";

type CheckoutStep = 'shipping' | 'payment' | 'placed';

export default function EssenceCheckoutPage() {
  const { items, totalPrice, clearCart, appliedCoupon, applyCoupon, removeCoupon, discountAmount, couponError , basePath} = useCart();
  const router = useRouter();
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('shipping');
  const [shippingDetails, setShippingDetails] = useState({ name: '', address: '', mobile: '', landmark: '' });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [couponCode, setCouponCode] = useState("");

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Enforce auth
  useEffect(() => {
    const isMockLoggedIn = localStorage.getItem('mock_template_logged_in');
    if (!isMockLoggedIn) {
      router.push(`${basePath}/auth/login`);
    } else {
      setIsCheckingAuth(false);
    }
  }, [basePath, router]);

  if (isCheckingAuth) return <PremiumLoader />;


  const finalTotal = totalPrice - discountAmount;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode) {
      applyCoupon(couponCode);
      setCouponCode("");
    }
  };

  
  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    setIsPlacingOrder(true);
    try {
      const slug = basePath.split('/').pop();
      const subtotal = items.reduce((sum: number, item: any) => sum + (item.price || item.product?.price || 0) * item.quantity, 0);
      const discount = typeof discountAmount !== 'undefined' ? discountAmount : 0;
      
      const res = await fetch(`/api/v1/store/orders?slug=${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          items: items,
          subtotal: subtotal,
          taxTotal: 0,
          shippingTotal: 0,
          discountTotal: discount,
          grandTotal: subtotal - discount,
          shippingDetails: shippingDetails || { address: 'Not provided' },
          paymentMethod
        })
      });
      if (res.ok) {
        clearCart();
        setCheckoutStep('placed');
      }
    } catch(err) {
      console.error(err);
    } finally {
      setIsPlacingOrder(false);
    }
  }

  if (checkoutStep === 'placed') {
    return (
      <div className="flex flex-col items-center justify-center px-6 min-h-[60vh] bg-[#F3EDE2] w-full pt-12 pb-32 text-[#4A3F35]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-[#E3D8C8]/30 p-16 w-full max-w-xl"
        >
          <div className="w-20 h-20 bg-[#4A3F35] text-[#F3EDE2] rounded-full flex items-center justify-center mx-auto mb-10 shadow-lg">
            <Check className="w-10 h-10" />
          </div>
          <h1 className="font-serif text-4xl mb-6">Order Confirmed</h1>
          <p className="text-sm text-[#4A3F35]/70 leading-relaxed mb-10 max-w-sm mx-auto">
            Your pure rituals are on their way. A confirmation has been delicately placed in your inbox.
          </p>
          <Link 
            href={`\${basePath}/products`}
            className="inline-block bg-[#4A3F35] text-[#F3EDE2] px-10 py-5 text-xs font-bold tracking-[0.2em] uppercase hover:bg-[#332B25] transition-colors w-full sm:w-auto"
          >
            Continue Ritual
          </Link>
        </motion.div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 min-h-[60vh] bg-[#F3EDE2] text-[#4A3F35]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="font-serif text-4xl mb-6">Your cart is empty</h1>
          <p className="text-sm text-[#4A3F35]/70 mb-10">Discover your essence first.</p>
          <Link 
            href={`\${basePath}/products`}
            className="inline-block bg-[#4A3F35] text-[#F3EDE2] px-10 py-5 text-xs font-bold tracking-[0.2em] uppercase hover:bg-[#332B25] transition-colors"
          >
            Shop Collection
          </Link>
        </motion.div>
      </div>
    );
  }

  if (checkoutStep === 'shipping') {
    return (
      <div className="w-full bg-[#F3EDE2] min-h-screen pt-12 pb-32 px-6 md:px-12 text-[#4A3F35]">
        <div className="max-w-[600px] mx-auto">
          <Link href={`\${basePath}/cart`} className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#4A3F35]/50 hover:text-[#4A3F35] transition-colors mb-12 w-fit">
            <ArrowLeft className="w-3 h-3" /> Back to Cart
          </Link>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/50 p-8 md:p-12 shadow-sm"
          >
            <h1 className="font-serif text-3xl mb-2 text-[#4A3F35]">Shipping Information</h1>
            <p className="text-[#4A3F35]/60 mb-10 text-sm">Where should we deliver your rituals?</p>
            
            <form 
              className="flex flex-col gap-6"
              onSubmit={(e) => {
                e.preventDefault();
                setCheckoutStep('payment');
              }}
            >
              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4A3F35]/80">Full Name</label>
                <input 
                  type="text" 
                  id="name" 
                  required
                  value={shippingDetails.name}
                  onChange={(e) => setShippingDetails({...shippingDetails, name: e.target.value})}
                  className="w-full bg-transparent border-b border-[#4A3F35]/20 py-3 text-[#4A3F35] focus:outline-none focus:border-[#4A3F35] transition-colors placeholder:text-[#4A3F35]/30 text-sm rounded-none"
                  placeholder="Jane Doe"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="mobile" className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4A3F35]/80">Phone Number</label>
                <input 
                  type="tel" 
                  id="mobile" 
                  required
                  value={shippingDetails.mobile}
                  onChange={(e) => setShippingDetails({...shippingDetails, mobile: e.target.value})}
                  className="w-full bg-transparent border-b border-[#4A3F35]/20 py-3 text-[#4A3F35] focus:outline-none focus:border-[#4A3F35] transition-colors placeholder:text-[#4A3F35]/30 text-sm rounded-none"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="address" className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4A3F35]/80">Delivery Address</label>
                <textarea 
                  id="address" 
                  required
                  rows={3}
                  value={shippingDetails.address}
                  onChange={(e) => setShippingDetails({...shippingDetails, address: e.target.value})}
                  className="w-full bg-transparent border-b border-[#4A3F35]/20 py-3 text-[#4A3F35] focus:outline-none focus:border-[#4A3F35] transition-colors placeholder:text-[#4A3F35]/30 text-sm rounded-none resize-none"
                  placeholder="123 Ritual Way, Suite 100&#10;New York, NY 10001"
                />
              </div>

<div className="flex flex-col gap-2">
                <label htmlFor="address" className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4A3F35]/80">Landmark (Optional)</label>
                <textarea 
                  id="landmark" 
                  
                  rows={1}
                  value={shippingDetails.landmark}
                  onChange={(e) => setShippingDetails({...shippingDetails, address: e.target.value})}
                  className="w-full bg-transparent border-b border-[#4A3F35]/20 py-3 text-[#4A3F35] focus:outline-none focus:border-[#4A3F35] transition-colors placeholder:text-[#4A3F35]/30 text-sm rounded-none resize-none"
                  placeholder="e.g. Near Central Park"
                />
              </div>

              <div className="mt-8">
                <button 
                  type="submit"
                  className="w-full bg-[#4A3F35] text-[#F3EDE2] py-5 text-xs font-bold tracking-[0.2em] uppercase hover:bg-[#332B25] transition-colors"
                >
                  Continue to Payment
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
      <div className="w-full bg-[#F3EDE2] min-h-screen pt-12 pb-32 px-6 md:px-12 text-[#4A3F35]">
        <div className="max-w-[600px] mx-auto">
          <button onClick={() => setCheckoutStep('shipping')} className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#4A3F35]/50 hover:text-[#4A3F35] transition-colors mb-12 w-fit">
            <ArrowLeft className="w-3 h-3" /> Back to Shipping
          </button>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/50 p-8 md:p-12 shadow-sm"
          >
            <h1 className="font-serif text-3xl mb-10 text-[#4A3F35]">Review & Pay</h1>
            
            <div className="bg-[#E3D8C8]/30 p-6 mb-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4A3F35]/70 border-b border-[#4A3F35]/10 pb-3 mb-4">Shipping Destination</h3>
              <p className="text-sm font-medium text-[#4A3F35] mb-1">{shippingDetails.name}</p>
              <p className="text-sm text-[#4A3F35]/60 mb-2">{shippingDetails.mobile}</p>
              <p className="text-sm text-[#4A3F35]/60 whitespace-pre-line leading-relaxed">{shippingDetails.address}</p>
            {shippingDetails.landmark && <p className="text-sm text-[#4A3F35]/60 whitespace-pre-line leading-relaxed">Landmark: {shippingDetails.landmark}</p>}
            </div>

            <div className="bg-[#E3D8C8]/30 p-6 mb-10">
              <PremiumPaymentSelector theme="light" selected={paymentMethod} onSelect={setPaymentMethod} />

          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4A3F35]/70 border-b border-[#4A3F35]/10 pb-3 mb-4">Promotional Code</h3>
              {appliedCoupon ? (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-[#4A3F35]">{appliedCoupon}</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-green-700 ml-4">-${discountAmount.toFixed(2)} Applied</span>
                  </div>
                  <button onClick={removeCoupon} className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4A3F35]/50 hover:text-[#4A3F35] transition-colors">
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
                    className="flex-1 bg-transparent border-b border-[#4A3F35]/20 py-2 text-[#4A3F35] focus:outline-none focus:border-[#4A3F35] transition-colors placeholder:text-[#4A3F35]/30 text-sm rounded-none"
                  />
                  <button type="submit" className="px-6 bg-[#4A3F35] text-[#F3EDE2] text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#332B25] transition-colors">
                    Apply
                  </button>
                </form>
              )}
              {couponError && <p className="text-red-700 text-xs mt-3">{couponError}</p>}
            </div>

            <div className="flex justify-between items-center mb-8 border-t border-[#4A3F35]/10 pt-8">
              <span className="font-bold tracking-[0.2em] uppercase text-xs text-[#4A3F35]/70">Final Total</span>
              <span className="font-serif text-2xl italic">${finalTotal.toFixed(2)}</span>
            </div>

            <button 
              onClick={() => {
                clearCart();
                setCheckoutStep('placed');
              }}
              className="w-full bg-[#4A3F35] text-[#F3EDE2] py-5 text-xs font-bold tracking-[0.2em] uppercase hover:bg-[#332B25] transition-colors"
            >
              Complete Order
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return null;
}
