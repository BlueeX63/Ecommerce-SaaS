"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { Outfit, Syne } from "next/font/google";
import { ConceptScene } from "../components/ConceptScene";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useProgress } from "@react-three/drei";

const outfit = Outfit({ subsets: ["latin"] });
const syne = Syne({ subsets: ["latin"] });

export default function AeroConceptPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { progress } = useProgress();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (progress === 100) {
      // Add a slight delay for smooth transition
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

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Smooth out the scroll slightly for the UI elements
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // --- Background Color Transition ---
  // 0 -> 0.5 (Black), 0.5 -> 0.6 (Transitions to White), 0.6 -> 1.0 (White)
  const bgColor = useTransform(smoothProgress, [0.45, 0.55], ["#050505", "#ffffff"]);
  const textColor = useTransform(smoothProgress, [0.45, 0.55], ["#ffffff", "#050505"]);
  const invertedTextColor = useTransform(smoothProgress, [0.45, 0.55], ["#050505", "#ffffff"]);

  // --- Phase 1: Intro (0.0 to 0.25) ---
  const phase1Opacity = useTransform(smoothProgress, [0, 0.1, 0.2, 0.25], [1, 1, 0, 0]);
  const phase1Y = useTransform(smoothProgress, [0, 0.2], ["0%", "-50%"]);

  // --- Phase 2: Deconstructed (0.25 to 0.5) ---
  const phase2Opacity = useTransform(smoothProgress, [0.2, 0.25, 0.45, 0.5], [0, 1, 1, 0]);
  const p2LeftX = useTransform(smoothProgress, [0.2, 0.3], ["-100%", "0%"]);
  const p2RightX = useTransform(smoothProgress, [0.2, 0.3], ["100%", "0%"]);

  // --- Phase 3: Materialization (0.5 to 0.75) ---
  const phase3Opacity = useTransform(smoothProgress, [0.45, 0.55, 0.7, 0.75], [0, 1, 1, 0]);
  const phase3Scale = useTransform(smoothProgress, [0.5, 0.7], [0.8, 1]);

  // --- Phase 4: Zero Gravity / Outro (0.75 to 1.0) ---
  const phase4Opacity = useTransform(smoothProgress, [0.75, 0.85], [0, 1]);
  const phase4Y = useTransform(smoothProgress, [0.75, 0.85], ["50%", "0%"]);

  return (
    <>
      <AnimatePresence>
        {!isLoaded && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[99999] bg-[#050505] hidden md:flex flex-col items-center justify-center text-white"
          >
            <h2 className={`text-xl md:text-2xl font-bold tracking-[0.4em] uppercase mb-8 ${syne.className}`}>
              Initializing Engine
            </h2>
            <div className="w-64 h-[1px] bg-white/20 relative overflow-hidden">
              <motion.div 
                className="absolute top-0 left-0 h-full bg-white"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
            <div className={`mt-6 text-xs tracking-[0.2em] font-light text-white/50 ${outfit.className}`}>
              {progress.toFixed(0)}%
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isMobile ? (
        /* ═══ DESKTOP SCROLL-LINKED TRACK ═══ */
        <motion.div 
          ref={containerRef} 
          style={{ backgroundColor: bgColor }} 
          className="relative h-[450vh] w-full"
        >
          {/* ─── STICKY VIEWPORT ─── */}
          <div className="sticky top-0 w-full h-screen overflow-hidden flex items-center justify-center">
            
            {/* 3D Scene Layer */}
            <ConceptScene scrollYProgress={smoothProgress} />

            {/* ─── PHASE 1: INTRO ─── */}
            <motion.div 
              style={{ opacity: phase1Opacity, y: phase1Y }}
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 p-8"
            >
              <motion.h1 
                className={`text-6xl md:text-[9rem] font-extrabold tracking-[-0.05em] uppercase leading-[0.85] text-center mix-blend-difference ${syne.className}`}
                style={{ color: "#fff" }} // mix-blend needs specific colors
              >
                The Shape <br /> of Air.
              </motion.h1>
              <p className={`mt-10 text-white/40 tracking-[0.6em] uppercase text-xs md:text-sm font-light ${outfit.className}`}>
                Scroll to deconstruct
              </p>
            </motion.div>

            {/* ─── PHASE 2: DECONSTRUCTED ─── */}
            <motion.div 
              style={{ opacity: phase2Opacity }}
              className="absolute inset-0 pointer-events-none z-10"
            >
              {/* Left Callout */}
              <motion.div 
                style={{ x: p2LeftX }}
                className="absolute left-8 md:left-24 top-1/3 max-w-xs"
              >
                <div className="w-12 h-[1px] bg-white/40 mb-4" />
                <h2 className={`text-3xl md:text-5xl font-bold text-white uppercase tracking-[-0.03em] leading-none ${syne.className}`}>
                  01. Carbon<br/>Chassis
                </h2>
                <p className={`mt-6 text-sm md:text-base text-white/50 leading-relaxed font-light ${outfit.className}`}>
                  Engineered with aerospace-grade carbon fiber strands, the chassis provides structural rigidity without the weight, wrapping the foot in an unbreakable skeleton.
                </p>
              </motion.div>

              {/* Right Callout */}
              <motion.div 
                style={{ x: p2RightX }}
                className="absolute right-8 md:right-24 bottom-1/3 max-w-xs text-right flex flex-col items-end"
              >
                <div className="w-12 h-[1px] bg-white/40 mb-4" />
                <h2 className={`text-3xl md:text-5xl font-bold text-white uppercase tracking-[-0.03em] leading-none ${syne.className}`}>
                  02. Monolithic<br/>Sole
                </h2>
                <p className={`mt-6 text-sm md:text-base text-white/50 leading-relaxed font-light ${outfit.className}`}>
                  A single piece of injection-molded composite foam. No seams, no weak points. Pure aerodynamic fidelity and silent performance.
                </p>
              </motion.div>
            </motion.div>

            {/* ─── PHASE 3: MATERIALIZATION ─── */}
            <motion.div 
              style={{ opacity: phase3Opacity, scale: phase3Scale }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
            >
               <div className="absolute top-[10%] md:top-[15%] w-full text-center px-4 flex flex-col items-center">
                  <motion.h2 
                    style={{ color: "transparent", WebkitTextStroke: "1.5px #050505" }}
                    className={`text-6xl md:text-[9rem] font-black tracking-[-0.02em] uppercase leading-none mix-blend-difference ${syne.className}`}
                  >
                    Materialized
                  </motion.h2>
               </div>
               <div className="absolute bottom-[15%] md:bottom-[10%] right-8 md:right-24 max-w-sm text-right flex flex-col items-end">
                  <div className="w-16 h-[1px] bg-black/30 mb-6" />
                  <h3 className={`text-lg md:text-xl font-bold uppercase tracking-widest text-black mb-4 ${syne.className}`}>
                    Physical Reality
                  </h3>
                  <motion.p 
                    style={{ color: textColor }}
                    className={`text-sm md:text-base opacity-70 leading-relaxed font-light tracking-wide ${outfit.className}`}
                  >
                    The transition from pure concept to physical reality. We stripped away everything unnecessary. What remains is pure function, elevated by uncompromising aesthetics.
                  </motion.p>
               </div>
            </motion.div>

            {/* ─── PHASE 4: OUTRO ─── */}
            <motion.div 
              style={{ opacity: phase4Opacity, y: phase4Y }}
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20"
            >
              <motion.h2 
                style={{ color: textColor }}
                className={`text-6xl md:text-[8rem] font-bold tracking-[-0.04em] uppercase mb-14 leading-none ${syne.className}`}
              >
                Zero Gravity.
              </motion.h2>
              <Link href="/preview/empire/aero/products" className="pointer-events-auto">
                <motion.div 
                  whileHover="hover"
                  initial="initial"
                  style={{ color: invertedTextColor, backgroundColor: textColor }}
                  className={`group relative overflow-hidden flex items-center justify-center px-12 py-6 rounded-full font-bold tracking-[0.3em] uppercase text-xs md:text-sm cursor-pointer shadow-[0_20px_40px_rgba(0,0,0,0.15)] ${outfit.className}`}
                >
                  <span className="relative z-10 mix-blend-difference flex items-center gap-4">
                    Experience Aero
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                  </span>
                  <motion.div
                    variants={{
                      initial: { y: "100%" },
                      hover: { y: "0%" }
                    }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 bg-white mix-blend-difference rounded-full pointer-events-none"
                  />
                </motion.div>
              </Link>
            </motion.div>

          </div>
        </motion.div>
      ) : (
        /* ═══ MOBILE TRADITIONAL STACK LAYOUT ═══ */
        <div className="w-full flex flex-col bg-[#050505] text-white">
          
          {/* Mobile Hero */}
          <div className="w-full min-h-screen flex flex-col items-center justify-center px-6 pt-[15vh] pb-[10vh] relative overflow-hidden">
            <motion.h1 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className={`text-[10vw] font-black tracking-[-0.05em] uppercase leading-[0.85] text-center ${syne.className}`}
            >
              The Shape <br /> of Air.
            </motion.h1>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3 }}
              className="relative w-full aspect-square max-w-[300px] mt-12 mb-8 flex items-center justify-center rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent overflow-hidden"
            >
              <img 
                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800"
                alt="Aero wireframe concept"
                className="w-full h-full object-cover filter grayscale invert opacity-70 mix-blend-lighten"
              />
            </motion.div>
          </div>

          {/* Mobile Specs Section 1 */}
          <div className="w-full px-6 py-24 flex flex-col items-start border-t border-white/10 bg-gradient-to-b from-transparent to-white/[0.02]">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="w-12 h-[1px] bg-white/40 mb-4" />
              <h2 className={`text-4xl font-bold text-white uppercase tracking-[-0.03em] leading-none mb-6 ${syne.className}`}>
                01. Carbon<br/>Chassis
              </h2>
              <p className={`text-sm text-white/50 leading-relaxed font-light ${outfit.className}`}>
                Engineered with aerospace-grade carbon fiber strands, the chassis provides structural rigidity without the weight, wrapping the foot in an unbreakable skeleton.
              </p>
            </motion.div>
          </div>

          {/* Mobile Specs Section 2 */}
          <div className="w-full px-6 py-24 flex flex-col items-end text-right border-t border-white/10">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="w-12 h-[1px] bg-white/40 mb-4 ml-auto" />
              <h2 className={`text-4xl font-bold text-white uppercase tracking-[-0.03em] leading-none mb-6 ${syne.className}`}>
                02. Monolithic<br/>Sole
              </h2>
              <p className={`text-sm text-white/50 leading-relaxed font-light ${outfit.className}`}>
                A single piece of injection-molded composite foam. No seams, no weak points. Pure aerodynamic fidelity and silent performance.
              </p>
            </motion.div>
          </div>

          {/* Mobile Materialized Section (White bg) */}
          <div className="w-full bg-[#fafafa] text-black px-6 py-32 flex flex-col items-center text-center">
             <motion.h2 
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 1 }}
               style={{ color: "transparent", WebkitTextStroke: "1px #050505" }}
               className={`text-[7.5vw] md:text-[8vw] font-black tracking-[-0.02em] uppercase leading-none mb-12 ${syne.className}`}
             >
               Materialized
             </motion.h2>
             
             <motion.div
               initial={{ opacity: 0, scale: 0.95 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true }}
               transition={{ duration: 1, delay: 0.2 }}
               className="w-full relative aspect-square max-w-[300px] flex items-center justify-center mb-16 rounded-[2rem] border border-black/10 bg-gradient-to-br from-black/[0.05] to-transparent overflow-hidden"
             >
               <img 
                 src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800"
                 alt="Aero shoe physical"
                 className="w-full h-full object-cover drop-shadow-2xl mix-blend-multiply"
               />
             </motion.div>
             
             <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.4 }}
             >
                <div className="w-12 h-[1px] bg-black/30 mb-6 mx-auto" />
                <h3 className={`text-lg font-bold uppercase tracking-widest text-black mb-4 ${syne.className}`}>
                  Physical Reality
                </h3>
                <p className={`text-sm opacity-70 leading-relaxed font-light tracking-wide max-w-sm ${outfit.className}`}>
                  The transition from pure concept to physical reality. We stripped away everything unnecessary. What remains is pure function, elevated by uncompromising aesthetics.
                </p>
             </motion.div>
          </div>

          {/* Mobile Outro */}
          <div className="w-full bg-[#050505] text-white px-6 py-40 flex flex-col items-center justify-center text-center overflow-hidden relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-white/[0.03] blur-[80px] rounded-full pointer-events-none" />
            
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className={`text-[15vw] font-bold tracking-[-0.04em] uppercase mb-16 leading-none relative z-10 ${syne.className}`}
            >
              Zero<br/>Gravity.
            </motion.h2>
            
            <Link href="/preview/empire/aero/products" className="relative z-10">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className={`flex items-center justify-center px-10 py-5 rounded-full font-bold tracking-[0.3em] uppercase text-xs bg-white text-black shadow-2xl ${outfit.className}`}
              >
                Experience Aero
                <ArrowRight className="w-4 h-4 ml-3" />
              </motion.div>
            </Link>
          </div>

        </div>
      )}
    </>
  );
}
