"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Inter, Space_Grotesk, Syne } from 'next/font/google';
import { useAero } from '../AeroContext';
import { Check, ArrowRight, CreditCard, Wallet, Smartphone, Banknote, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] });
const syne = Syne({ subsets: ['latin'] });

export default function AeroCheckoutPage() {
  const { cart, clearCart, mounted, appliedCoupon, applyCoupon, removeCoupon, discountAmount, couponError } = useAero();
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [couponCode, setCouponCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal - discountAmount;

  useEffect(() => {
    if (mounted && cart.length === 0 && step !== 3) {
      router.push('/preview/empire/aero/products');
    }
  }, [cart.length, mounted, router, step]);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode) {
      applyCoupon(couponCode);
      setCouponCode('');
    }
  };

  const handleCheckout = () => {
    setIsProcessing(true);
    setTimeout(() => {
      clearCart();
      setIsProcessing(false);
      setStep(3); // Success step
    }, 2500);
  };

  if (!mounted || (cart.length === 0 && step !== 3)) return null;

  return (
    <div className="min-h-screen bg-[#F8F7F5] pt-32 pb-32 px-6 md:px-12 text-black selection:bg-black selection:text-white">
      <div className="max-w-[1400px] mx-auto">
        
        <header className="mb-16 md:mb-24 flex items-center justify-between">
          <h1 className={`text-3xl md:text-5xl font-bold tracking-tighter uppercase text-black ${spaceGrotesk.className}`}>
            Checkout.
          </h1>
          
          <div className="flex items-center gap-4 md:gap-8">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-black' : 'text-black/30'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 1 ? 'bg-black text-white' : 'bg-black/10'}`}>1</div>
              <span className={`hidden md:block text-[10px] uppercase tracking-widest font-bold ${spaceGrotesk.className}`}>Shipping</span>
            </div>
            <div className={`h-[1px] w-8 md:w-16 ${step >= 2 ? 'bg-black' : 'bg-black/10'}`} />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-black' : 'text-black/30'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 2 ? 'bg-black text-white' : 'bg-black/10'}`}>2</div>
              <span className={`hidden md:block text-[10px] uppercase tracking-widest font-bold ${spaceGrotesk.className}`}>Payment</span>
            </div>
          </div>
        </header>

        {step === 3 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-[60vh] bg-white rounded-[3rem] shadow-xl flex flex-col items-center justify-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-black/5 opacity-50 z-0 pointer-events-none" />
            <div className="relative z-10 w-24 h-24 bg-black rounded-full flex items-center justify-center mb-8 shadow-2xl">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h2 className={`relative z-10 text-4xl md:text-5xl font-bold uppercase tracking-tighter text-black mb-4 ${spaceGrotesk.className}`}>Order Confirmed</h2>
            <p className={`relative z-10 text-black/50 text-sm md:text-base font-light mb-12 text-center max-w-md ${inter.className}`}>
              Thank you for your acquisition. A detailed confirmation has been sent to your email.
            </p>
            <Link href="/preview/empire/aero/profile" className="relative z-10">
              <button className={`px-12 py-5 bg-[#F8F7F5] border border-black/10 text-black text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors rounded-full ${spaceGrotesk.className}`}>
                View Order Status
              </button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 relative">
            
            {/* Form Area */}
            <div className="col-span-1 lg:col-span-7 space-y-16">
              
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="space-y-12"
                  >
                    <div>
                      <h2 className={`text-2xl font-bold uppercase tracking-tighter mb-8 ${spaceGrotesk.className}`}>Contact Information</h2>
                      <div className="space-y-6">
                        <div className="relative">
                          <input type="email" placeholder="Email Address *" className={`w-full bg-transparent border-b border-black/20 pb-4 text-sm md:text-base focus:outline-none focus:border-black transition-colors placeholder-black/30 ${inter.className}`} />
                        </div>
                        <div className="relative">
                          <input type="tel" placeholder="Phone Number *" className={`w-full bg-transparent border-b border-black/20 pb-4 text-sm md:text-base focus:outline-none focus:border-black transition-colors placeholder-black/30 ${inter.className}`} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h2 className={`text-2xl font-bold uppercase tracking-tighter mb-8 ${spaceGrotesk.className}`}>Shipping Address</h2>
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="relative">
                            <input type="text" placeholder="First Name *" className={`w-full bg-transparent border-b border-black/20 pb-4 text-sm md:text-base focus:outline-none focus:border-black transition-colors placeholder-black/30 ${inter.className}`} />
                          </div>
                          <div className="relative">
                            <input type="text" placeholder="Last Name *" className={`w-full bg-transparent border-b border-black/20 pb-4 text-sm md:text-base focus:outline-none focus:border-black transition-colors placeholder-black/30 ${inter.className}`} />
                          </div>
                        </div>
                        <div className="relative">
                          <input type="text" placeholder="Street Address *" className={`w-full bg-transparent border-b border-black/20 pb-4 text-sm md:text-base focus:outline-none focus:border-black transition-colors placeholder-black/30 ${inter.className}`} />
                        </div>
                        <div className="relative">
                          <input type="text" placeholder="Apartment, Suite, etc. (Optional)" className={`w-full bg-transparent border-b border-black/20 pb-4 text-sm md:text-base focus:outline-none focus:border-black transition-colors placeholder-black/30 ${inter.className}`} />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                          <div className="relative md:col-span-1">
                            <input type="text" placeholder="City *" className={`w-full bg-transparent border-b border-black/20 pb-4 text-sm md:text-base focus:outline-none focus:border-black transition-colors placeholder-black/30 ${inter.className}`} />
                          </div>
                          <div className="relative md:col-span-1">
                            <input type="text" placeholder="State/Province *" className={`w-full bg-transparent border-b border-black/20 pb-4 text-sm md:text-base focus:outline-none focus:border-black transition-colors placeholder-black/30 ${inter.className}`} />
                          </div>
                          <div className="relative col-span-2 md:col-span-1">
                            <input type="text" placeholder="Postal Code *" className={`w-full bg-transparent border-b border-black/20 pb-4 text-sm md:text-base focus:outline-none focus:border-black transition-colors placeholder-black/30 ${inter.className}`} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setStep(2)}
                      className={`w-full py-6 bg-black text-white text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] transition-all duration-500 hover:bg-black/80 flex items-center justify-center gap-3 rounded-full ${spaceGrotesk.className}`}
                    >
                      Continue to Payment <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="space-y-12"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-8">
                        <h2 className={`text-2xl font-bold uppercase tracking-tighter ${spaceGrotesk.className}`}>Payment Method</h2>
                        <span className="flex items-center gap-2 text-xs text-black/40">
                          <ShieldCheck className="w-4 h-4 text-green-600" /> Secure SSL
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <button
                          onClick={() => setPaymentMethod('card')}
                          className={`p-6 border-2 flex flex-col gap-4 text-left rounded-2xl transition-all ${paymentMethod === 'card' ? 'border-black bg-white shadow-lg' : 'border-black/10 bg-transparent hover:border-black/30'}`}
                        >
                          <CreditCard className={`w-6 h-6 ${paymentMethod === 'card' ? 'text-black' : 'text-black/40'}`} />
                          <span className={`text-xs font-bold uppercase tracking-widest ${spaceGrotesk.className}`}>Credit Card</span>
                        </button>
                        <button
                          onClick={() => setPaymentMethod('upi')}
                          className={`p-6 border-2 flex flex-col gap-4 text-left rounded-2xl transition-all ${paymentMethod === 'upi' ? 'border-black bg-white shadow-lg' : 'border-black/10 bg-transparent hover:border-black/30'}`}
                        >
                          <Smartphone className={`w-6 h-6 ${paymentMethod === 'upi' ? 'text-black' : 'text-black/40'}`} />
                          <span className={`text-xs font-bold uppercase tracking-widest ${spaceGrotesk.className}`}>UPI</span>
                        </button>
                        <button
                          onClick={() => setPaymentMethod('netbanking')}
                          className={`p-6 border-2 flex flex-col gap-4 text-left rounded-2xl transition-all ${paymentMethod === 'netbanking' ? 'border-black bg-white shadow-lg' : 'border-black/10 bg-transparent hover:border-black/30'}`}
                        >
                          <Wallet className={`w-6 h-6 ${paymentMethod === 'netbanking' ? 'text-black' : 'text-black/40'}`} />
                          <span className={`text-xs font-bold uppercase tracking-widest ${spaceGrotesk.className}`}>Net Banking</span>
                        </button>
                        <button
                          onClick={() => setPaymentMethod('cod')}
                          className={`p-6 border-2 flex flex-col gap-4 text-left rounded-2xl transition-all ${paymentMethod === 'cod' ? 'border-black bg-white shadow-lg' : 'border-black/10 bg-transparent hover:border-black/30'}`}
                        >
                          <Banknote className={`w-6 h-6 ${paymentMethod === 'cod' ? 'text-black' : 'text-black/40'}`} />
                          <span className={`text-xs font-bold uppercase tracking-widest ${spaceGrotesk.className}`}>Cash on Delivery</span>
                        </button>
                      </div>

                      <AnimatePresence mode="wait">
                        {paymentMethod === 'card' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-6 overflow-hidden bg-white p-8 rounded-[2rem] border border-black/5"
                          >
                            <div className="relative">
                              <input type="text" placeholder="Card Number *" className={`w-full bg-transparent border-b border-black/20 pb-4 text-sm md:text-base focus:outline-none focus:border-black transition-colors placeholder-black/30 ${inter.className}`} />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                              <div className="relative">
                                <input type="text" placeholder="MM/YY *" className={`w-full bg-transparent border-b border-black/20 pb-4 text-sm md:text-base focus:outline-none focus:border-black transition-colors placeholder-black/30 ${inter.className}`} />
                              </div>
                              <div className="relative">
                                <input type="text" placeholder="CVC *" className={`w-full bg-transparent border-b border-black/20 pb-4 text-sm md:text-base focus:outline-none focus:border-black transition-colors placeholder-black/30 ${inter.className}`} />
                              </div>
                            </div>
                            <div className="relative">
                              <input type="text" placeholder="Cardholder Name *" className={`w-full bg-transparent border-b border-black/20 pb-4 text-sm md:text-base focus:outline-none focus:border-black transition-colors placeholder-black/30 ${inter.className}`} />
                            </div>
                          </motion.div>
                        )}

                        {paymentMethod !== 'card' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden bg-white p-8 rounded-[2rem] border border-black/5"
                          >
                            <p className={`text-sm text-black/60 font-light ${inter.className}`}>
                              You will be redirected to the secure gateway for {paymentMethod.toUpperCase()} after clicking Complete Order.
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={() => setStep(1)}
                        className={`px-8 py-6 border border-black/10 text-black text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] transition-all duration-500 hover:bg-black/5 rounded-full ${spaceGrotesk.className}`}
                      >
                        Back
                      </button>
                      <button
                        onClick={handleCheckout}
                        disabled={isProcessing}
                        className={`flex-1 py-6 bg-black text-white text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] transition-all duration-500 hover:bg-black/80 flex items-center justify-center gap-3 rounded-full disabled:opacity-50 ${spaceGrotesk.className}`}
                      >
                        {isProcessing ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>Complete Order <Check className="w-4 h-4" /></>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
            </div>

            {/* Order Summary Sidebar */}
            <div className="col-span-1 lg:col-span-5 relative">
              <div className="sticky top-40 bg-white p-8 md:p-12 rounded-[3rem] shadow-[0_40px_80px_rgba(0,0,0,0.03)] border border-black/5">
                <h3 className={`text-lg font-bold uppercase tracking-tighter mb-8 ${spaceGrotesk.className}`}>Order Summary</h3>
                
                <div className="space-y-6 max-h-[40vh] overflow-y-auto mb-8 pr-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {cart.map(item => (
                    <div key={`${item.id}-${item.size}-${item.color}`} className="flex gap-6 group">
                      <div className="w-20 h-20 bg-[#F5F5F5] overflow-hidden shrink-0 rounded-xl relative">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover mix-blend-multiply opacity-90" />
                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-black text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                          {item.quantity}
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <h4 className={`text-xs font-bold text-black uppercase tracking-tighter ${spaceGrotesk.className}`}>{item.name}</h4>
                          <p className={`text-[10px] text-black/40 mt-1 uppercase tracking-widest ${inter.className}`}>
                            {item.color} {item.size && `| Size ${item.size}`}
                          </p>
                        </div>
                        <p className={`text-sm font-bold text-black ${syne.className}`}>${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon Code Section */}
                <div className="mb-8 pb-8 border-b border-black/10">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-[#F8F7F5] border border-black/5 rounded-full px-6 py-4">
                      <div>
                        <span className={`text-sm font-bold uppercase tracking-widest ${spaceGrotesk.className}`}>{appliedCoupon}</span>
                        <span className={`text-[10px] uppercase tracking-widest text-green-700 ml-4 ${inter.className}`}>-${discountAmount.toFixed(2)} Applied</span>
                      </div>
                      <button onClick={removeCoupon} className={`text-[10px] font-bold uppercase tracking-widest text-black/50 hover:text-black transition-colors ${spaceGrotesk.className}`}>
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="flex gap-4">
                      <input 
                        type="text" 
                        placeholder="Coupon Code" 
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className={`flex-1 bg-[#F8F7F5] border border-black/5 rounded-full px-6 py-4 text-xs focus:outline-none focus:border-black/20 transition-colors uppercase tracking-widest ${inter.className}`} 
                      />
                      <button 
                        type="submit"
                        disabled={!couponCode}
                        className={`px-8 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-widest disabled:bg-black/10 disabled:text-black/40 transition-colors ${spaceGrotesk.className}`}
                      >
                        Apply
                      </button>
                    </form>
                  )}
                  {couponError && <p className="text-red-600 text-[10px] font-medium uppercase tracking-widest mt-3 ml-6">{couponError}</p>}
                </div>

                <div className="space-y-4 mb-8 text-sm">
                  <div className={`flex justify-between items-center text-black/60 font-medium ${inter.className}`}>
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className={`flex justify-between items-center text-black/60 font-medium ${inter.className}`}>
                    <span>Shipping</span>
                    <span>Complimentary</span>
                  </div>
                  {appliedCoupon && (
                    <div className={`flex justify-between items-center text-green-600 font-medium ${inter.className}`}>
                      <span>Discount ({appliedCoupon})</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-end pt-8 border-t border-black/10">
                  <span className={`text-black text-xs uppercase tracking-widest font-bold ${spaceGrotesk.className}`}>Total</span>
                  <span className={`text-3xl font-bold tracking-tighter text-black ${syne.className}`}>
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}
