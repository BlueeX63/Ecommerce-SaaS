"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FloatingLabelInput } from "@/components/auth/FloatingLabelInput";
import { PremiumLoader } from "@/components/auth/PremiumLoader";
import { PremiumPaymentSelector, PaymentMethod } from "@/components/storefront/PremiumPaymentSelector";
import { useCart } from "@/app/templates/minimalist/CartContext";

export default function CheckoutPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  
  const { items, totalPrice, clearCart, appliedCoupon, discountAmount, couponError, applyCoupon, removeCoupon, currencySymbol } = useCart();

  const [step, setStep] = useState<"address" | "payment">("address");
  const [address, setAddress] = useState({
    fullName: "",
    phoneNumber: "",
    addressLine: "",
    landmark: "",
    city: "",
    zipCode: "",
  });
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [deliveryOptions, setDeliveryOptions] = useState<any[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [publicCoupons, setPublicCoupons] = useState<any[]>([]);
  const [couponInput, setCouponInput] = useState("");

  useEffect(() => {
    fetch('/api/v1/store/addresses')
      .then(res => {
        if (res.status === 401) {
          router.push(`/store/${slug}/auth/login`);
        } else {
          setIsCheckingAuth(false);
        }
      })
      .catch(() => setIsCheckingAuth(false));

    fetch(`/api/v1/store/delivery-options?slug=${slug}`)
      .then(r => r.json())
      .then(data => { if(Array.isArray(data)) { setDeliveryOptions(data); if(data.length>0) setSelectedDelivery(data[0]); } });
    
    fetch(`/api/v1/store/coupons/public?slug=${slug}`)
      .then(r => r.json())
      .then(data => { if(Array.isArray(data)) setPublicCoupons(data); });
  }, [slug, router]);

  if (isCheckingAuth) return <PremiumLoader />;

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.fullName || !address.phoneNumber || !address.addressLine || !address.city || !address.zipCode) {
      setError("Please fill in all required address fields.");
      return;
    }
    setError("");
    setStep("payment");
  };

  const discountedTotal = Math.max(0, totalPrice - discountAmount);
  const tax = discountedTotal * 0.08;
  const shipping = selectedDelivery ? Number(selectedDelivery.price) : 0;
  const finalTotal = discountedTotal + tax + shipping;

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/store/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          slug,
          items: items,
          subtotal: totalPrice,
          taxTotal: tax,
          shippingTotal: shipping,
          discountTotal: discountAmount,
          grandTotal: finalTotal,
          shippingDetails: { 
            name: address.fullName,
            phone: address.phoneNumber,
            address: address.addressLine, 
            landmark: address.landmark,
            city: address.city, 
            zip: address.zipCode 
          },
          deliveryOptionId: selectedDelivery?.delivery_option_id,
          paymentMethod
        }),
      });
      
      if (res.ok) {
        clearCart();
        if (appliedCoupon) removeCoupon();
        router.push(`/store/${slug}/profile`);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create order.");
        setIsLoading(false);
      }
    } catch (err) {
      setError("An error occurred during payment.");
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <p className="text-gray-500 mb-4">Your cart is empty.</p>
        <button onClick={() => router.push(`/store/${slug}`)} className="text-blue-600 hover:underline">Return to Shop</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Form */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>
          
          <div className="flex gap-2 mb-8">
            <div className={`flex-1 h-1 rounded-full ${step === "address" || step === "payment" ? "bg-black" : "bg-gray-200"}`} />
            <div className={`flex-1 h-1 rounded-full ${step === "payment" ? "bg-black" : "bg-gray-200"}`} />
          </div>

          {error && <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">{error}</div>}

          <AnimatePresence mode="wait">
            {step === "address" ? (
              <motion.form key="address" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleAddressSubmit} className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Shipping Address</h2>
                <FloatingLabelInput label="Full Name *" type="text" value={address.fullName} onChange={(e) => setAddress({ ...address, fullName: e.target.value })} />
                <FloatingLabelInput label="Phone Number *" type="tel" value={address.phoneNumber} onChange={(e) => setAddress({ ...address, phoneNumber: e.target.value })} />
                <FloatingLabelInput label="Address Line *" type="text" value={address.addressLine} onChange={(e) => setAddress({ ...address, addressLine: e.target.value })} />
                <FloatingLabelInput label="Landmark (Optional)" type="text" value={address.landmark} onChange={(e) => setAddress({ ...address, landmark: e.target.value })} />
                
                <div className="flex gap-4">
                  <FloatingLabelInput label="City *" type="text" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                  <FloatingLabelInput label="Zip Code *" type="text" value={address.zipCode} onChange={(e) => setAddress({ ...address, zipCode: e.target.value })} />
                </div>
                
                {deliveryOptions.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900">Delivery Method</h3>
                    <div className="space-y-2">
                      {deliveryOptions.map(opt => (
                        <label key={opt.delivery_option_id} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${selectedDelivery?.delivery_option_id === opt.delivery_option_id ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <div className="flex items-center gap-3">
                            <input type="radio" name="delivery" checked={selectedDelivery?.delivery_option_id === opt.delivery_option_id} onChange={() => setSelectedDelivery(opt)} className="accent-black w-4 h-4" />
                            <div>
                              <p className="font-bold text-sm text-gray-900">{opt.name}</p>
                              <p className="text-xs text-gray-500">{opt.estimated_days}</p>
                            </div>
                          </div>
                          <p className="font-bold text-sm text-gray-900">{Number(opt.price) === 0 ? 'Free' : `${currencySymbol}${Number(opt.price).toFixed(2)}`}</p>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-medium hover:bg-gray-800 transition-colors mt-4">Continue to Payment</button>
              </motion.form>
            ) : (
              <motion.div key="payment" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col gap-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Payment</h2>
                
                <PremiumPaymentSelector theme="light" selected={paymentMethod} onSelect={setPaymentMethod} />

                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex justify-between items-center mt-4">
                  <span className="font-medium text-gray-900">Total Amount</span>
                  <span className="font-bold text-xl">{currencySymbol}{finalTotal.toFixed(2)}</span>
                </div>
                
                <button onClick={handlePayment} disabled={isLoading} className="w-full bg-black text-white py-4 rounded-xl font-medium hover:bg-gray-800 transition-colors relative flex items-center justify-center gap-2 overflow-hidden mt-4">
                  {isLoading ? <><div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />Processing...</> : "Place Order"}
                </button>
                <button onClick={() => setStep("address")} disabled={isLoading} className="w-full bg-transparent text-gray-500 py-2 rounded-xl font-medium hover:text-gray-900 transition-colors">Back to Address</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Order Summary */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 h-fit sticky top-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
          
          <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto">
            {items.map((item) => (
              <div key={item.product.id} className="flex gap-4 items-center">
                <img src={item.product.image} alt={item.product.name} className="w-16 h-16 object-cover rounded-lg border border-gray-100" />
                <div className="flex-1">
                  <p className="font-bold text-sm text-gray-900">{item.product.name}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="font-medium text-gray-900">{currencySymbol}{(item.product.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-6 mb-6">
            {!appliedCoupon ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input type="text" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="Discount code" className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-black" />
                  <button onClick={() => applyCoupon(couponInput)} className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors">Apply</button>
                </div>
                {couponError && <p className="text-red-500 text-xs">{couponError}</p>}
                
                {publicCoupons.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Available Coupons</p>
                    {publicCoupons.map(c => (
                      <button key={c.code} onClick={() => { setCouponInput(c.code); applyCoupon(c.code); }} className="w-full text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 p-3 rounded-lg flex items-center justify-between transition-colors">
                        <span className="font-bold text-sm text-gray-900">{c.code}</span>
                        <span className="text-xs font-bold text-green-600">{c.discount_type === 'PERCENTAGE' ? `${c.discount_amount}% OFF` : `${currencySymbol}${c.discount_amount} OFF`}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 p-3 rounded-lg">
                <span className="font-bold text-sm text-green-700">{appliedCoupon} Applied</span>
                <button onClick={removeCoupon} className="text-gray-400 hover:text-gray-600 text-sm">Remove</button>
              </div>
            )}
          </div>

          <div className="space-y-3 text-sm text-gray-600 mb-6 border-t border-gray-100 pt-6">
            <div className="flex justify-between"><span>Subtotal</span><span>{currencySymbol}{totalPrice.toFixed(2)}</span></div>
            {appliedCoupon && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{currencySymbol}{discountAmount.toFixed(2)}</span></div>}
            <div className="flex justify-between"><span>Estimated Tax</span><span>{currencySymbol}{tax.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? 'Free' : `${currencySymbol}${shipping.toFixed(2)}`}</span></div>
          </div>
          
          <div className="flex justify-between items-center text-lg font-bold text-gray-900 border-t border-gray-100 pt-6">
            <span>Total</span>
            <span>{currencySymbol}{finalTotal.toFixed(2)}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
