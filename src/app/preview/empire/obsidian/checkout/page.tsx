"use client";

import React, { useState } from 'react';
import { Inter, Oswald } from 'next/font/google';
import { motion } from 'framer-motion';
import { ShieldCheck, Hexagon, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useObsidian } from '../ObsidianContext';

const inter = Inter({ subsets: ['latin'] });
const oswald = Oswald({ subsets: ['latin'] });

export default function ObsidianCheckoutPage() {
  const { cart, clearCart, appliedCoupon, applyCoupon, removeCoupon, discountAmount, couponError } = useObsidian();
  const [step, setStep] = useState(1); // 1: Info, 2: Complete
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [couponCode, setCouponCode] = useState('');

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal - discountAmount;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode) {
      applyCoupon(couponCode);
      setCouponCode('');
    }
  };

  const handleComplete = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
    clearCart();
  };

  if (step === 2) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 pt-32">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          className="max-w-md w-full bg-[#111] p-12 border border-white/20 text-center shadow-[0_0_50px_rgba(255,255,255,0.05)]"
        >
          <div className="w-20 h-20 mx-auto border-2 border-white flex items-center justify-center mb-8">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className={`text-4xl font-bold uppercase tracking-widest mb-4 ${oswald.className}`}>
            TRANSACTION SECURED
          </h1>
          <p className={`text-xs text-white/50 uppercase tracking-[0.2em] font-bold leading-loose mb-10 ${inter.className}`}>
            Acquisition protocol complete. <br/> Your assets are being prepared for dispatch.
          </p>
          <Link href="/preview/empire/obsidian">
            <button className={`w-full py-5 bg-white text-black text-[10px] font-bold uppercase tracking-[0.3em] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all ${inter.className}`}>
              RETURN TO SYSTEM
            </button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-32 md:pt-48 pb-20 px-6 md:px-12 selection:bg-white selection:text-black">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
        
        {/* Left: Form */}
        <div className="lg:col-span-7">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className={`flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] font-bold text-white/40 mb-6 ${inter.className}`}>
              <Hexagon className="w-3 h-3 fill-white/40" /> SECURE_CHECKOUT
            </span>
            <h1 className={`text-4xl md:text-6xl font-bold uppercase tracking-widest mb-16 ${oswald.className}`}>
              INITIALIZE ACQUISITION
            </h1>

            <form onSubmit={handleComplete} className="space-y-12">
              {/* Contact Info */}
              <div className="space-y-6">
                <h2 className={`text-lg font-bold uppercase tracking-widest border-b border-white/10 pb-4 ${oswald.className}`}>01. OPERATIVE_DATA</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-[9px] uppercase tracking-[0.3em] font-bold text-white/40 mb-2 ${inter.className}`}>First Name</label>
                    <input required type="text" className={`w-full bg-[#111] border border-white/10 p-4 text-sm focus:border-white focus:outline-none transition-colors rounded-none ${inter.className}`} />
                  </div>
                  <div>
                    <label className={`block text-[9px] uppercase tracking-[0.3em] font-bold text-white/40 mb-2 ${inter.className}`}>Last Name</label>
                    <input required type="text" className={`w-full bg-[#111] border border-white/10 p-4 text-sm focus:border-white focus:outline-none transition-colors rounded-none ${inter.className}`} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={`block text-[9px] uppercase tracking-[0.3em] font-bold text-white/40 mb-2 ${inter.className}`}>Email Address</label>
                    <input required type="email" className={`w-full bg-[#111] border border-white/10 p-4 text-sm focus:border-white focus:outline-none transition-colors rounded-none ${inter.className}`} />
                  </div>
                </div>
              </div>

              {/* Shipping */}
              <div className="space-y-6">
                <h2 className={`text-lg font-bold uppercase tracking-widest border-b border-white/10 pb-4 ${oswald.className}`}>02. DROP_COORDINATES</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className={`block text-[9px] uppercase tracking-[0.3em] font-bold text-white/40 mb-2 ${inter.className}`}>Address Line 1</label>
                    <input required type="text" className={`w-full bg-[#111] border border-white/10 p-4 text-sm focus:border-white focus:outline-none transition-colors rounded-none ${inter.className}`} />
                  </div>
                  <div>
                    <label className={`block text-[9px] uppercase tracking-[0.3em] font-bold text-white/40 mb-2 ${inter.className}`}>City</label>
                    <input required type="text" className={`w-full bg-[#111] border border-white/10 p-4 text-sm focus:border-white focus:outline-none transition-colors rounded-none ${inter.className}`} />
                  </div>
                  <div>
                    <label className={`block text-[9px] uppercase tracking-[0.3em] font-bold text-white/40 mb-2 ${inter.className}`}>Postal Code</label>
                    <input required type="text" className={`w-full bg-[#111] border border-white/10 p-4 text-sm focus:border-white focus:outline-none transition-colors rounded-none ${inter.className}`} />
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className="space-y-6">
                <h2 className={`text-lg font-bold uppercase tracking-widest border-b border-white/10 pb-4 ${oswald.className}`}>03. AUTHORIZATION</h2>
                
                <div className="flex flex-col md:flex-row gap-4">
                  <button 
                    type="button" 
                    onClick={() => setPaymentMethod('card')}
                    className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all border ${paymentMethod === 'card' ? 'bg-white text-black border-white' : 'bg-transparent text-white/40 border-white/10 hover:border-white/30'} ${inter.className}`}
                  >
                    CREDIT CARD
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setPaymentMethod('upi')}
                    className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all border ${paymentMethod === 'upi' ? 'bg-white text-black border-white' : 'bg-transparent text-white/40 border-white/10 hover:border-white/30'} ${inter.className}`}
                  >
                    UPI
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setPaymentMethod('crypto')}
                    className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all border ${paymentMethod === 'crypto' ? 'bg-white text-black border-white' : 'bg-transparent text-white/40 border-white/10 hover:border-white/30'} ${inter.className}`}
                  >
                    CRYPTO
                  </button>
                </div>

                <div className="mt-6">
                  {paymentMethod === 'card' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className={`block text-[9px] uppercase tracking-[0.3em] font-bold text-white/40 mb-2 ${inter.className}`}>Card Number</label>
                        <input required type="text" placeholder="XXXX XXXX XXXX XXXX" className={`w-full bg-[#111] border border-white/10 p-4 text-sm focus:border-white focus:outline-none transition-colors rounded-none placeholder:text-white/20 ${inter.className}`} />
                      </div>
                      <div>
                        <label className={`block text-[9px] uppercase tracking-[0.3em] font-bold text-white/40 mb-2 ${inter.className}`}>Expiry (MM/YY)</label>
                        <input required type="text" placeholder="MM/YY" className={`w-full bg-[#111] border border-white/10 p-4 text-sm focus:border-white focus:outline-none transition-colors rounded-none placeholder:text-white/20 ${inter.className}`} />
                      </div>
                      <div>
                        <label className={`block text-[9px] uppercase tracking-[0.3em] font-bold text-white/40 mb-2 ${inter.className}`}>CVC</label>
                        <input required type="text" placeholder="XXX" className={`w-full bg-[#111] border border-white/10 p-4 text-sm focus:border-white focus:outline-none transition-colors rounded-none placeholder:text-white/20 ${inter.className}`} />
                      </div>
                    </div>
                  )}
                  {paymentMethod === 'upi' && (
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className={`block text-[9px] uppercase tracking-[0.3em] font-bold text-white/40 mb-2 ${inter.className}`}>UPI ID (VPA)</label>
                        <input required type="text" placeholder="username@upi" className={`w-full bg-[#111] border border-white/10 p-4 text-sm focus:border-white focus:outline-none transition-colors rounded-none placeholder:text-white/20 ${inter.className}`} />
                      </div>
                    </div>
                  )}
                  {paymentMethod === 'crypto' && (
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className={`block text-[9px] uppercase tracking-[0.3em] font-bold text-white/40 mb-2 ${inter.className}`}>Wallet Address (ERC-20)</label>
                        <input required type="text" placeholder="0x..." className={`w-full bg-[#111] border border-white/10 p-4 text-sm focus:border-white focus:outline-none transition-colors rounded-none placeholder:text-white/20 ${inter.className}`} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button type="submit" className={`w-full py-6 bg-white text-black text-[11px] font-bold uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 group hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] ${inter.className}`}>
                FINALIZE TRANSACTION <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </button>
            </form>
          </motion.div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-[#111] border border-white/10 p-8 sticky top-32"
          >
            <h2 className={`text-2xl font-bold uppercase tracking-widest border-b border-white/10 pb-6 mb-8 ${oswald.className}`}>
              ASSET_MANIFEST
            </h2>

            {cart.length === 0 ? (
              <p className={`text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold ${inter.className}`}>
                No assets selected.
              </p>
            ) : (
              <div className="space-y-8">
                {cart.map(item => (
                  <div key={`${item.id}-${item.size}-${item.color}`} className="flex gap-6">
                    <div className="w-20 h-20 bg-[#0a0a0a] border border-white/5 shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover grayscale contrast-125 mix-blend-screen opacity-80" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h3 className={`text-sm font-bold text-white uppercase tracking-widest ${oswald.className}`}>{item.name}</h3>
                      <p className={`text-[9px] text-white/40 mt-1 uppercase tracking-[0.2em] font-bold ${inter.className}`}>
                        {item.color} // SIZE {item.size} // QTY {item.quantity}
                      </p>
                      <p className={`text-sm font-bold text-white mt-2 ${oswald.className}`}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="pt-8 border-t border-white/10 space-y-4">
                  <div className="mb-8">
                    <h3 className={`text-[10px] uppercase tracking-[0.3em] font-bold text-white/40 mb-4 ${inter.className}`}>PROMOTIONAL CODE</h3>
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between border border-white/10 p-4 bg-white/5">
                        <div>
                          <span className={`text-[10px] font-bold uppercase tracking-[0.2em] text-white ${inter.className}`}>{appliedCoupon}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-[0.2em] text-[#00ff00] ml-3 ${inter.className}`}>-${discountAmount.toFixed(2)}</span>
                        </div>
                        <button onClick={removeCoupon} className={`text-[9px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors ${inter.className}`}>
                          REMOVE
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleApplyCoupon} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="ENTER CODE"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          className={`flex-1 bg-[#111] border border-white/10 px-4 py-3 text-[10px] focus:outline-none focus:border-white transition-colors uppercase tracking-[0.2em] placeholder:text-white/20 ${inter.className}`}
                        />
                        <button
                          type="submit"
                          disabled={!couponCode}
                          className={`px-6 bg-white text-black text-[9px] font-bold uppercase tracking-[0.3em] disabled:opacity-50 transition-colors ${inter.className}`}
                        >
                          APPLY
                        </button>
                      </form>
                    )}
                    {couponError && <p className={`text-[#ff4444] text-[9px] font-bold uppercase tracking-[0.2em] mt-3 ${inter.className}`}>{couponError}</p>}
                  </div>

                  <div className="flex justify-between items-center text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">
                    <span>Shipping</span>
                    <span>COMPLIMENTARY</span>
                  </div>
                  <div className="flex justify-between items-center pt-6 border-t border-white/10 text-white">
                    <span className={`text-xs uppercase tracking-[0.3em] font-bold ${inter.className}`}>Total</span>
                    <span className={`text-3xl font-bold tracking-widest ${oswald.className}`}>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>

      </div>
    </div>
  );
}
