"use client";

import React, { useRef, useState, useEffect } from "react";
import { Scene } from "./components/Scene";
import { motion, useScroll, useTransform, useMotionValue, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Inter, Space_Grotesk } from "next/font/google";
import { useAero } from "./AeroContext";
import { ArrowRight, Star } from "lucide-react";
import { useProgress } from "@react-three/drei";

const inter = Inter({ subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"] });

export default function AeroLandingPage() {
  const { progress } = useProgress();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (progress === 100) {
      const timer = setTimeout(() => setIsLoaded(true), 500);
      return () => clearTimeout(timer);
    }
  }, [progress]);

  useEffect(() => {
    if (!isLoaded && window.innerWidth >= 768) {
      document.body.style.overflow = "hidden";
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; }
  }, [isLoaded]);

  const [windowHeight, setWindowHeight] = useState(1000);
  
  useEffect(() => {
    setWindowHeight(window.innerHeight);
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { scrollY } = useScroll();
  const router = useRouter();
  // The sticky container is 200vh tall. To reach the bottom of it, we scroll 100vh.
  const scrollYProgress = useTransform(scrollY, [0, windowHeight * 1.2], [0, 1]);

  const { addToCart } = useAero();
  const [selectedSize, setSelectedSize] = useState("42");
  const [selectedColor, setSelectedColor] = useState("Noir");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ─── SCROLL-LINKED UI ANIMATIONS ───
  // Text stays completely still and visible as requested
  // Scroll indicator vanishes early
  const indicatorOpacity = useTransform(scrollYProgress, [0, 0.1], [0.5, 0]);
  
  // Product card fades in and slides up just as the shoe docks
  const cardOpacity = useTransform(scrollYProgress, [0.55, 0.7], [0, 1]);
  const cardY = useTransform(scrollYProgress, [0.55, 0.7], [100, 0]);
  const cardScale = useTransform(scrollYProgress, [0.55, 0.7], [0.95, 1]);

  // Mobile 2D fallback docking animations
  const mobileFallbackY = useTransform(scrollYProgress, [0, 0.7], [0, 120]);
  const mobileFallbackScale = useTransform(scrollYProgress, [0, 0.7], [1.2, 0.7]);

  const handleAddToCart = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    addToCart({
      id: `aero-one-${selectedColor.toLowerCase()}`,
      name: `AERO ONE : ${selectedColor.toUpperCase()}`,
      price: 850.0,
      quantity: 1,
      image: "https://images.unsplash.com/photo-1552346154-21d32810baa3?auto=format&fit=crop&q=80&w=800",
      category: "Limited Edition",
      size: selectedSize,
      color: selectedColor,
    });
  };

  const colors = [
    { name: "Noir", hex: "#0a0a0a" },
    { name: "Arctic", hex: "#e0e0e0" },
    { name: "Slate", hex: "#4a5568" },
  ];

  // Dock coordinates in Three.js world space:
  // Desktop: shoe lands perfectly centered in the right 45% section
  // Mobile: shoe lands in the TOP half of the card
  const dockX = isMobile ? 0 : 2.6;
  const dockY = isMobile ? 0.9 : -0.1;

  return (
    <>
      <AnimatePresence>
        {!isLoaded && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[99999] bg-[#fafafa] hidden md:flex flex-col items-center justify-center text-black"
          >
            <h2 className={`text-xl md:text-2xl font-bold tracking-[0.4em] uppercase mb-8 ${spaceGrotesk.className}`}>
              Aero Experience
            </h2>
            <div className="w-64 h-[1px] bg-black/10 relative overflow-hidden">
              <motion.div 
                className="absolute top-0 left-0 h-full bg-black"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
            <div className={`mt-6 text-xs tracking-[0.2em] font-light text-black/50 ${inter.className}`}>
              {progress.toFixed(0)}%
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative w-full bg-[#fafafa] text-black">
      
      {!isMobile ? (
        <div className="relative h-[200vh] w-full">
          {/* ═══ HERO TEXT LAYER (SCROLLS NORMALLY) ═══ */}
          <div className="absolute top-0 left-0 w-full h-[100vh] flex flex-col items-center justify-center overflow-hidden z-[1] pointer-events-none">
            
            <div className="flex flex-col items-center justify-center w-full relative z-10">
              <div className="overflow-hidden">
                <motion.h1 
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  className={`text-[12vw] md:text-[10vw] font-bold tracking-[-0.05em] uppercase leading-[0.9] text-black select-none ${spaceGrotesk.className}`}
                >
                  AERO <span className="font-light text-black/40 italic px-2">ONE</span>
                </motion.h1>
              </div>
              <div className="overflow-hidden mt-2">
                <motion.p 
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className={`text-xs md:text-sm tracking-[0.4em] uppercase text-black/60 font-medium ${inter.className}`}
                >
                  Elevate your perception of movement
                </motion.p>
              </div>
            </div>
            
            <div className="absolute bottom-16 flex justify-between items-end w-full px-8 md:px-24">
               <motion.div 
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ duration: 1, delay: 0.8 }}
                 className="flex flex-col gap-3"
               >
                 <div className="w-12 h-[1px] bg-black/20"></div>
                 <p className={`text-[10px] md:text-xs uppercase tracking-[0.3em] font-medium text-black/50 ${inter.className}`}>
                   Vol. 1
                 </p>
               </motion.div>
               <motion.div 
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ duration: 1, delay: 0.8 }}
                 className="flex flex-col gap-3 items-end"
               >
                 <div className="w-12 h-[1px] bg-black/20"></div>
                 <p className={`text-[10px] md:text-xs uppercase tracking-[0.3em] font-medium text-black/50 ${inter.className}`}>
                   Available Now
                 </p>
               </motion.div>
            </div>
          </div>

          {/* Sticky Viewport */}
          <div className="sticky top-0 w-full h-screen overflow-hidden">
            
            {/* ═══ 3D SCENE (Desktop) ═══ */}
            <div className="absolute inset-0 z-[10] pointer-events-none overflow-hidden">
              <Scene scrollYProgress={scrollYProgress} dockX={dockX} dockY={dockY} />
            </div>

            {/* ── Scroll Indicator ── */}
            <motion.div
              style={{ opacity: indicatorOpacity }}
              className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-[2]"
            >
              <span
                className={`text-[9px] uppercase tracking-[0.3em] text-black/40 font-medium ${inter.className}`}
              >
                Scroll to explore
              </span>
              <div className="w-[1px] h-10 bg-black/15 overflow-hidden relative">
                <motion.div
                  animate={{ y: ["-100%", "200%"] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
                  className="absolute top-0 w-full h-1/3 bg-black/60"
                />
              </div>
            </motion.div>

            {/* ═══ PRODUCT CARD ═══ */}
            <motion.div
              style={{ opacity: cardOpacity, y: cardY, scale: cardScale }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-[3] px-4 md:px-8"
            >
              <div className="w-full max-w-[1100px] bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_20px_80px_rgba(0,0,0,0.08)] rounded-[2rem] flex flex-col-reverse md:flex-row overflow-hidden relative mt-10 md:mt-0 group hover:border-black/10 transition-colors duration-500 pointer-events-auto">
                
                {/* Invisible native link covering the entire card */}
                <Link href="/preview/empire/aero/products/aero-one" className="absolute inset-0 z-20 cursor-pointer rounded-[2rem]" />
                
                {/* Left Side: Product Info */}
                <div className="w-full md:w-[55%] p-8 md:p-14 flex flex-col justify-center bg-white/40 relative z-10 pointer-events-none">
                  
                  {/* Ensure inner elements have pointer-events-auto */}
                  <div className="pointer-events-auto">
                    
                    <div className="flex items-center gap-3 mb-6 md:mb-8">
                      <span className="flex items-center gap-1 bg-black text-white px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest">
                        <Star className="w-3 h-3 fill-white" /> Top Rated
                      </span>
                      <span className="text-[10px] tracking-[0.2em] font-bold text-black/40 uppercase">
                        New Arrival
                      </span>
                    </div>
                  {/* Title */}
                  <h2
                    className={`text-4xl md:text-5xl font-bold tracking-[-0.04em] uppercase text-black mb-1 ${spaceGrotesk.className}`}
                  >
                    AERO ONE
                  </h2>
                  <p
                    className={`text-xs md:text-sm tracking-[0.2em] uppercase text-black/40 font-bold mb-5 md:mb-7 ${inter.className}`}
                  >
                    Edition: {selectedColor}
                  </p>

                  {/* Description */}
                  <p
                    className={`text-sm text-black/60 leading-relaxed font-medium mb-6 md:mb-8 max-w-md ${inter.className}`}
                  >
                    Engineered with aerospace-grade materials and an adaptive
                    cushioning system. Unparalleled comfort meets monolithic design in our most advanced silhouette.
                  </p>

                  {/* Options Row */}
                  <div className="flex flex-col md:flex-row gap-6 md:gap-12 mb-8 md:mb-10">
                    {/* Color Swatches */}
                    <div>
                      <span
                        className={`text-[10px] uppercase tracking-[0.2em] font-bold text-black/40 mb-3 block ${spaceGrotesk.className}`}
                      >
                        Color
                      </span>
                      <div className="flex gap-2.5 relative z-30 pointer-events-auto">
                        {colors.map((c) => (
                          <button
                            key={c.name}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedColor(c.name);
                            }}
                            className={`w-8 h-8 rounded-full border-2 transition-all duration-300 ${
                              selectedColor === c.name
                                ? "border-black scale-110 shadow-md"
                                : "border-black/10 hover:border-black/30"
                            }`}
                            style={{ backgroundColor: c.hex }}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Sizes */}
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-3">
                        <span
                          className={`text-[10px] uppercase tracking-[0.2em] font-bold text-black/40 ${spaceGrotesk.className}`}
                        >
                          Size (EU)
                        </span>
                        <span
                          className={`text-[10px] uppercase tracking-[0.15em] text-black/30 underline cursor-pointer hover:text-black/60 transition-colors ${inter.className}`}
                        >
                          Guide
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 relative z-30 pointer-events-auto">
                        {["39", "40", "41", "42", "43", "44", "45"].map((size) => (
                          <button
                            key={size}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSize(size);
                            }}
                            className={`w-10 h-10 text-[11px] font-bold rounded-xl transition-all duration-300 ${
                              selectedSize === size
                                ? "bg-black text-white shadow-lg scale-105"
                                : "bg-black/[0.04] text-black/60 hover:bg-black/[0.08]"
                            } ${inter.className}`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Price & CTA */}
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                      <span
                        className={`block text-[10px] uppercase tracking-[0.25em] font-bold text-black/30 mb-1 ${spaceGrotesk.className}`}
                      >
                        Price
                      </span>
                      <span
                        className={`text-3xl font-bold tracking-tight text-black ${spaceGrotesk.className}`}
                      >
                        $850.00
                      </span>
                    </div>

                    <button
                      onClick={handleAddToCart}
                      className={`w-full md:w-auto px-10 py-4 md:py-5 bg-black text-white text-[11px] md:text-xs font-bold uppercase tracking-[0.2em] rounded-2xl transition-all duration-500 flex items-center justify-center gap-3 group/btn overflow-hidden relative z-30 hover:shadow-xl hover:shadow-black/20 active:scale-[0.98] cursor-pointer pointer-events-auto ${spaceGrotesk.className}`}
                    >
                      <span className="relative z-10 flex items-center gap-3">
                        ADD TO BAG
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
                      </span>
                      <div className="absolute inset-0 bg-neutral-800 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-0 rounded-2xl" />
                    </button>
                  </div>
                </div>
              </div>

                {/* Right Side: Shoe Display Area */}
                <div className="w-full md:w-[45%] relative min-h-[350px] md:min-h-full flex items-center justify-center bg-gradient-to-br from-black/[0.03] to-transparent overflow-hidden">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full border border-black/[0.04] shadow-[inset_0_0_60px_rgba(0,0,0,0.02)]" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] rounded-full border border-black/[0.06]" />
                  <span className="absolute bottom-8 right-8 text-[9px] uppercase tracking-[0.3em] font-bold text-black/20">
                    Interactive 3D
                  </span>
                </div>
              </div>
            </motion.div>
            
          </div>
        </div>
      ) : (
        /* ═══ TRADITIONAL MOBILE LAYOUT (No Scroll Mechanics) ═══ */
        <div className="w-full flex flex-col pt-[12vh] pb-16 px-4 bg-[#fafafa]">
          {/* Mobile Hero Text */}
          <div className="flex flex-col items-center justify-center w-full mb-8 relative z-10">
            <div className="overflow-hidden">
              <motion.h1 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className={`text-[15vw] font-bold tracking-[-0.05em] uppercase leading-[0.9] text-black select-none ${spaceGrotesk.className}`}
              >
                AERO <span className="font-light text-black/40 italic px-1">ONE</span>
              </motion.h1>
            </div>
            <div className="overflow-hidden mt-3">
              <motion.p 
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className={`text-[10px] tracking-[0.4em] uppercase text-black/60 font-medium ${inter.className}`}
              >
                Elevate your perception
              </motion.p>
            </div>
          </div>

          {/* Unified Mobile Product Card */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_20px_80px_rgba(0,0,0,0.08)] rounded-[2rem] p-6 relative overflow-hidden"
          >
            <Link href="/preview/empire/aero/products/aero-one" className="absolute inset-0 z-20 cursor-pointer" />
            
            <div className="relative z-30 pointer-events-none">
              
              {/* Product Image inside Card */}
              <div className="w-full aspect-[4/3] md:aspect-video relative flex items-center justify-center mb-6 rounded-[1.5rem] overflow-hidden border border-black/[0.05]">
                <img 
                  src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800"
                  alt="AERO Shoe"
                  className="w-full h-full object-cover relative z-10"
                />
              </div>
              <div className="flex items-center gap-2 mb-6">
                <span className="flex items-center gap-1 bg-black text-white px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest">
                  <Star className="w-3 h-3 fill-white" /> Top Rated
                </span>
                <span className="text-[9px] tracking-[0.2em] font-bold text-black/40 uppercase">
                  New Arrival
                </span>
              </div>

              <h2 className={`text-3xl font-bold tracking-[-0.04em] uppercase text-black mb-1 ${spaceGrotesk.className}`}>
                AERO ONE
              </h2>
              <p className={`text-[10px] tracking-[0.2em] uppercase text-black/40 font-bold mb-5 ${inter.className}`}>
                Edition: {selectedColor}
              </p>

              <p className={`text-[11px] text-black/60 leading-relaxed font-medium mb-8 ${inter.className}`}>
                Engineered with aerospace-grade materials and an adaptive cushioning system. Unparalleled comfort meets monolithic design.
              </p>

              <div className="flex flex-col gap-6 mb-8 pointer-events-auto">
                {/* Colors */}
                <div>
                  <span className={`text-[9px] uppercase tracking-[0.2em] font-bold text-black/40 mb-3 block ${spaceGrotesk.className}`}>Color</span>
                  <div className="flex gap-3 relative z-30">
                    {colors.map((c) => (
                      <button
                        key={c.name}
                        onClick={(e) => { e.stopPropagation(); setSelectedColor(c.name); }}
                        className={`w-7 h-7 rounded-full border-2 transition-all duration-300 ${
                          selectedColor === c.name ? "border-black scale-110 shadow-md" : "border-black/10 hover:border-black/30"
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Sizes */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className={`text-[9px] uppercase tracking-[0.2em] font-bold text-black/40 ${spaceGrotesk.className}`}>Size (EU)</span>
                  </div>
                  <div className="flex flex-wrap gap-2 relative z-30">
                    {["39", "40", "41", "42", "43", "44", "45"].map((size) => (
                      <button
                        key={size}
                        onClick={(e) => { e.stopPropagation(); setSelectedSize(size); }}
                        className={`w-9 h-9 text-[10px] font-bold rounded-xl transition-all duration-300 ${
                          selectedSize === size
                            ? "bg-black text-white shadow-lg scale-105"
                            : "bg-black/[0.04] text-black/60"
                        } ${inter.className}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Price & CTA */}
              <div className="flex items-center justify-between gap-4 pointer-events-auto">
                <div>
                  <span className={`block text-[9px] uppercase tracking-[0.25em] font-bold text-black/30 mb-1 ${spaceGrotesk.className}`}>Price</span>
                  <span className={`text-2xl font-bold tracking-tight text-black ${spaceGrotesk.className}`}>$850</span>
                </div>
                <button
                  onClick={handleAddToCart}
                  className={`flex-1 py-4 bg-black text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 group/btn relative z-30 active:scale-[0.98] ${spaceGrotesk.className}`}
                >
                  ADD TO BAG
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      </div>

      {/* ═══ CRAZY AWWWARDS ACCORDION GALLERY ═══ */}
      <div className="relative w-full bg-[#050505] text-white z-10 py-32 md:py-48 overflow-hidden border-t border-white/10">
        
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/[0.02] blur-[150px] rounded-full pointer-events-none translate-x-1/2 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-white/[0.03] blur-[100px] rounded-full pointer-events-none -translate-x-1/3 translate-y-1/3" />

        <div className="max-w-[1800px] mx-auto px-4 md:px-8 relative z-10">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 px-4 md:px-8">
            <div className="flex flex-col gap-6">
              <span className={`text-[10px] md:text-xs uppercase tracking-[0.5em] font-bold text-white/40 flex items-center gap-4 ${inter.className}`}>
                <div className="w-8 h-[1px] bg-white/40" /> 
                Curated Selection
              </span>
              <h2 className={`text-6xl md:text-[120px] font-bold uppercase tracking-tighter leading-[0.85] text-white mix-blend-difference ${spaceGrotesk.className}`}>
                THE<br/>
                <span className="text-white/30 italic font-light tracking-tight ml-8 md:ml-16">VAULT.</span>
              </h2>
            </div>
            <Link href="/preview/empire/aero/products" className="group flex items-center gap-6 cursor-pointer mt-12 md:mt-0">
              <span className={`text-[10px] md:text-xs uppercase tracking-[0.3em] font-bold text-white/60 group-hover:text-white transition-colors ${inter.className}`}>
                Explore Entire Collection
              </span>
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 -rotate-45 group-hover:rotate-0 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" />
              </div>
            </Link>
          </div>

          {/* THE ACCORDION GALLERY */}
          <div className="flex flex-col md:flex-row w-full h-[90vh] min-h-[600px] md:h-[80vh] md:min-h-[700px] gap-2 md:gap-4 group/container">
            {[
              { id: 'aero-concept', name: 'AERO CONCEPT', price: 950, tag: 'Limited', desc: 'The original blueprint that started the revolution. Uncompromised aesthetic.', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1200' },
              { id: 'aero-two', name: 'AERO TWO', price: 750, tag: 'New', desc: 'Refined for the streets. Lighter, faster, and aggressively styled.', img: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=1200' },
              { id: 'aero-pro', name: 'AERO PRO', price: 1150, tag: 'Pro', desc: 'Carbon-infused chassis for maximum energy return and elite performance.', img: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=1200' }
            ].map((product, i) => (
              <Link 
                key={i} 
                href={`/preview/empire/aero/products/${product.id}`}
                className="relative h-full flex-1 overflow-hidden rounded-[1.5rem] md:rounded-[2.5rem] group/card transition-[flex] duration-[900ms] ease-[cubic-bezier(0.25,1,0.5,1)] hover:flex-[3] md:hover:flex-[4] bg-[#0a0a0a]"
              >
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                  <div className="absolute inset-0 bg-black/60 group-hover/card:bg-black/20 transition-colors duration-[900ms] ease-[cubic-bezier(0.25,1,0.5,1)] z-10" />
                  <motion.img 
                    src={product.img} 
                    alt={product.name}
                    className="w-full h-full object-cover object-center scale-100 group-hover/card:scale-105 transition-transform duration-[1500ms] ease-[cubic-bezier(0.25,1,0.5,1)] mix-blend-luminosity group-hover/card:mix-blend-normal opacity-50 group-hover/card:opacity-100"
                  />
                  {/* Subtle Grain Overlay for texture */}
                  <div className="absolute inset-0 z-20 opacity-10 pointer-events-none mix-blend-overlay bg-[url('https://upload.wikimedia.org/wikipedia/commons/7/76/1k_Dissolve_Noise_Texture.png')] bg-repeat" />
                </div>

                {/* Collapsed State Title (Vertical on Desktop, Horizontal on Mobile) */}
                <div className="absolute inset-0 z-30 flex flex-col md:items-center justify-end md:justify-center p-6 opacity-100 transition-opacity duration-500 delay-300 group-hover/card:opacity-0 group-hover/card:duration-200 group-hover/card:delay-0">
                  <div className="flex flex-row md:flex-col items-center justify-between md:justify-center gap-4 md:gap-8 translate-y-0 transition-transform duration-500 delay-300 group-hover/card:translate-y-8 group-hover/card:duration-200 group-hover/card:delay-0">
                    <h3 className={`text-2xl md:text-4xl font-bold uppercase tracking-tight text-white/80 md:rotate-180 md:[writing-mode:vertical-lr] whitespace-nowrap ${spaceGrotesk.className}`}>
                      {product.name}
                    </h3>
                    <span className={`text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-white/40 md:rotate-180 md:[writing-mode:vertical-lr] ${inter.className}`}>
                      0{i + 1} // {product.tag}
                    </span>
                  </div>
                </div>

                {/* Expanded State Content */}
                <div className="absolute inset-0 z-40 p-6 md:p-12 flex flex-col justify-end opacity-0 transition-opacity duration-200 delay-0 group-hover/card:opacity-100 group-hover/card:duration-[700ms] group-hover/card:delay-300 pointer-events-none group-hover/card:pointer-events-auto">
                  <div className="max-w-md w-full translate-y-12 transition-transform duration-200 delay-0 group-hover/card:translate-y-0 group-hover/card:duration-[900ms] group-hover/card:delay-200 ease-[cubic-bezier(0.25,1,0.5,1)]">
                    
                    {/* Tag & Number */}
                    <div className="flex items-center gap-4 mb-6 md:mb-8">
                      <span className={`text-lg md:text-xl font-medium text-white/50 ${inter.className}`}>0{i+1}</span>
                      <div className="h-[1px] w-12 bg-white/30" />
                      <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] text-white bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 ${inter.className}`}>
                        {product.tag}
                      </span>
                    </div>

                    <h3 className={`text-4xl md:text-7xl font-bold uppercase tracking-tighter text-white mb-4 md:mb-6 leading-[0.9] ${spaceGrotesk.className}`}>
                      {product.name}
                    </h3>
                    
                    <p className={`text-xs md:text-sm text-white/70 mb-8 md:mb-10 leading-relaxed max-w-[280px] md:max-w-xs ${inter.className}`}>
                      {product.desc}
                    </p>

                    <div className="flex items-center justify-between border-t border-white/20 pt-6">
                      <span className={`text-xl md:text-3xl font-bold text-white ${spaceGrotesk.className}`}>
                        ${product.price}
                      </span>
                      <div className="flex items-center gap-4 group/btn cursor-pointer">
                        <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 group-hover/btn:text-white transition-colors ${inter.className}`}>
                          Discover
                        </span>
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/30 flex items-center justify-center bg-white/5 backdrop-blur-sm group-hover/btn:bg-white group-hover/btn:border-white transition-all duration-500">
                          <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-white group-hover/btn:text-black group-hover/btn:-rotate-45 transition-all duration-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </div>

    </>
  );
}
