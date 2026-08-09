"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, ArrowLeft, CreditCard, Lock, ShieldCheck, 
  MonitorPlay, Box, BarChart3, ShoppingCart, Mail, Globe, 
  Sparkles, Layers, Percent, RefreshCcw, Headphones, 
  Bot, Award, Banknote, UserCheck, EyeOff, CheckCircle2,
  Package, Settings2, LayoutTemplate, Command
} from "lucide-react";
import Link from "next/link";

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const plansData: Record<string, any> = {
  pro: {
    name: "Pro",
    description: "Everything you need to scale your brand and build a digital empire. Zero limits.",
    priceMonthly: 3999,
    priceAnnual: 3199,
    features: [
      {
        title: "Unlimited Products",
        desc: "No limits on your catalog. Scale your store infinitely without hitting arbitrary caps.",
        icon: Package
      },
      {
        title: "Full Customization",
        desc: "Access raw code. Edit every component, animation, and layout to absolute perfection.",
        icon: Settings2
      },
      {
        title: "5+ Premium Templates",
        desc: "Start with a library of high-conversion, modern templates built for top-tier brands.",
        icon: LayoutTemplate
      },
      {
        title: "Awwwards-Winning Vibe",
        desc: "Immersive WebGL, Framer Motion animations, and stunning typography out of the box.",
        icon: Sparkles
      },
      {
        title: "Command Dashboard",
        desc: "Total control over your empire. Manage products, orders, and customers from one hub.",
        icon: Command
      },
      {
        title: "Advanced Analytics",
        desc: "Real-time graphs, conversion metrics, and actionable insights to drive revenue growth.",
        icon: BarChart3
      }
    ]
  }
};

export default function CheckoutPage() {
  const params = useParams();
  const planId = params.planId as string;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [isAnnual, setIsAnnual] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function getUser() {
      try {
        const res = await fetch("/api/v1/auth/session");
        const data = await res.json();
        if (data.isLoggedIn && data.user) {
          setUser(data.user);
        }
      } catch (e) {
        setUser(null);
      }
    }
    getUser();
  }, []);

  const plan = plansData[planId];

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white">
        <div className="text-center">
          <h2 className="text-3xl font-heading mb-4">Plan not found</h2>
          <Link href="/pricing" className="text-accent hover:underline font-body">Return to pricing</Link>
        </div>
      </div>
    );
  }

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);
    try {
      /* 
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId, isAnnual }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      window.location.href = data.url;
      */
      
      // Simulate mock checkout delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      setShowSuccessOverlay(true);
      localStorage.setItem('has_empire_plan', 'true');
      
      // Redirect after success animation
      setTimeout(() => {
        router.push('/templates');
      }, 2500);
      
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] text-white flex flex-col lg:flex-row relative selection:bg-accent selection:text-white">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="fixed top-0 left-[20%] w-[800px] h-[800px] bg-accent/5 rounded-full blur-[150px] -translate-y-1/2" />
        <div className="fixed bottom-0 right-[20%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] translate-y-1/2" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      {/* Left Column (Content) */}
      <div className="w-full lg:w-7/12 p-8 pt-24 lg:p-16 lg:pt-32 xl:p-24 relative z-10">
        <div className="max-w-2xl mx-auto lg:mx-0">
          
          <Link 
            href="/pricing" 
            className="inline-flex items-center text-sm font-medium text-white/50 hover:text-white mb-12 transition-colors group"
          >
            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center mr-3 group-hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </div>
            Back to plans
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center px-4 py-2 rounded-full border border-accent/20 bg-accent/10 text-accent text-xs font-bold uppercase tracking-widest mb-6">
              {plan.name} Package
            </div>
            <h1 className="font-heading text-5xl md:text-7xl lg:text-[80px] tracking-tighter uppercase leading-[0.9] mb-6">
              Complete Your <br /><span className="text-white/40">Infrastructure.</span>
            </h1>
            <p className="font-body text-xl text-white/60 leading-relaxed mb-16 max-w-xl">
              {plan.description}
            </p>
          </motion.div>

          {/* Features Detailed List */}
          <div className="space-y-6 mb-24">
            <h3 className="font-heading text-2xl uppercase tracking-wider text-white/80 border-b border-white/10 pb-6 mb-8">
              What's Included
            </h3>
            
            {plan.features.map((feat: any, idx: number) => {
              const Icon = feat.icon;
              return (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="group flex items-start gap-6 p-6 rounded-3xl hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-accent/10 group-hover:border-accent/20 group-hover:text-accent transition-colors duration-500">
                    <Icon className="w-6 h-6 text-white/60 group-hover:text-accent transition-colors duration-500" />
                  </div>
                  <div>
                    <h4 className="font-heading text-xl md:text-2xl tracking-tight text-white/90 mb-2 group-hover:text-white transition-colors">
                      {feat.title}
                    </h4>
                    <p className="font-body text-white/50 leading-relaxed text-sm md:text-base">
                      {feat.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Right Column (Sticky Checkout Panel) */}
      <div className="w-full lg:w-5/12 bg-[#0a0a0a] border-t lg:border-t-0 lg:border-l border-white/5 relative z-20 shadow-2xl flex flex-col">
        <div className="lg:sticky lg:top-0 lg:h-screen flex flex-col justify-center p-8 lg:p-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md mx-auto"
          >
            
            <div className="mb-8 text-center lg:text-left">
              <h2 className="text-3xl font-heading uppercase tracking-wider text-white/90 mb-2">Order Summary</h2>
              <div className="h-1 w-12 bg-accent rounded-full mx-auto lg:mx-0"></div>
            </div>

            {/* Billing Toggle */}
            <div className="flex items-center p-1 bg-white/5 rounded-full border border-white/10 mb-8 max-w-fit mx-auto lg:mx-0">
              <button 
                onClick={() => setIsAnnual(false)}
                className={cn(
                  "px-6 py-2 rounded-full text-xs font-accent font-bold uppercase tracking-widest transition-all",
                  !isAnnual ? "bg-white text-black" : "text-white/50 hover:text-white"
                )}
              >
                Monthly
              </button>
              <button 
                onClick={() => setIsAnnual(true)}
                className={cn(
                  "px-6 py-2 rounded-full text-xs font-accent font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                  isAnnual ? "bg-white text-black" : "text-white/50 hover:text-white"
                )}
              >
                Yearly
                <span className={cn("px-1.5 py-0.5 rounded text-[9px] border", isAnnual ? "bg-black/10 border-black/20 text-black" : "bg-accent/20 border-accent/30 text-accent")}>Save 20%</span>
              </button>
            </div>
            
            {/* Price Card */}
            <div className="bg-white/[0.02] border border-white/10 rounded-[32px] p-8 mb-8 backdrop-blur-xl relative overflow-hidden">
              {/* Card Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 blur-[50px] -mr-16 -mt-16 pointer-events-none" />
              
              <div className="flex justify-between items-center pb-6 border-b border-white/10 mb-6">
                <span className="text-white/60 font-body text-lg">{plan.name} Plan <span className="text-sm opacity-60">({isAnnual ? 'Yearly' : 'Monthly'})</span></span>
                <div className="flex items-center overflow-hidden relative">
                  <span className="font-heading font-medium text-xl text-white mr-0.5">₹</span>
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={isAnnual ? 'annual-mo' : 'monthly-mo'}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="font-heading font-medium text-xl text-white inline-block"
                    >
                      {(isAnnual ? plan.priceAnnual : plan.priceMonthly).toLocaleString('en-IN')}
                    </motion.span>
                  </AnimatePresence>
                  <span className="font-heading font-medium text-xl text-white ml-1">/ mo</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="font-heading uppercase tracking-widest text-sm text-white/80">Total Due Today</span>
                  <div className="h-[20px] overflow-hidden relative">
                    <AnimatePresence mode="popLayout">
                      {isAnnual && (
                        <motion.span 
                          key="billed-annually"
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -20, opacity: 0 }}
                          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                          className="text-xs text-white/40 mt-1 block"
                        >
                          Billed annually at ₹{(plan.priceAnnual * 12).toLocaleString('en-IN')}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <div className="flex items-end overflow-hidden relative h-[48px] lg:h-[60px]">
                  <span className="font-heading font-bold text-3xl lg:text-4xl text-accent mr-1 mb-1 lg:mb-1.5">₹</span>
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={isAnnual ? 'annual-total' : 'monthly-total'}
                      initial={{ y: 40, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -40, opacity: 0 }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      className="font-heading font-bold text-4xl lg:text-5xl text-accent inline-block leading-none"
                    >
                      {(isAnnual ? plan.priceAnnual * 12 : plan.priceMonthly).toLocaleString('en-IN')}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Auth Status */}
            {user ? (
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10 mb-8 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs font-accent uppercase tracking-widest text-white/40 mb-1">Authenticated as</p>
                  <p className="font-body font-medium text-white/90 truncate">{user.email}</p>
                </div>
              </div>
            ) : (
              <div className="bg-blue-500/10 rounded-2xl p-5 border border-blue-500/20 mb-8 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                  <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full"
                  />
                </div>
                <div>
                  <p className="font-body font-medium text-blue-400">Verifying session...</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-8 p-5 bg-red-500/10 text-red-400 text-sm rounded-2xl border border-red-500/20 flex items-start gap-3"
                >
                  <Lock className="w-5 h-5 shrink-0" />
                  <span className="font-body leading-relaxed">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* CTA Button */}
            <button
              onClick={handleCheckout}
              disabled={isLoading || !user}
              className={cn(
                "w-full py-5 rounded-2xl font-accent font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden group",
                isLoading || !user ? "bg-white/10 text-white/30 cursor-not-allowed" : "bg-accent text-white hover:bg-white hover:text-black hover:shadow-[0_0_40px_rgba(255,77,0,0.3)]"
              )}
            >
              {isLoading ? (
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-6 h-6 border-2 border-current border-t-transparent rounded-full"
                />
              ) : (
                <>
                  <CreditCard className="w-5 h-5 transition-transform group-hover:scale-110 group-hover:-rotate-6" />
                  <span className="relative z-10">Proceed to Payment</span>
                </>
              )}
            </button>

            {/* Trust Badges */}
            <div className="mt-8 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-white/40">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-body uppercase tracking-wider font-semibold">256-Bit Secure SSL</span>
              </div>
              <div className="flex items-center gap-2 text-white/40">
                <Lock className="w-4 h-4" />
                <span className="text-xs font-body uppercase tracking-wider font-semibold">Powered by Stripe</span>
              </div>
            </div>

          </motion.div>
        </div>
      </div>
      
      {/* Payment Success Overlay */}
      <AnimatePresence>
        {showSuccessOverlay && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#050505]/90 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 200 }}
              className="flex flex-col items-center justify-center text-center max-w-md w-full p-8"
            >
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-accent/20 blur-[50px] rounded-full" />
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 15, stiffness: 300, delay: 0.2 }}
                  className="w-24 h-24 bg-accent/20 border border-accent/50 rounded-full flex items-center justify-center relative z-10"
                >
                  <CheckCircle2 className="w-12 h-12 text-accent" />
                </motion.div>
              </div>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="font-heading text-4xl uppercase tracking-wider text-white mb-4"
              >
                Payment <span className="text-accent">Successful</span>
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="font-body text-white/50 text-lg leading-relaxed"
              >
                Your Empire infrastructure is provisioning. Redirecting to templates...
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
