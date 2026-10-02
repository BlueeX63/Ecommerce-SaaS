"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { PremiumPaymentSelector, PaymentMethod } from "@/components/storefront/PremiumPaymentSelector";
import { PremiumLoader } from "@/components/auth/PremiumLoader";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight, PackageCheck, Tag, X } from "lucide-react";
import { useQuantum } from "../QuantumContext";

export default function QuantumCheckoutPage({
  initialOnlinePaymentsEnabled,
  initialSlug,
}: { initialOnlinePaymentsEnabled?: boolean; initialSlug?: string } = {}) {
  const { basePath, cart, clearCart, setIsCartOpen, appliedCoupon, discountAmount, couponError, applyCoupon, removeCoupon , currencySymbol  } = useQuantum();
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);
  const allowedPaymentMethods = initialOnlinePaymentsEnabled === false ? (["cod"] as const) : undefined;
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initialOnlinePaymentsEnabled === false ? "cod" : "upi");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [shippingDetails, setShippingDetails] = useState({ firstName: '', lastName: '', phone: '', address: '', landmark: '', city: '', zip: '' });

  const slug = initialSlug || (typeof window !== 'undefined' && window.location.pathname.startsWith('/store/') ? window.location.pathname.split('/')[2] : '');

  // Enforce auth: verify the real shopper session with the backend and prefill contact details.
  useEffect(() => {
    fetch('/api/v1/store/profile')
      .then((res) => {
        if (!res.ok) throw new Error('unauthenticated');
        return res.json();
      })
      .then((profile) => {
        setShippingDetails((prev) => ({
          ...prev,
          firstName: prev.firstName || profile.first_name || '',
          lastName: prev.lastName || profile.last_name || '',
          phone: prev.phone || profile.phone_number || '',
        }));
        setIsCheckingAuth(false);
      })
      .catch(() => {
        router.push(`${basePath}/auth/login?next=${encodeURIComponent(window.location.pathname)}`);
      });
  }, [basePath, router]);

  const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const discountedTotal = Math.max(0, totalPrice - discountAmount);
  const tax = discountedTotal * 0.08;
  const shipping = totalPrice > 0 ? (totalPrice > 500 ? 0 : 50) : 0;
  const finalTotal = discountedTotal + tax + shipping;

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsPlacingOrder(true);
    try {
      const res = await fetch(`/api/v1/store/orders?slug=${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          items: cart,
          shippingDetails: {
            address: [shippingDetails.address, shippingDetails.landmark].filter(Boolean).join(', '),
            city: shippingDetails.city,
            zip: shippingDetails.zip,
          },
          couponCode: appliedCoupon || undefined,
          paymentMethod,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        clearCart();
        setIsSuccess(true);
      } else {
        setError(data.error || 'Failed to place order. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  }

  if (isCheckingAuth) return <PremiumLoader />;

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F9F9FB] text-[#121212] p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white p-12 rounded-[2rem] text-center max-w-lg w-full shadow-sm border border-gray-100"
        >
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-gray-100 shadow-inner">
            <PackageCheck className="w-10 h-10 text-[#111111]" />
          </div>
          <h1 className="font-playfair text-3xl font-bold mb-4 text-[#111111]">Order Secured</h1>
          <p className="font-inter text-gray-500 text-sm mb-8 leading-relaxed">
            Your artifacts have been successfully reserved. A detailed confirmation has been dispatched to your email.
          </p>
          <div className="flex flex-col gap-4">
            <Link
              href={`${basePath}/profile`}
              className="w-full py-4 bg-[#111111] text-white font-inter font-bold uppercase tracking-widest text-xs hover:bg-gray-800 transition-colors rounded-xl text-center"
            >
              View Order Details
            </Link>
            <Link
              href={`${basePath}/products`}
              className="w-full py-4 bg-transparent border border-gray-200 text-[#111111] font-inter font-bold uppercase tracking-widest text-xs hover:bg-gray-50 transition-colors rounded-xl text-center"
            >
              Continue Exploring
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F9F9FB] text-[#121212] font-inter">
        <p className="text-gray-500 mb-4">Your collection is empty.</p>
        <Link href={`${basePath}/products`} className="text-[#111111] font-bold underline hover:text-gray-600 transition-colors">Return to Gallery</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-[#F9F9FB] text-[#121212] pt-32 pb-32 min-h-screen">
      <section className="px-6 md:px-12 max-w-[1600px] mx-auto w-full mb-16">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-gray-400 mb-8 font-inter">
          <button onClick={() => setIsCartOpen(true)} className="hover:text-[#111111] transition-colors">Cart</button>
          <ChevronRight className="w-3 h-3 text-gray-300" />
          <span className="text-[#111111]">Checkout</span>
        </div>
        <h1 className="font-playfair text-5xl md:text-6xl font-bold text-[#111111]">
          Checkout
        </h1>
      </section>

      <section className="px-6 md:px-12 max-w-[1600px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">

        {/* Form */}
        <div className="lg:col-span-7">
          <form onSubmit={handlePlaceOrder} className="space-y-12">

            {/* Contact */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="font-playfair text-xl font-bold mb-6 text-[#111111]">
                1. Contact Information
              </h2>
              <div className="space-y-4">
                <input type="email" required placeholder="Email Address" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:border-[#111111] transition-colors font-inter placeholder:text-gray-400" />
              </div>
            </div>

            {/* Shipping */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="font-playfair text-xl font-bold mb-6 text-[#111111]">
                2. Shipping Address
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" value={shippingDetails.firstName} onChange={(e) => setShippingDetails({ ...shippingDetails, firstName: e.target.value })} required placeholder="First Name" className="col-span-1 bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:border-[#111111] transition-colors font-inter placeholder:text-gray-400" />
                <input type="text" value={shippingDetails.lastName} onChange={(e) => setShippingDetails({ ...shippingDetails, lastName: e.target.value })} required placeholder="Last Name" className="col-span-1 bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:border-[#111111] transition-colors font-inter placeholder:text-gray-400" />
                <input type="tel" value={shippingDetails.phone} onChange={(e) => setShippingDetails({ ...shippingDetails, phone: e.target.value })} required placeholder="Phone Number" className="col-span-2 bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:border-[#111111] transition-colors font-inter placeholder:text-gray-400" />
                <input type="text" value={shippingDetails.address} onChange={(e) => setShippingDetails({ ...shippingDetails, address: e.target.value })} required placeholder="Address" className="col-span-2 bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:border-[#111111] transition-colors font-inter placeholder:text-gray-400" />
                <input type="text" value={shippingDetails.landmark} onChange={(e) => setShippingDetails({ ...shippingDetails, landmark: e.target.value })} placeholder="Landmark (Optional)" className="col-span-2 bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:border-[#111111] transition-colors font-inter placeholder:text-gray-400" />
                <input type="text" value={shippingDetails.city} onChange={(e) => setShippingDetails({ ...shippingDetails, city: e.target.value })} required placeholder="City" className="col-span-2 md:col-span-1 bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:border-[#111111] transition-colors font-inter placeholder:text-gray-400" />
                <input type="text" value={shippingDetails.zip} onChange={(e) => setShippingDetails({ ...shippingDetails, zip: e.target.value })} required placeholder="Postal Code" className="col-span-2 md:col-span-1 bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:border-[#111111] transition-colors font-inter placeholder:text-gray-400" />
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="font-playfair text-xl font-bold mb-6 text-[#111111]">
                3. Payment Details
              </h2>
              <div className="space-y-6">
                {initialOnlinePaymentsEnabled === false ? (
                  <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-600 font-inter">
                    This store currently accepts Cash on Delivery only. Pay with cash upon delivery.
                  </div>
                ) : (
                  <>
                    <PremiumPaymentSelector theme="light" selected={paymentMethod} onSelect={setPaymentMethod} allowedMethods={allowedPaymentMethods ? [...allowedPaymentMethods] : undefined} />
                    {paymentMethod === "upi" && (
                      <p className="text-xs text-gray-500 italic font-inter">You will receive a payment request on your UPI app after confirming the order.</p>
                    )}
                    {paymentMethod === "cod" && (
                      <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-600 font-inter">
                        Pay with cash upon delivery. Please ensure exact change is available.
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {error && <p className="text-red-500 text-sm -mt-6">{error}</p>}

            <button
              type="submit"
              disabled={isPlacingOrder}
              className={`w-full py-5 rounded-xl font-bold font-inter uppercase tracking-widest text-xs flex items-center justify-center transition-all duration-300 ${isPlacingOrder ? 'bg-gray-200 text-gray-400 cursor-wait' : 'bg-[#111111] text-white hover:bg-gray-800 shadow-lg hover:shadow-xl'}`}
            >{isPlacingOrder ? "Processing..." : paymentMethod === 'cod' ? 'Confirm Order' : `Pay $${finalTotal.toFixed(2)}`}</button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-gray-100 p-8 rounded-3xl sticky top-32 shadow-sm">
            <h2 className="font-playfair text-xl font-bold text-[#111111] mb-8">Order Summary</h2>

            <div className="space-y-6 mb-8 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {cart.map((item, index) => (
                <div key={`${item.id}-${index}`} className="flex gap-4">
                  <div className="w-16 h-20 bg-gray-100 rounded-xl overflow-hidden shrink-0 relative">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    <span className="absolute -top-2 -right-2 bg-[#111111] text-white text-[10px] w-5 h-5 flex items-center justify-center font-bold rounded-full">{item.quantity}</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h4 className="font-bold text-sm text-[#111111] font-playfair mb-1">{item.name}</h4>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-inter">{item.category}</p>
                  </div>
                  <div className="font-bold text-sm text-[#111111] font-inter flex items-center">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-6 pt-6 border-t border-gray-100 font-inter">
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-3 text-[#111111]">
                    <Tag className="w-4 h-4 text-gray-500" />
                    <span className="font-bold text-sm tracking-widest uppercase">{appliedCoupon} Applied</span>
                  </div>
                  <button onClick={removeCoupon} type="button" className="text-gray-400 hover:text-gray-800 transition-colors">
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
                      placeholder="Discount Code"
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#111111] transition-colors placeholder:text-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => applyCoupon(couponCode)}
                      className="bg-[#111111] hover:bg-gray-800 text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && <p className="text-red-500 text-xs px-2 mt-1">{couponError}</p>}
                </div>
              )}
            </div>

            <div className="space-y-4 text-sm font-medium border-t border-gray-100 pt-6 mb-6 font-inter">
              <div className="flex justify-between items-center text-gray-500">
                <span>Subtotal</span>
                <span className="text-[#111111]">{currencySymbol}{totalPrice.toFixed(2)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between items-center text-gray-800">
                  <span>Discount ({appliedCoupon})</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-gray-500">
                <span>Estimated Tax</span>
                <span className="text-[#111111]">{currencySymbol}{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-500">
                <span>Shipping</span>
                <span className="text-[#111111]">{shipping === 0 ? 'Free' : `${currencySymbol}${shipping.toFixed(2)}`}</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-gray-100 font-inter">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Total</span>
              <span className="text-3xl font-bold text-[#111111] font-playfair">{currencySymbol}{finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

      </section>
    </div>
  );
}
