"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { ArrowRight, Package, Settings2, LayoutTemplate, Sparkles, Command, BarChart3, X, Eye } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useRouter } from "next/navigation";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function PricingCards() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePurchase = () => {
    setShowModal(true);
  };

  const price = isAnnual ? 3199 : 3999;

  const features = [
    { title: "Unlimited Products", desc: "No limits on your catalog. Scale your store infinitely without hitting arbitrary caps.", icon: <Package className="w-5 h-5 text-[#FF4D00]" /> },
    { title: "Full Customization", desc: "Access raw code. Edit every component, animation, and layout to absolute perfection.", icon: <Settings2 className="w-5 h-5 text-[#FF4D00]" /> },
    { title: "5+ Premium Templates", desc: "Start with a library of high-conversion, modern templates built for top-tier brands.", icon: <LayoutTemplate className="w-5 h-5 text-[#FF4D00]" /> },
    { title: "Awwwards-Winning Vibe", desc: "Immersive WebGL, Framer Motion animations, and stunning typography out of the box.", icon: <Sparkles className="w-5 h-5 text-[#FF4D00]" /> },
    { title: "Command Dashboard", desc: "Total control over your empire. Manage products, orders, and customers from one hub.", icon: <Command className="w-5 h-5 text-[#FF4D00]" /> },
    { title: "Advanced Analytics", desc: "Real-time graphs, conversion metrics, and actionable insights to drive revenue growth.", icon: <BarChart3 className="w-5 h-5 text-[#FF4D00]" /> }
  ];

  if (!mounted) return null;

  return (
    <div className="w-full max-w-[1400px] mx-auto perspective-[2000px] pb-24">
      {/* Container */}
      <motion.div 
        initial={{ opacity: 0, rotateX: 5, y: 40 }}
        whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full h-auto min-h-[70vh] bg-[#0A0A0A] rounded-[40px] md:rounded-[60px] p-2 relative overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.15)] border border-black/[0.05]"
      >
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#FF4D00]/10 blur-[120px] rounded-full pointer-events-none translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#FF4D00]/5 blur-[100px] rounded-full pointer-events-none -translate-x-1/3 translate-y-1/3" />
        
        {/* Border wrapper for inner card */}
        <div className="w-full h-full min-h-full rounded-[38px] md:rounded-[58px] border border-white/10 relative z-10 overflow-hidden flex flex-col lg:flex-row shadow-[inset_0_0_80px_rgba(0,0,0,0.5)]">
          
          {/* Overlay Noise */}
          <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none z-0" style={{ backgroundImage: 'url("/noise.png")' }} />

          {/* Left Panel: Pricing & CTA */}
          <div className="w-full lg:w-[45%] h-auto lg:min-h-full p-8 md:p-14 lg:p-16 flex flex-col justify-between relative z-10 border-b lg:border-b-0 lg:border-r border-white/10 bg-gradient-to-b from-white/[0.02] to-transparent">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#FF4D00]/30 bg-[#FF4D00]/10 backdrop-blur-md mb-8">
                <div className="w-2 h-2 rounded-full bg-[#FF4D00] animate-pulse shadow-[0_0_10px_#FF4D00]" />
                <span className="text-[10px] font-accent uppercase tracking-[0.2em] font-bold text-[#FF4D00]">The Monolith Standard</span>
              </div>
              
              <h2 className="font-heading text-5xl md:text-7xl tracking-tighter uppercase text-white mb-6 leading-[0.9]">
                Pro <br /> <span className="text-white/30">Edition</span>
              </h2>
              <p className="text-white/50 font-medium text-lg max-w-sm leading-relaxed mb-10">
                Everything you need to scale your brand and build a digital empire. Zero limits.
              </p>

              {/* Billing Toggle (Styled elegantly) */}
              <div className="flex items-center gap-4 mb-8 text-sm font-accent tracking-wider font-bold">
                <span className={cn("transition-colors", !isAnnual ? "text-white" : "text-white/30")}>MONTHLY</span>
                <button 
                  onClick={() => setIsAnnual(!isAnnual)}
                  className="w-14 h-7 rounded-full bg-white/10 relative cursor-pointer border border-white/20 transition-colors hover:bg-white/20"
                >
                  <motion.div 
                    className="w-5 h-5 rounded-full bg-[#FF4D00] absolute top-[3px] left-[3px] shadow-[0_2px_8px_rgba(255,77,0,0.5)]"
                    animate={{ x: isAnnual ? 28 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
                <div className="flex items-center gap-2">
                  <span className={cn("transition-colors", isAnnual ? "text-white" : "text-white/30")}>ANNUALLY</span>
                  <span className="px-2 py-0.5 bg-[#FF4D00]/20 text-[#FF4D00] rounded text-[10px] uppercase tracking-widest border border-[#FF4D00]/30">Save 20%</span>
                </div>
              </div>
            </div>

            <div className="mt-8 lg:mt-0">
              <div className="flex items-end mb-10 relative">
                <span className="font-accent text-xl md:text-2xl mr-1 text-white/30 mb-1">₹</span>
                <div className="h-[40px] md:h-[50px] overflow-hidden relative flex items-center">
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={price}
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -50, opacity: 0 }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      className="font-heading text-[40px] md:text-[50px] leading-[0.8] inline-block text-white tracking-tighter"
                    >
                      {price.toLocaleString('en-IN')}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <span className="font-accent text-sm text-white/40 mb-2 ml-3 uppercase tracking-widest font-bold">/ mo</span>
              </div>

              {/* CTA Button */}
              <motion.button
                onClick={handlePurchase}
                className="group relative w-full h-16 md:h-20 bg-white rounded-[20px] md:rounded-[24px] flex items-center justify-center overflow-hidden cursor-pointer shadow-[0_10px_40px_rgba(255,255,255,0.1)] transition-shadow hover:shadow-[0_10px_60px_rgba(255,77,0,0.3)]"
              >
                {/* Sweep Background */}
                <div className="absolute inset-0 bg-[#FF4D00] translate-y-full group-hover:translate-y-0 transition-transform duration-700 ease-[0.16,1,0.3,1] z-0" />
                
                <span className="relative z-10 font-heading text-xl md:text-2xl uppercase tracking-wider text-[#0A0A0A] group-hover:text-white transition-colors duration-500 delay-100 flex items-center gap-3 mt-1">
                  Deploy Empire
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-[#0A0A0A] group-hover:bg-white flex items-center justify-center transition-colors duration-500">
                    <ArrowRight className="w-3 h-3 md:w-4 md:h-4 text-white group-hover:text-[#FF4D00] group-hover:-rotate-45 transition-all duration-500" />
                  </div>
                </span>
              </motion.button>
            </div>
          </div>

          {/* Right Panel: Features Bento Grid */}
          <div className="w-full lg:w-[55%] p-8 md:p-12 lg:p-14 bg-[#0E0E0E] relative z-10 flex flex-col justify-center">
            <h3 className="font-accent text-xs font-bold uppercase tracking-[0.2em] text-white/30 mb-8 flex items-center gap-4">
              <span className="w-8 h-[1px] bg-white/10" />
              Included Infrastructure
              <span className="flex-1 h-[1px] bg-white/10" />
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
              {features.map((feat, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 + (i * 0.1), ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col gap-4 p-5 md:p-6 rounded-[24px] bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.15] hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all duration-500 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] border border-white/5 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-6 group-hover:bg-[#FF4D00]/10 group-hover:border-[#FF4D00]/30 transition-all duration-500 ease-[0.16,1,0.3,1] shadow-inner shadow-white/5">
                    {feat.icon}
                  </div>
                  <div>
                    <h4 className="font-heading text-xl text-white/90 mb-1.5 tracking-tight group-hover:text-white transition-colors">{feat.title}</h4>
                    <p className="font-body text-sm text-white/40 leading-relaxed group-hover:text-white/60 transition-colors">{feat.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </motion.div>

      {mounted && createPortal(
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowModal(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-xl"
              />

              {/* Modal */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-xl bg-[#0A0A0A] border border-white/10 rounded-[32px] p-8 md:p-12 overflow-hidden shadow-[0_0_80px_rgba(255,77,0,0.15)]"
              >
                {/* Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF4D00]/20 blur-[80px] rounded-full pointer-events-none translate-x-1/3 -translate-y-1/3" />
                
                <button 
                  onClick={() => setShowModal(false)}
                  className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="relative z-10">
                  <h3 className="font-heading text-4xl md:text-5xl uppercase tracking-tighter text-white mb-4">
                    Next <span className="text-[#FF4D00]">Steps.</span>
                  </h3>
                  <p className="font-body text-white/50 text-lg mb-10 leading-relaxed">
                    You're about to provision enterprise-grade infrastructure. Do you want to preview the templates first, or proceed directly to checkout?
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={() => {
                        setShowModal(false);
                        router.push('/templates');
                      }}
                      className="flex-1 group relative flex items-center justify-center gap-3 py-5 px-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                    >
                      <Eye className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
                      <span className="font-accent font-bold uppercase tracking-widest text-xs text-white/70 group-hover:text-white transition-colors">
                        View Templates
                      </span>
                    </button>
                    
                    <button 
                      onClick={() => {
                        setShowModal(false);
                        router.push('/checkout/pro');
                      }}
                      className="flex-1 group relative flex items-center justify-center gap-3 py-5 px-6 rounded-2xl bg-[#FF4D00] text-white overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,77,0,0.3)] hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <div className="absolute inset-0 bg-white translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-0" />
                      <Command className="w-5 h-5 relative z-10 group-hover:text-black transition-colors duration-500" />
                      <span className="relative z-10 font-accent font-bold uppercase tracking-widest text-xs group-hover:text-black transition-colors duration-500">
                        Proceed to Pay
                      </span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
