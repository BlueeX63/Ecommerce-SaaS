"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, ShieldCheck, CreditCard, Loader2 } from "lucide-react";


export default function OnboardingCheckoutPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/v1/auth/session");
        const data = await res.json();
        if (!data.isLoggedIn) {
          router.push("/login?next=/onboarding/checkout");
        } else {
          setSessionChecked(true);
        }
      } catch (e) {
        router.push("/login?next=/onboarding/checkout");
      }
    };
    checkSession();
  }, [router]);

  const handleMockPayment = async () => {
    setIsProcessing(true);
    // Simulate network request for payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    router.push("/onboarding/template-selection");
  };

  if (!sessionChecked) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF4D00] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] font-body text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#FF4D00]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-white/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-[#0A0A0A] rounded-[32px] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden relative z-10"
      >
        {/* Left Side - Order Summary */}
        <div className="p-10 md:p-12 border-b md:border-b-0 md:border-r border-white/10 bg-white/[0.02]">
          <div className="mb-12">
            <h2 className="font-heading text-3xl uppercase tracking-tighter mb-2">Monolith Pro</h2>
            <p className="text-white/50 text-sm font-medium">Billed annually, cancel anytime.</p>
          </div>

          <div className="space-y-6 mb-12">
            <div className="flex items-center gap-4 text-white/80">
              <CheckCircle2 className="w-5 h-5 text-[#FF4D00]" />
              <span className="font-medium">Unlimited Products & Categories</span>
            </div>
            <div className="flex items-center gap-4 text-white/80">
              <CheckCircle2 className="w-5 h-5 text-[#FF4D00]" />
              <span className="font-medium">All Premium Templates</span>
            </div>
            <div className="flex items-center gap-4 text-white/80">
              <CheckCircle2 className="w-5 h-5 text-[#FF4D00]" />
              <span className="font-medium">Edge Native Infrastructure</span>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/50 font-medium">Subtotal</span>
              <span className="font-medium">₹38,388</span>
            </div>
            <div className="flex justify-between items-center mb-6">
              <span className="text-white/50 font-medium">Tax (18% GST)</span>
              <span className="font-medium">₹6,910</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">Total Due Today</span>
              <span className="text-3xl font-heading tracking-tighter text-[#FF4D00]">₹45,298</span>
            </div>
          </div>
        </div>

        {/* Right Side - Payment Form (Mock) */}
        <div className="p-10 md:p-12 flex flex-col justify-center">
          <div className="mb-8 flex items-center justify-between">
            <h3 className="font-accent text-sm tracking-[0.2em] uppercase font-bold text-white/70">Payment Details</h3>
            <div className="flex items-center gap-2 text-white/40">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-xs uppercase tracking-widest font-bold">Secure</span>
            </div>
          </div>

          {/* Mock Card Input */}
          <div className="space-y-4 mb-8">
            <div className="relative">
              <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input 
                type="text" 
                defaultValue="4242 4242 4242 4242" 
                disabled 
                className="w-full bg-[#111] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white font-mono text-sm tracking-widest focus:outline-none opacity-50 cursor-not-allowed"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="text" 
                defaultValue="12/28" 
                disabled 
                className="w-full bg-[#111] border border-white/10 rounded-xl py-4 px-4 text-white font-mono text-sm tracking-widest focus:outline-none opacity-50 cursor-not-allowed text-center"
              />
              <input 
                type="text" 
                defaultValue="123" 
                disabled 
                className="w-full bg-[#111] border border-white/10 rounded-xl py-4 px-4 text-white font-mono text-sm tracking-widest focus:outline-none opacity-50 cursor-not-allowed text-center"
              />
            </div>
            <div className="pt-2">
              <input 
                type="text" 
                defaultValue="JOHN DOE" 
                disabled 
                className="w-full bg-[#111] border border-white/10 rounded-xl py-4 px-4 text-white font-mono text-sm tracking-widest focus:outline-none opacity-50 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="bg-[#FF4D00]/10 border border-[#FF4D00]/20 rounded-xl p-4 mb-8">
            <p className="text-[#FF4D00] text-sm font-medium text-center">
              Testing Mode: This is a mock checkout. No real charge will be made.
            </p>
          </div>

          <button 
            onClick={handleMockPayment}
            disabled={isProcessing}
            className="group relative w-full py-5 rounded-2xl bg-white text-black font-bold uppercase tracking-widest text-sm overflow-hidden transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-[#FF4D00] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.16,1,0.3,1] z-0" />
            <span className="relative z-10 group-hover:text-white transition-colors duration-500 flex items-center justify-center gap-2">
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                "Pay ₹45,298"
              )}
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
