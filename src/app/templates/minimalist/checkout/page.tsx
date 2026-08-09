"use client";

import { motion } from "framer-motion";
import { useCart } from "../CartContext";
import Link from "next/link";
import { useState, useEffect } from "react";
import { PremiumPaymentSelector, PaymentMethod } from "@/components/storefront/PremiumPaymentSelector";
import { useRouter } from "next/navigation";
import { PremiumLoader } from "@/components/auth/PremiumLoader";
import { ChevronRight } from "lucide-react";

type CheckoutStep = 'shipping' | 'payment' | 'placed';

export default function StarterCheckoutPage() {
  const { items, totalPrice, clearCart, currencySymbol, appliedCoupon, applyCoupon, removeCoupon, discountAmount, couponError , basePath} = useCart();
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
      <div className="flex-grow flex flex-col items-center justify-center px-6 min-h-[60vh]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-[#111111] text-white rounded-full flex items-center justify-center mx-auto mb-8">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-heading text-4xl mb-4 text-[#111111]">Order Placed</h1>
          <p className="text-black/50 mb-8 max-w-sm mx-auto">
            Thank you for your purchase. We've sent a confirmation email with your order details.
          </p>
          <Link 
            href={`\${basePath}/products`}
            className="inline-block bg-[#111111] text-white px-8 py-4 text-xs font-bold tracking-widest uppercase hover:bg-[#FF4D00] transition-colors"
          >
            Continue Shopping
          </Link>
        </motion.div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center px-6 min-h-[60vh]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="font-heading text-4xl mb-4 text-[#111111]">Your cart is empty</h1>
          <p className="text-black/50 mb-8">You need items in your cart to checkout.</p>
          <Link 
            href={`\${basePath}/products`}
            className="inline-block bg-[#111111] text-white px-8 py-4 text-xs font-bold tracking-widest uppercase hover:bg-[#FF4D00] transition-colors"
          >
            Shop Collection
          </Link>
        </motion.div>
      </div>
    );
  }

  if (checkoutStep === 'shipping') {
    return (
      <div className="flex-grow flex flex-col items-center justify-center px-6 min-h-[60vh] py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-black/40 mb-8">
            <Link href={`\${basePath}/cart`} className="hover:text-[#111111] transition-colors">Cart</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#111111]">Shipping</span>
          </div>

          <h1 className="font-heading text-4xl mb-2 text-[#111111]">Shipping Details</h1>
          <p className="text-black/50 mb-8 text-sm">Where should we send your minimalist essentials?</p>
          
          <form 
            className="flex flex-col gap-6"
            onSubmit={(e) => {
              e.preventDefault();
              setCheckoutStep('payment');
            }}
          >
            <div className="flex flex-col gap-1">
              <label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-[#111111]">Full Name</label>
              <input 
                type="text" 
                id="name" 
                required
                value={shippingDetails.name}
                onChange={(e) => setShippingDetails({...shippingDetails, name: e.target.value})}
                className="w-full bg-transparent border-b border-black/20 py-3 text-[#111111] focus:outline-none focus:border-[#FF4D00] transition-colors placeholder:text-black/20 rounded-none"
                placeholder="Jane Doe"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="mobile" className="text-xs font-bold uppercase tracking-widest text-[#111111]">Phone Number</label>
              <input 
                type="tel" 
                id="mobile" 
                required
                value={shippingDetails.mobile}
                onChange={(e) => setShippingDetails({...shippingDetails, mobile: e.target.value})}
                className="w-full bg-transparent border-b border-black/20 py-3 text-[#111111] focus:outline-none focus:border-[#FF4D00] transition-colors placeholder:text-black/20 rounded-none"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="address" className="text-xs font-bold uppercase tracking-widest text-[#111111]">Delivery Address</label>
              <textarea 
                id="address" 
                required
                rows={3}
                value={shippingDetails.address}
                onChange={(e) => setShippingDetails({...shippingDetails, address: e.target.value})}
                className="w-full bg-transparent border-b border-black/20 py-3 text-[#111111] focus:outline-none focus:border-[#FF4D00] transition-colors placeholder:text-black/20 rounded-none resize-none"
                placeholder="123 Minimalist Way, Suite 100&#10;New York, NY 10001"
              />
            </div>

<div className="flex flex-col gap-1">
              <label htmlFor="address" className="text-xs font-bold uppercase tracking-widest text-[#111111]">Landmark (Optional)</label>
              <textarea 
                id="landmark" 
                
                rows={1}
                value={shippingDetails.landmark}
                onChange={(e) => setShippingDetails({...shippingDetails, address: e.target.value})}
                className="w-full bg-transparent border-b border-black/20 py-3 text-[#111111] focus:outline-none focus:border-[#FF4D00] transition-colors placeholder:text-black/20 rounded-none resize-none"
                placeholder="e.g. Near Central Park"
              />
            </div>

            <div className="flex gap-4 mt-6">
              <Link 
                href={`\${basePath}/cart`}
                className="flex-1 bg-transparent border border-[#111111] text-[#111111] py-4 text-xs font-bold tracking-widest uppercase hover:bg-black/5 transition-colors text-center"
              >
                Back to Cart
              </Link>
              <button 
                type="submit"
                className="flex-[2] bg-[#111111] text-white py-4 text-xs font-bold tracking-widest uppercase hover:bg-[#FF4D00] transition-colors"
              >
                Continue to Payment
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  if (checkoutStep === 'payment') {
    return (
      <div className="flex-grow flex flex-col items-center justify-center px-6 min-h-[60vh] py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-black/40 mb-8">
            <Link href={`\${basePath}/cart`} className="hover:text-[#111111] transition-colors">Cart</Link>
            <ChevronRight className="w-3 h-3" />
            <button onClick={() => setCheckoutStep('shipping')} className="hover:text-[#111111] transition-colors">Shipping</button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#111111]">Payment</span>
          </div>

          <h1 className="font-heading text-4xl mb-8 text-[#111111]">Review & Pay</h1>
          
          <div className="bg-white p-6 border border-black/5 mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#111111] border-b border-black/10 pb-3 mb-4">Shipping To</h3>
            <p className="text-sm font-medium text-[#111111]">{shippingDetails.name}</p>
            <p className="text-sm text-black/60 mb-1">{shippingDetails.mobile}</p>
            <p className="text-sm text-black/60 whitespace-pre-line">{shippingDetails.address}</p>
            {shippingDetails.landmark && <p className="text-sm text-black/60 whitespace-pre-line">Landmark: {shippingDetails.landmark}</p>}
            <button 
              onClick={() => setCheckoutStep('shipping')}
              className="text-xs font-bold tracking-widest text-[#FF4D00] uppercase mt-4 hover:text-[#111111] transition-colors"
            >
              Edit Details
            </button>
          </div>

          <div className="bg-white p-6 border border-black/5 mb-8">
            <PremiumPaymentSelector theme="light" selected={paymentMethod} onSelect={setPaymentMethod} />

          <h3 className="text-xs font-bold uppercase tracking-widest text-[#111111] border-b border-black/10 pb-3 mb-4">Promotional Code</h3>
            {appliedCoupon ? (
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-[#111111]">{appliedCoupon}</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-green-600 ml-4">-{currencySymbol}{discountAmount.toFixed(2)} Applied</span>
                </div>
                <button onClick={removeCoupon} className="text-xs font-bold uppercase tracking-widest text-black/50 hover:text-[#111111] transition-colors">
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
                  className="flex-1 bg-transparent border-b border-black/20 py-2 text-[#111111] focus:outline-none focus:border-[#FF4D00] transition-colors placeholder:text-black/30 text-sm rounded-none"
                />
                <button type="submit" className="px-6 bg-[#111111] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#FF4D00] transition-colors">
                  Apply
                </button>
              </form>
            )}
            {couponError && <p className="text-red-500 text-xs mt-3">{couponError}</p>}
          </div>

          <div className="flex justify-between items-center mb-8 border-t border-black/10 pt-6">
            <span className="font-bold tracking-widest uppercase text-xs">Total Amount</span>
            <span className="font-medium text-xl">{currencySymbol}{(finalTotal + (finalTotal > 100 ? 0 : 10)).toFixed(2)}</span>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => setCheckoutStep('shipping')}
              className="flex-1 bg-transparent border border-[#111111] text-[#111111] py-4 text-xs font-bold tracking-widest uppercase hover:bg-black/5 transition-colors"
            >
              Back
            </button>
            <button 
              onClick={() => {
                clearCart();
                setCheckoutStep('placed');
              }}
              className="flex-[2] bg-[#111111] text-white py-4 text-xs font-bold tracking-widest uppercase hover:bg-[#FF4D00] transition-colors"
            >
              Place Order
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
}
