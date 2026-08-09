"use client";

import { motion } from "framer-motion";
import { useCart } from "../CartContext";
import Link from "next/link";
import { useState, useEffect } from "react";
import { PremiumPaymentSelector, PaymentMethod } from "@/components/storefront/PremiumPaymentSelector";
import { useRouter } from "next/navigation";
import { PremiumLoader } from "@/components/auth/PremiumLoader";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

type CheckoutStep = 'shipping' | 'payment' | 'placed';

export default function CanvasCheckoutPage() {
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


  const subtotal = totalPrice;
  const tax = (subtotal - discountAmount) * 0.08;
  const shipping = subtotal > 0 ? 15.00 : 0;
  const finalTotal = subtotal - discountAmount + tax + shipping;

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
      <div className="flex flex-col items-center justify-center px-6 min-h-screen bg-black text-white">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-xl text-center border border-white/20 p-16 relative"
        >
          <div className="absolute top-0 left-0 w-2 h-2 bg-white -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute top-0 right-0 w-2 h-2 bg-white translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-2 h-2 bg-white -translate-x-1/2 translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-2 h-2 bg-white translate-x-1/2 translate-y-1/2" />

          <div className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center mx-auto mb-10">
            <Check className="w-10 h-10" />
          </div>
          <h1 className="font-serif text-5xl md:text-6xl tracking-tighter uppercase leading-[0.8] mb-8">
            Verified.
          </h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-12 leading-loose max-w-sm mx-auto">
            Acquisition complete. We have cataloged your order details in your inbox.
          </p>
          <Link 
            href={`\${basePath}/products`}
            className="border border-white/30 px-8 py-5 text-[10px] uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-colors inline-block w-full sm:w-auto"
          >
            Return to Index
          </Link>
        </motion.div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 min-h-screen bg-black text-white">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-12 md:p-24 border border-white/20 relative w-full max-w-xl"
        >
          <div className="absolute top-0 left-0 w-2 h-2 bg-white -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute top-0 right-0 w-2 h-2 bg-white translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-2 h-2 bg-white -translate-x-1/2 translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-2 h-2 bg-white translate-x-1/2 translate-y-1/2" />

          <h3 className="font-serif text-4xl italic tracking-tighter text-white mb-6">Null.</h3>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-12 leading-loose">
            Your archive is currently empty. Checkout aborted.
          </p>
          <Link 
            href={`\${basePath}/products`}
            className="border border-white/30 px-8 py-4 text-[10px] uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-colors inline-block"
          >
            Return to Index
          </Link>
        </motion.div>
      </div>
    );
  }

  if (checkoutStep === 'shipping') {
    return (
      <div className="w-full bg-black min-h-screen pt-32 pb-32 px-6 md:px-12 text-white">
        <div className="max-w-[800px] mx-auto">
          <Link href={`\${basePath}/cart`} className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors mb-12 w-fit">
            <ArrowLeft className="w-4 h-4" /> [ Abort Checkout ]
          </Link>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-white/20 p-8 md:p-16 relative"
          >
            <div className="absolute top-0 left-0 w-2 h-2 bg-white -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute top-0 right-0 w-2 h-2 bg-white translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-2 h-2 bg-white -translate-x-1/2 translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-2 h-2 bg-white translate-x-1/2 translate-y-1/2" />

            <h1 className="font-serif text-4xl md:text-5xl tracking-tighter uppercase mb-4">Shipping.</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-16 border-b border-white/20 pb-8">
              Enter your shipping address
            </p>
            
            <form 
              className="flex flex-col gap-8"
              onSubmit={(e) => {
                e.preventDefault();
                setCheckoutStep('payment');
              }}
            >
              <div className="flex flex-col gap-4">
                <label htmlFor="name" className="text-[10px] font-mono tracking-widest uppercase text-white/80">Full Name</label>
                <input 
                  type="text" 
                  id="name" 
                  required
                  value={shippingDetails.name}
                  onChange={(e) => setShippingDetails({...shippingDetails, name: e.target.value})}
                  className="w-full bg-transparent border-b border-white/30 py-4 text-white focus:outline-none focus:border-white transition-colors placeholder:text-white/20 text-sm font-mono rounded-none"
                  placeholder="John Doe"
                />
              </div>

              <div className="flex flex-col gap-4">
                <label htmlFor="mobile" className="text-[10px] font-mono tracking-widest uppercase text-white/80">Phone Number</label>
                <input 
                  type="tel" 
                  id="mobile" 
                  required
                  value={shippingDetails.mobile}
                  onChange={(e) => setShippingDetails({...shippingDetails, mobile: e.target.value})}
                  className="w-full bg-transparent border-b border-white/30 py-4 text-white focus:outline-none focus:border-white transition-colors placeholder:text-white/20 text-sm font-mono rounded-none"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="flex flex-col gap-4">
                <label htmlFor="address" className="text-[10px] font-mono tracking-widest uppercase text-white/80">Delivery Address</label>
                <textarea 
                  id="address" 
                  required
                  rows={3}
                  value={shippingDetails.address}
                  onChange={(e) => setShippingDetails({...shippingDetails, address: e.target.value})}
                  className="w-full bg-transparent border-b border-white/30 py-4 text-white focus:outline-none focus:border-white transition-colors placeholder:text-white/20 text-sm font-mono rounded-none resize-none"
                  placeholder="123 Example Street, Apt 4B&#10;New York, NY 10001"
                />
              </div>

<div className="flex flex-col gap-4">
                <label htmlFor="address" className="text-[10px] font-mono tracking-widest uppercase text-white/80">Landmark (Optional)</label>
                <textarea 
                  id="landmark" 
                  
                  rows={1}
                  value={shippingDetails.landmark}
                  onChange={(e) => setShippingDetails({...shippingDetails, address: e.target.value})}
                  className="w-full bg-transparent border-b border-white/30 py-4 text-white focus:outline-none focus:border-white transition-colors placeholder:text-white/20 text-sm font-mono rounded-none resize-none"
                  placeholder="e.g. Near Central Park"
                />
              </div>

              <div className="mt-12">
                <button 
                  type="submit"
                  className="w-full border border-white/30 text-[10px] uppercase tracking-[0.2em] flex items-center justify-between px-8 py-6 hover:bg-white hover:text-black transition-colors duration-500"
                >
                  <span>Proceed to Payment</span>
                  <ArrowRight className="w-4 h-4" />
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
      <div className="w-full bg-black min-h-screen pt-32 pb-32 px-6 md:px-12 text-white">
        <div className="max-w-[800px] mx-auto">
          <button onClick={() => setCheckoutStep('shipping')} className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors mb-12 w-fit">
            <ArrowLeft className="w-4 h-4" /> [ Edit Coordinates ]
          </button>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-white/20 p-8 md:p-16 relative"
          >
            <div className="absolute top-0 left-0 w-2 h-2 bg-white -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute top-0 right-0 w-2 h-2 bg-white translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-2 h-2 bg-white -translate-x-1/2 translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-2 h-2 bg-white translate-x-1/2 translate-y-1/2" />

            <h1 className="font-serif text-4xl md:text-5xl tracking-tighter uppercase mb-12">Review & Pay.</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
              <div className="space-y-6">
                <h3 className="text-[10px] font-mono tracking-widest uppercase text-white/50 border-b border-white/20 pb-4">Shipping Details</h3>
                <p className="font-mono text-sm text-white mb-2">{shippingDetails.name}</p>
                <p className="font-mono text-xs text-white/70 mb-2">{shippingDetails.mobile}</p>
                <p className="font-mono text-xs text-white/70 whitespace-pre-line leading-relaxed">{shippingDetails.address}</p>
            {shippingDetails.landmark && <p className="font-mono text-xs text-white/70 whitespace-pre-line leading-relaxed">Landmark: {shippingDetails.landmark}</p>}
              </div>

              <div className="space-y-6">
                <PremiumPaymentSelector theme="dark" selected={paymentMethod} onSelect={setPaymentMethod} />
              </div>

          <h3 className="text-[10px] font-mono tracking-widest uppercase text-white/50 mb-6">Promotional Code</h3>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-white/5 p-4 border border-white/20">
                  <div>
                    <span className="text-sm font-mono text-white">{appliedCoupon}</span>
                    <span className="text-[10px] uppercase tracking-widest text-green-400 ml-4">-${discountAmount.toFixed(2)} Applied</span>
                  </div>
                  <button onClick={removeCoupon} className="text-[10px] uppercase tracking-[0.2em] hover:text-white/50 transition-colors">
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
                    className="flex-1 bg-transparent border-b border-white/30 py-4 text-white focus:outline-none focus:border-white transition-colors placeholder:text-white/20 text-sm font-mono rounded-none"
                  />
                  <button type="submit" className="px-8 border border-white/30 text-[10px] uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-colors">
                    Apply
                  </button>
                </form>
              )}
              {couponError && <p className="text-red-400 text-xs mt-4 font-mono">{couponError}</p>}
            </div>

            <div className="flex justify-between items-center mb-12 border-t border-white/20 pt-12">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/50">Total Due</span>
              <span className="font-serif text-5xl tracking-tighter">${finalTotal.toFixed(2)}</span>
            </div>

            <button 
              onClick={() => {
                clearCart();
                setCheckoutStep('placed');
              }}
              className="w-full bg-white text-black border border-white text-[10px] uppercase tracking-[0.2em] flex items-center justify-between px-8 py-6 hover:bg-transparent hover:text-white transition-colors duration-500"
            >
              <span>Place Order</span>
              <Check className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return null;
}
