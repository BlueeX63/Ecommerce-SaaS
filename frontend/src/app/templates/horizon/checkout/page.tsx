"use client";

import { motion } from "framer-motion";
import { useHorizon } from "../HorizonContext";
import Link from "next/link";
import { useState, useEffect } from "react";
import { PremiumPaymentSelector, PaymentMethod } from "@/components/storefront/PremiumPaymentSelector";
import { useRouter } from "next/navigation";
import { PremiumLoader } from "@/components/auth/PremiumLoader";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

type CheckoutStep = "shipping" | "payment" | "placed";

export default function HorizonCheckoutPage({ initialOnlinePaymentsEnabled }: { initialOnlinePaymentsEnabled?: boolean } = {}) {
  const allowedPaymentMethods = initialOnlinePaymentsEnabled === false ? (["cod"] as const) : undefined;
  const { cart, currencySymbol, clearCart, appliedCoupon, applyCoupon, removeCoupon, discountAmount, couponError, basePath } = useHorizon();
  const router = useRouter();
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("shipping");
  const [shippingDetails, setShippingDetails] = useState({ name: "", address: "", mobile: "", landmark: "" });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initialOnlinePaymentsEnabled === false ? "cod" : "upi");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    fetch("/api/v1/store/profile")
      .then((res) => {
        if (!res.ok) throw new Error("unauthenticated");
        return res.json();
      })
      .then((profile) => {
        setShippingDetails((prev) => ({
          ...prev,
          name: prev.name || `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim(),
          mobile: prev.mobile || profile.phone_number || "",
        }));
        setIsCheckingAuth(false);
      })
      .catch(() => {
        router.push(`${basePath}/auth/login?next=${encodeURIComponent(window.location.pathname)}`);
      });
  }, [basePath, router]);

  if (isCheckingAuth) return <PremiumLoader />;

  const totalPrice = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const subtotal = totalPrice;
  const tax = (subtotal - discountAmount) * 0.08;
  const shipping = subtotal > 0 ? 15.0 : 0;
  const finalTotal = subtotal - discountAmount + tax + shipping;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode) {
      applyCoupon(couponCode);
      setCouponCode("");
    }
  };

  async function handlePlaceOrder() {
    setOrderError(null);
    setIsPlacingOrder(true);
    try {
      const slug = basePath.split("/").pop();
      const res = await fetch(`/api/v1/store/orders?slug=${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          items: cart,
          shippingDetails: {
            address: [shippingDetails.address, shippingDetails.landmark].filter(Boolean).join(", "),
            mobile: shippingDetails.mobile,
          },
          couponCode: appliedCoupon || undefined,
          paymentMethod,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        clearCart();
        setCheckoutStep("placed");
      } else {
        setOrderError(data.error || "Failed to place order. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setOrderError("Failed to place order. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  }

  if (checkoutStep === "placed") {
    return (
      <div className="flex flex-col items-center justify-center px-6 min-h-screen bg-[#FAFAFA] text-[#111]">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-xl text-center bg-white border border-black/5 p-16 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
          <div className="w-16 h-16 rounded-full border border-black/10 bg-black/5 flex items-center justify-center mx-auto mb-10">
            <Check className="w-7 h-7 text-black" strokeWidth={1.5} />
          </div>
          <h1 className="font-cormorant text-5xl md:text-6xl font-light italic tracking-tight mb-6">Order Confirmed.</h1>
          <p className="font-outfit text-sm text-black/50 mb-12 leading-relaxed max-w-sm mx-auto">
            Thank you. Your order has been received and is being prepared. A confirmation has been sent to your account.
          </p>
          <Link href={`${basePath}/products`} className="font-outfit text-[10px] uppercase tracking-[0.3em] border border-black px-8 py-4 hover:bg-black hover:text-white transition-colors inline-block">
            Return to Archive
          </Link>
        </motion.div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 min-h-screen bg-[#FAFAFA] text-[#111]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center bg-white border border-black/5 p-16 max-w-xl w-full">
          <h3 className="font-cormorant text-4xl italic font-light mb-6">Your cart is empty.</h3>
          <p className="font-outfit text-sm text-black/50 mb-12">Add something from the archive before checking out.</p>
          <Link href={`${basePath}/products`} className="font-outfit text-[10px] uppercase tracking-[0.3em] border border-black px-8 py-4 hover:bg-black hover:text-white transition-colors inline-block">
            Explore Collection
          </Link>
        </motion.div>
      </div>
    );
  }

  if (checkoutStep === "shipping") {
    return (
      <div className="w-full bg-[#FAFAFA] min-h-screen pt-32 pb-32 px-6 md:px-12 text-[#111]">
        <div className="max-w-[800px] mx-auto">
          <Link href={`${basePath}/cart`} className="flex items-center gap-2 font-outfit text-[10px] uppercase tracking-[0.3em] text-black/50 hover:text-black transition-colors mb-12 w-fit">
            <ArrowLeft className="w-4 h-4" /> Back to Cart
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-black/5 p-8 md:p-16 shadow-[0_20px_40px_rgba(0,0,0,0.03)]">
            <h1 className="font-cormorant text-4xl md:text-5xl font-light italic tracking-tight mb-4">Delivery Details</h1>
            <p className="font-outfit text-[10px] uppercase tracking-[0.3em] text-black/40 mb-16 border-b border-black/10 pb-8">Where should we send your order</p>

            <form
              className="flex flex-col gap-8"
              onSubmit={(e) => {
                e.preventDefault();
                setCheckoutStep("payment");
              }}
            >
              <div className="flex flex-col gap-3">
                <label htmlFor="name" className="font-outfit text-[10px] uppercase tracking-[0.2em] text-black/50">Full Name</label>
                <input
                  type="text"
                  id="name"
                  required
                  value={shippingDetails.name}
                  onChange={(e) => setShippingDetails({ ...shippingDetails, name: e.target.value })}
                  className="w-full bg-transparent border-b border-black/15 py-4 text-sm font-outfit focus:outline-none focus:border-black transition-colors"
                  placeholder="Jane Doe"
                />
              </div>
              <div className="flex flex-col gap-3">
                <label htmlFor="mobile" className="font-outfit text-[10px] uppercase tracking-[0.2em] text-black/50">Phone Number</label>
                <input
                  type="tel"
                  id="mobile"
                  required
                  value={shippingDetails.mobile}
                  onChange={(e) => setShippingDetails({ ...shippingDetails, mobile: e.target.value })}
                  className="w-full bg-transparent border-b border-black/15 py-4 text-sm font-outfit focus:outline-none focus:border-black transition-colors"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div className="flex flex-col gap-3">
                <label htmlFor="address" className="font-outfit text-[10px] uppercase tracking-[0.2em] text-black/50">Delivery Address</label>
                <textarea
                  id="address"
                  required
                  rows={3}
                  value={shippingDetails.address}
                  onChange={(e) => setShippingDetails({ ...shippingDetails, address: e.target.value })}
                  className="w-full bg-transparent border-b border-black/15 py-4 text-sm font-outfit focus:outline-none focus:border-black transition-colors resize-none"
                  placeholder="123 Example Street, Apt 4B"
                />
              </div>
              <div className="flex flex-col gap-3">
                <label htmlFor="landmark" className="font-outfit text-[10px] uppercase tracking-[0.2em] text-black/50">Landmark (Optional)</label>
                <input
                  type="text"
                  id="landmark"
                  value={shippingDetails.landmark}
                  onChange={(e) => setShippingDetails({ ...shippingDetails, landmark: e.target.value })}
                  className="w-full bg-transparent border-b border-black/15 py-4 text-sm font-outfit focus:outline-none focus:border-black transition-colors"
                  placeholder="e.g. Near Central Park"
                />
              </div>

              <div className="mt-8">
                <button type="submit" className="w-full border border-black font-outfit text-[10px] uppercase tracking-[0.3em] flex items-center justify-between px-8 py-6 hover:bg-black hover:text-white transition-colors duration-500">
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

  return (
    <div className="w-full bg-[#FAFAFA] min-h-screen pt-32 pb-32 px-6 md:px-12 text-[#111]">
      <div className="max-w-[800px] mx-auto">
        <button onClick={() => setCheckoutStep("shipping")} className="flex items-center gap-2 font-outfit text-[10px] uppercase tracking-[0.3em] text-black/50 hover:text-black transition-colors mb-12 w-fit">
          <ArrowLeft className="w-4 h-4" /> Edit Details
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-black/5 p-8 md:p-16 shadow-[0_20px_40px_rgba(0,0,0,0.03)]">
          <h1 className="font-cormorant text-4xl md:text-5xl font-light italic tracking-tight mb-12">Review &amp; Pay</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
            <div className="space-y-3">
              <h3 className="font-outfit text-[10px] uppercase tracking-[0.3em] text-black/40 border-b border-black/10 pb-4 mb-4">Shipping Details</h3>
              <p className="font-outfit text-sm">{shippingDetails.name}</p>
              <p className="font-outfit text-xs text-black/60">{shippingDetails.mobile}</p>
              <p className="font-outfit text-xs text-black/60 whitespace-pre-line leading-relaxed">{shippingDetails.address}</p>
              {shippingDetails.landmark && <p className="font-outfit text-xs text-black/60">Landmark: {shippingDetails.landmark}</p>}
            </div>
            <div>
              <PremiumPaymentSelector theme="light" selected={paymentMethod} onSelect={setPaymentMethod} allowedMethods={allowedPaymentMethods ? [...allowedPaymentMethods] : undefined} />
            </div>
          </div>

          <div className="mb-12">
            <h3 className="font-outfit text-[10px] uppercase tracking-[0.3em] text-black/40 mb-4">Promotional Code</h3>
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-black/[0.02] p-4 border border-black/10">
                <div>
                  <span className="font-outfit text-sm">{appliedCoupon}</span>
                  <span className="font-outfit text-[10px] uppercase tracking-widest text-green-600 ml-4">
                    -{currencySymbol}
                    {discountAmount.toFixed(2)} applied
                  </span>
                </div>
                <button onClick={removeCoupon} className="font-outfit text-[10px] uppercase tracking-[0.2em] hover:text-black/50 transition-colors">
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-4">
                <input
                  type="text"
                  placeholder="Enter code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 bg-transparent border-b border-black/15 py-4 text-sm font-outfit focus:outline-none focus:border-black transition-colors"
                />
                <button type="submit" className="px-8 border border-black font-outfit text-[10px] uppercase tracking-[0.3em] hover:bg-black hover:text-white transition-colors">
                  Apply
                </button>
              </form>
            )}
            {couponError && <p className="text-red-600 text-xs mt-4 font-outfit">{couponError}</p>}
          </div>

          <div className="flex justify-between items-center mb-12 border-t border-black/10 pt-8">
            <span className="font-outfit text-[10px] uppercase tracking-[0.3em] text-black/40">Total Due</span>
            <span className="font-cormorant text-5xl font-light italic">
              {currencySymbol}
              {finalTotal.toFixed(2)}
            </span>
          </div>

          {orderError && <p className="text-red-600 text-xs mb-4 font-outfit">{orderError}</p>}

          <button
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder}
            className="w-full bg-black text-white font-outfit text-[10px] uppercase tracking-[0.3em] flex items-center justify-between px-8 py-6 hover:bg-[#222] transition-colors duration-500 disabled:opacity-60 disabled:cursor-wait"
          >
            <span>{isPlacingOrder ? "Placing Order..." : "Place Order"}</span>
            <Check className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
