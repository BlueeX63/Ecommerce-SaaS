"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { PremiumPaymentSelector, PaymentMethod } from "@/components/storefront/PremiumPaymentSelector";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight, Tag, X } from "lucide-react";
import { useShop, Order } from "../ShopContext";

export default function NexusProCheckoutPage() {
  const { cartItems, totalPrice, placeOrder, appliedCoupon, discountAmount, couponError, applyCoupon, removeCoupon , currencySymbol } = useShop();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [couponCode, setCouponCode] = useState('');

  const [publicCoupons, setPublicCoupons] = useState<any[]>([]);
  const [deliveryOptions, setDeliveryOptions] = useState<any[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [shippingDetails, setShippingDetails] = useState({ firstName: '', lastName: '', phone: '', address: '', landmark: '', city: '', zip: '' });

  useEffect(() => {
    fetch('/api/v1/store/delivery-options?slug=nexus-pro')
      .then(r => r.json())
      .then(data => { if(Array.isArray(data)) { setDeliveryOptions(data); if(data.length>0) setSelectedDelivery(data[0]); } });
    
    fetch('/api/v1/store/coupons/public?slug=nexus-pro')
      .then(r => r.json())
      .then(data => { if(Array.isArray(data)) setPublicCoupons(data); });
  }, []);

  const discountedTotal = Math.max(0, totalPrice - discountAmount);
  const tax = discountedTotal * 0.08;
  const shipping = selectedDelivery ? Number(selectedDelivery.price) : 0;
  const finalTotal = discountedTotal + tax + shipping;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    placeOrder({
      id: "ORD-NEXUS-" + Math.floor(Math.random() * 10000),
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      status: "Processing",
      total: finalTotal,
      items: cartItems.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        image: item.product.image
      }))
    });

    setIsProcessing(false);
    setIsSuccess(true);
  };

  
  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    setIsPlacingOrder(true);
    try {
      const slug = 'nexus-pro';
      const subtotal = cartItems.reduce((sum: number, item: any) => sum + (item.price || item.product?.price || 0) * item.quantity, 0);
      const discount = typeof discountAmount !== 'undefined' ? discountAmount : 0;
      
      const res = await fetch(`/api/v1/store/orders?slug=${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          items: cartItems,
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
        placeOrder({ id: "", date: "", total: 0, status: "Processing", items: [] });
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 p-12 rounded-2xl text-center max-w-lg w-full"
        >
          <div className="w-20 h-20 bg-[#d4af37]/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-10 h-10 text-[#d4af37]" />
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">Order Confirmed.</h1>
          <p className="text-white/50 text-sm mb-8 leading-relaxed">
            Your order has been successfully placed. We've sent a confirmation email with your order details.
          </p>
          <div className="flex flex-col gap-4">
            <Link 
              href="/templates/nexus-pro/profile"
              className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-full hover:bg-[#d4af37] hover:text-white transition-colors"
            >
              View Order Status
            </Link>
            <Link 
              href="/templates/nexus-pro/products"
              className="w-full py-4 bg-transparent border border-white/20 text-white font-bold uppercase tracking-widest text-xs rounded-full hover:bg-white/10 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white">
        <p>Your cart is empty.</p>
        <Link href="/templates/nexus-pro/products" className="mt-4 text-[#d4af37] underline">Return to shop</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-[#0a0a0a] text-[#ededed] pt-32 pb-32 min-h-screen">
      <section className="px-6 md:px-12 max-w-7xl mx-auto w-full mb-16">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-white/30 mb-8">
          <Link href="/templates/nexus-pro/cart" className="hover:text-white transition-colors">Cart</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-white">Checkout</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-8">
          Secure Checkout.
        </h1>
      </section>

      <section className="px-6 md:px-12 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
        
        {/* Form */}
        <div className="lg:col-span-7">
          <form onSubmit={handleCheckout} className="space-y-12">
            
            {/* Contact */}
            <div>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-4">
                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-[#d4af37]">1</span>
                Contact Information
              </h2>
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <input type="email" required placeholder="Email Address" className="w-full bg-white/5 border border-white/10 rounded-lg p-4 text-sm focus:outline-none focus:border-[#d4af37] transition-colors" />
                </div>
              </div>
            </div>

            {/* Shipping */}
            <div>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-4">
                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-[#d4af37]">2</span>
                Shipping Details
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" value={shippingDetails.firstName} onChange={e=>setShippingDetails({...shippingDetails, firstName: e.target.value})} required placeholder="First Name" className="col-span-1 bg-white/5 border border-white/10 rounded-lg p-4 text-sm focus:outline-none focus:border-[#d4af37] transition-colors" />
                <input type="text" value={shippingDetails.lastName} onChange={e=>setShippingDetails({...shippingDetails, lastName: e.target.value})} required placeholder="Last Name" className="col-span-1 bg-white/5 border border-white/10 rounded-lg p-4 text-sm focus:outline-none focus:border-[#d4af37] transition-colors" />
                <input type="text" value={shippingDetails.address} onChange={e=>setShippingDetails({...shippingDetails, address: e.target.value})} required placeholder="Address" className="col-span-2 bg-white/5 border border-white/10 rounded-lg p-4 text-sm focus:outline-none focus:border-[#d4af37] transition-colors" />
                <input type="text" value={shippingDetails.landmark} onChange={e=>setShippingDetails({...shippingDetails, landmark: e.target.value})} placeholder="Landmark (Optional)" className="col-span-2 bg-white/5 border border-white/10 rounded-lg p-4 text-sm focus:outline-none focus:border-[#d4af37] transition-colors" />
                <input type="tel" value={shippingDetails.phone} onChange={e=>setShippingDetails({...shippingDetails, phone: e.target.value})} required placeholder="Phone Number" className="col-span-2 bg-white/5 border border-white/10 rounded-lg p-4 text-sm focus:outline-none focus:border-[#d4af37] transition-colors" />
                <input type="text" value={shippingDetails.city} onChange={e=>setShippingDetails({...shippingDetails, city: e.target.value})} required placeholder="City" className="col-span-2 md:col-span-1 bg-white/5 border border-white/10 rounded-lg p-4 text-sm focus:outline-none focus:border-[#d4af37] transition-colors" />
                <input type="text" value={shippingDetails.zip} onChange={e=>setShippingDetails({...shippingDetails, zip: e.target.value})} required placeholder="Postal Code" className="col-span-2 md:col-span-1 bg-white/5 border border-white/10 rounded-lg p-4 text-sm focus:outline-none focus:border-[#d4af37] transition-colors" />
              </div>

              {deliveryOptions.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-white/50">Delivery Method</h3>
                  <div className="space-y-2">
                    {deliveryOptions.map(opt => (
                      <label key={opt.delivery_option_id} className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${selectedDelivery?.delivery_option_id === opt.delivery_option_id ? 'border-[#d4af37] bg-[#d4af37]/10' : 'border-white/10 bg-white/5 hover:border-white/30'}`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" name="delivery" checked={selectedDelivery?.delivery_option_id === opt.delivery_option_id} onChange={() => setSelectedDelivery(opt)} className="accent-[#d4af37]" />
                          <div>
                            <p className="font-bold text-sm text-white">{opt.name}</p>
                            <p className="text-xs text-white/50">{opt.estimated_days}</p>
                          </div>
                        </div>
                        <p className="font-bold text-sm">{Number(opt.price) === 0 ? 'Free' : `${currencySymbol}${Number(opt.price).toFixed(2)}`}</p>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Payment */}
            <div>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-4">
                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-[#d4af37]">3</span>
                Payment Details
              </h2>
              <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-6">
                
                {/* Payment Method Selector */}
                <div className="grid grid-cols-3 gap-2 p-1 bg-black/50 rounded-lg border border-white/10">
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod("netbanking")}
                    className={`py-3 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${paymentMethod === "netbanking" ? 'bg-[#d4af37] text-black' : 'text-white/50 hover:text-white'}`}
                  >
                    Card
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`py-3 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${paymentMethod === 'upi' ? 'bg-[#d4af37] text-black' : 'text-white/50 hover:text-white'}`}
                  >
                    UPI
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`py-3 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${paymentMethod === 'cod' ? 'bg-[#d4af37] text-black' : 'text-white/50 hover:text-white'}`}
                  >
                    COD
                  </button>
                </div>

                {/* Conditional Inputs */}
                {paymentMethod === "netbanking" && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <input type="text" required placeholder="Card Number" className="w-full bg-transparent border-b border-white/20 py-3 text-sm focus:outline-none focus:border-[#d4af37]" />
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" required placeholder="MM/YY" className="w-full bg-transparent border-b border-white/20 py-3 text-sm focus:outline-none focus:border-[#d4af37]" />
                      <input type="text" required placeholder="CVC" className="w-full bg-transparent border-b border-white/20 py-3 text-sm focus:outline-none focus:border-[#d4af37]" />
                    </div>
                  </div>
                )}

                {paymentMethod === 'upi' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <input type="text" required placeholder="UPI ID (e.g., username@upi)" className="w-full bg-transparent border-b border-white/20 py-3 text-sm focus:outline-none focus:border-[#d4af37]" />
                    <p className="text-xs text-white/40 italic">You will receive a payment request on your UPI app after confirming the order.</p>
                  </div>
                )}

                {paymentMethod === 'cod' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-lg text-sm text-[#d4af37]">
                      Pay with cash when your order is delivered. Please have the exact amount ready.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="my-8"><PremiumPaymentSelector theme="dark" selected={paymentMethod} onSelect={setPaymentMethod} /></div>
              <button 
              type="submit" 
              disabled={isProcessing}
              className={`w-full py-5 rounded-full font-bold uppercase tracking-widest text-xs flex items-center justify-center transition-all duration-300 ${isProcessing ? 'bg-white/20 text-white cursor-wait' : 'bg-[#d4af37] text-black hover:bg-white hover:text-black'}`}
            >{isPlacingOrder ? "Processing..." : "{isProcessing ? 'Processing Order...' : paymentMethod === 'cod' ? 'Confirm Order' : `Pay $${finalTotal.toFixed(2)}`}"}</button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-5">
          <div className="bg-white/5 p-8 rounded-2xl sticky top-32">
            <h2 className="text-xl font-black uppercase tracking-tighter mb-8">Order Summary</h2>
            
            <div className="space-y-6 mb-8 max-h-[40vh] overflow-y-auto pr-2">
              {cartItems.map((item) => (
                <div key={item.product.id} className="flex gap-4">
                  <div className="w-16 h-20 bg-white/10 rounded-md overflow-hidden shrink-0 relative">
                    <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                    <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border border-white/20">{item.quantity}</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h4 className="font-bold text-sm text-white mb-1">{item.product.name}</h4>
                    <p className="text-[10px] uppercase tracking-widest text-white/50">{item.product.category}</p>
                  </div>
                  <div className="font-bold text-sm text-white flex items-center">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            <div className="mb-6 pt-6 border-t border-white/10">
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-lg p-4">
                  <div className="flex items-center gap-3 text-[#d4af37]">
                    <Tag className="w-4 h-4" />
                    <span className="font-bold text-sm tracking-widest uppercase">{appliedCoupon} Applied</span>
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
                      placeholder="Discount Code" 
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#d4af37] transition-colors placeholder:text-white/30"
                    />
                    <button 
                      type="button" 
                      onClick={() => applyCoupon(couponCode)}
                      className="bg-white/10 hover:bg-[#d4af37] hover:text-black text-white px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && <p className="text-red-500 text-xs px-1">{couponError}</p>}
                  
                  {publicCoupons.length > 0 && (
                    <div className="pt-4 border-t border-white/10 mt-4 space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">Available Coupons</p>
                      {publicCoupons.map(c => (
                        <button 
                          key={c.code}
                          type="button"
                          onClick={() => { setCouponCode(c.code); applyCoupon(c.code); }}
                          className="w-full text-left bg-white/5 border border-white/10 hover:border-[#d4af37] p-3 rounded-lg flex items-center justify-between transition-colors group"
                        >
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-[#d4af37]" />
                            <span className="font-bold text-sm text-white group-hover:text-[#d4af37] transition-colors">{c.code}</span>
                          </div>
                          <span className="text-xs font-bold text-[#d4af37]">
                            {c.discount_type === 'PERCENTAGE' ? `${c.discount_amount}% OFF` : `${currencySymbol}${c.discount_amount} OFF`}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4 text-sm font-medium border-t border-white/10 pt-6 mb-6">
              <div className="flex justify-between items-center text-white/70">
                <span>Subtotal</span>
                <span className="text-white">{currencySymbol}{totalPrice.toFixed(2)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between items-center text-[#d4af37]">
                  <span>Discount ({appliedCoupon})</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-white/70">
                <span>Estimated Tax</span>
                <span className="text-white">{currencySymbol}{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-white/70">
                <span>Shipping</span>
                <span className="text-white">{shipping === 0 ? 'Free' : `${currencySymbol}${shipping.toFixed(2)}`}</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-6 border-t border-white/10">
              <span className="text-xs font-bold uppercase tracking-widest text-[#d4af37]">Total</span>
              <span className="text-3xl font-black">{currencySymbol}{finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

      </section>
    </div>
  );
}
