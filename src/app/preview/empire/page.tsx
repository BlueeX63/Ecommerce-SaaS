"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Search, ShoppingCart, Menu, ArrowRight } from "lucide-react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import Lenis from "lenis";

export default function EmpireTemplatePreview() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const smoothProgress = useSpring(scrollYProgress, { damping: 20, stiffness: 100 });
  
  const heroScale = useTransform(smoothProgress, [0, 1], [1, 1.2]);
  const heroOpacity = useTransform(smoothProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(smoothProgress, [0, 1], ["0%", "50%"]);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.8,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  return (
    <div className="bg-[#050505] text-white font-body min-h-screen selection:bg-white selection:text-black">
      
      {/* Avant-Garde Navigation */}
      <header className="fixed top-0 left-0 w-full z-50 mix-blend-difference p-6 md:p-10 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto">
          <Link href="#" className="font-heading text-4xl tracking-tighter uppercase leading-none block">
            OBSIDIAN
          </Link>
          <span className="font-accent text-[10px] tracking-[0.2em] uppercase mt-2 block">
            High Performance Gear
          </span>
        </div>
        
        <div className="flex gap-8 pointer-events-auto items-center">
          <nav className="hidden lg:flex gap-8 font-accent text-xs tracking-widest uppercase">
            <Link href="#" className="hover:text-white/50 transition-colors">Vision</Link>
            <Link href="#" className="hover:text-white/50 transition-colors">Archive</Link>
            <Link href="#" className="hover:text-white/50 transition-colors">Objects</Link>
          </nav>
          
          <div className="flex gap-6">
            <button className="hover:text-white/50 transition-colors"><Search className="w-5 h-5" /></button>
            <button className="hover:text-white/50 transition-colors relative">
              <ShoppingCart className="w-5 h-5" />
              <div className="absolute -top-1 -right-2 w-4 h-4 bg-white text-black rounded-full text-[9px] font-bold flex items-center justify-center">
                2
              </div>
            </button>
            <button className="lg:hidden hover:text-white/50 transition-colors"><Menu className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      {/* Hero Section (Cinematic 3D Vibe) */}
      <section ref={containerRef} className="h-screen relative overflow-hidden flex items-center justify-center bg-black">
        {/* Placeholder for a 3D WebGL Canvas */}
        <motion.div 
          style={{ scale: heroScale, opacity: heroOpacity, y: heroY }}
          className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,rgba(0,0,0,1)_70%)]"
        >
          <div className="w-full h-full flex items-center justify-center opacity-20">
             <div className="w-[40vw] h-[40vw] rounded-full border border-white/20 animate-[spin_20s_linear_infinite]" />
             <div className="absolute w-[60vw] h-[60vw] rounded-full border border-white/10 animate-[spin_30s_linear_infinite_reverse]" />
          </div>
        </motion.div>

        <div className="relative z-10 text-center px-6 mix-blend-difference">
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="font-heading text-7xl md:text-[140px] leading-[0.8] tracking-tighter uppercase"
          >
            Defy <br /> Gravity.
          </motion.h1>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 mix-blend-difference"
        >
          <span className="font-accent text-[10px] tracking-[0.2em] uppercase">Scroll to Discover</span>
          <div className="w-[1px] h-12 bg-white/30 relative overflow-hidden">
            <motion.div 
              animate={{ y: ["-100%", "100%"] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="absolute inset-0 bg-white"
            />
          </div>
        </motion.div>
      </section>

      {/* Monolithic Product Grid */}
      <section className="py-32 px-6 md:px-10 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20">
          
          <div className="flex flex-col justify-end pb-20">
            <h2 className="font-heading text-5xl md:text-7xl uppercase tracking-tighter leading-none mb-6">
              Engineered <br/> for the <br/> extreme.
            </h2>
            <Link href="#" className="flex items-center gap-4 border-b border-white pb-2 w-fit font-accent text-sm tracking-widest uppercase hover:text-white/50 hover:border-white/50 transition-colors">
              Explore Series 01 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {[
            { name: "Carbon Fiber Shell", price: "$890", tag: "NEW" },
            { name: "Titanium Core", price: "$1,200", tag: "LIMITED" },
            { name: "Aero Stealth", price: "$650", tag: "" },
          ].map((product, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className={`group cursor-pointer ${i === 2 ? "md:col-span-2" : ""}`}
            >
              <div className="aspect-[4/5] bg-[#111] mb-6 relative overflow-hidden">
                {product.tag && (
                  <div className="absolute top-6 left-6 z-20 font-accent text-[10px] tracking-[0.2em] uppercase px-3 py-1 bg-white text-black mix-blend-screen">
                    {product.tag}
                  </div>
                )}
                
                {/* Image Placeholder with intense hover scale */}
                <div className="absolute inset-0 flex items-center justify-center font-heading text-4xl text-white/5 group-hover:scale-110 transition-transform duration-[1.5s] ease-[0.16,1,0.3,1] bg-gradient-to-t from-black/50 to-transparent">
                  OBJ_{i+1}
                </div>
              </div>
              
              <div className="flex justify-between items-start font-accent uppercase tracking-widest text-sm">
                <h3 className="group-hover:text-white/60 transition-colors">{product.name}</h3>
                <p>{product.price}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Immersive Full-width Section */}
      <section className="h-screen w-full relative overflow-hidden flex items-center justify-center bg-[#111]">
        <div className="absolute inset-0 bg-black/60 z-10" />
        <div className="relative z-20 text-center px-6">
          <h2 className="font-heading text-6xl md:text-9xl tracking-tighter uppercase mb-10 mix-blend-overlay opacity-80">
            Absolute Control.
          </h2>
          <button className="bg-white text-black font-accent text-xs tracking-[0.2em] uppercase px-12 py-5 hover:bg-black hover:text-white border border-white transition-colors duration-500">
            Pre-order Now
          </button>
        </div>
      </section>
      
    </div>
  );
}
