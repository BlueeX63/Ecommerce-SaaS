"use client";

import React, { useRef, useState, useEffect } from "react";
import { Scene } from "./components/Scene";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Inter, Oswald } from "next/font/google";
import { useObsidian } from "./ObsidianContext";
import { ArrowRight, Hexagon, Crosshair } from "lucide-react";
import { useProgress } from "@react-three/drei";

const inter = Inter({ subsets: ["latin"] });
const oswald = Oswald({ subsets: ["latin"] });

// Aggressive easing function
const expoEasing = [0.76, 0, 0.24, 1] as const;

export default function ObsidianLandingPage() {
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

  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const { addToCart } = useObsidian();
  const [selectedVariant, setSelectedVariant] = useState("V1");

  const variants = [
    { name: "V1", hex: "#ffffff" },
    { name: "V2", hex: "#ff0044" },
    { name: "V3", hex: "#00ffcc" },
  ];

  // Overlay opacity values based on scroll
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const middleOpacity = useTransform(scrollYProgress, [0.3, 0.5, 0.7], [0, 1, 0]);
  const finalOpacity = useTransform(scrollYProgress, [0.8, 1], [0, 1]);

  const handleAddToCart = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    addToCart({
      id: `obsidian-prime-${selectedVariant.toLowerCase()}`,
      name: `QUANTUM CORE // ${selectedVariant.toUpperCase()}`,
      price: 950.0,
      quantity: 1,
      image: "https://images.unsplash.com/photo-1614729939124-03290b040973?q=80&w=1600&auto=format&fit=crop",
      category: "Artefact",
      size: "N/A",
      color: selectedVariant,
    });
  };

  return (
    <>
      {/* Loading Screen */}
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)" }}
            transition={{ duration: 1, ease: expoEasing }}
            className="fixed inset-0 z-[99999] bg-[#020202] hidden md:flex flex-col items-center justify-center text-white"
          >
            <h2 className={`text-3xl font-bold tracking-[0.5em] uppercase mb-12 ${oswald.className}`}>
              INITIALIZING_CORE
            </h2>
            <div className="w-80 h-[2px] bg-white/10 relative overflow-hidden">
              <motion.div
                className="absolute top-0 left-0 h-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)]"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1, ease: "linear" }}
              />
            </div>
            <div className={`mt-8 text-xs tracking-[0.3em] font-bold text-white/50 ${inter.className}`}>
              {progress.toFixed(0)}% LOADED
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={containerRef} className="relative w-full h-[400vh] bg-[#020202] text-white">

        {/* Fixed 3D Scene */}
        <div className="sticky top-0 w-full h-screen overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Scene scrollYProgress={scrollYProgress} variant={selectedVariant} />
          </div>

          {/* Cinematic Overlay - Hero */}
          <motion.div
            style={{ opacity: heroOpacity }}
            className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center p-6 text-center mix-blend-difference"
          >
            <Hexagon className="w-8 h-8 stroke-[1] mb-6 animate-pulse" />
            <h1 className={`text-6xl md:text-[10vw] font-bold uppercase tracking-widest leading-[0.8] ${oswald.className}`}>
              QUANTUM<br />ARTEFACT
            </h1>
            <p className={`mt-8 text-xs md:text-sm tracking-[0.6em] uppercase font-bold text-white/70 ${inter.className}`}>
              DESCEND TO INITIALIZE
            </p>
          </motion.div>

          {/* Cinematic Overlay - Middle */}
          <motion.div
            style={{ opacity: middleOpacity }}
            className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center p-6 text-center mix-blend-difference"
          >
            <h2 className={`text-4xl md:text-7xl font-bold uppercase tracking-widest leading-[1] ${oswald.className}`}>
              UNSTABLE<br />CONTAINMENT
            </h2>
            <p className={`mt-8 text-xs md:text-sm tracking-[0.4em] uppercase font-bold text-white/50 max-w-xl ${inter.className}`}>
              Warning: Core fragmentation detected. Proximity alert active.
            </p>
          </motion.div>

          {/* Cinematic Overlay - Final (Acquire) */}
          <motion.div
            style={{ opacity: finalOpacity, pointerEvents: "auto" }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-end pb-32 p-6"
          >
            <div className="w-full max-w-4xl bg-black/40 backdrop-blur-xl border border-white/10 p-8 md:p-16 flex flex-col md:flex-row justify-between items-end md:items-center gap-12 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden group">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />

              <div className="relative z-10 flex-1 w-full">
                <div className="flex items-center gap-4 mb-6">
                  <span className={`flex items-center gap-2 bg-white text-black px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] ${oswald.className}`}>
                    <Crosshair className="w-3 h-3 text-black" /> TARGET_LOCKED
                  </span>
                  <span className={`text-[10px] tracking-[0.3em] font-bold text-white/40 uppercase ${inter.className}`}>
                    CORE_STABLE
                  </span>
                </div>

                <h2 className={`text-5xl md:text-6xl font-bold tracking-widest uppercase text-white mb-2 ${oswald.className}`}>
                  TESSERACT_V1
                </h2>

                <div className="mt-8">
                  <span className={`text-[9px] uppercase tracking-[0.3em] font-bold text-white/40 mb-4 block ${inter.className}`}>
                    ENERGY_FREQUENCY (VARIANT)
                  </span>
                  <div className="flex gap-4">
                    {variants.map((v) => (
                      <button
                        key={v.name}
                        onClick={() => setSelectedVariant(v.name)}
                        className={`w-10 h-10 rounded-none border transition-all duration-300 flex items-center justify-center ${selectedVariant === v.name
                            ? "border-white shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                            : "border-white/20 hover:border-white/50"
                          }`}
                      >
                        <div className="w-6 h-6" style={{ backgroundColor: v.hex }} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex flex-col items-end gap-6 w-full md:w-auto">
                <div className="text-right">
                  <span className={`block text-[9px] uppercase tracking-[0.4em] font-bold text-white/30 mb-2 ${inter.className}`}>
                    EXCHANGE_VALUE
                  </span>
                  <span className={`text-4xl font-bold tracking-widest text-white ${oswald.className}`}>
                    $950.00
                  </span>
                </div>

                <button
                  onClick={handleAddToCart}
                  className={`w-full md:w-auto px-12 py-6 bg-white text-black text-[11px] font-bold uppercase tracking-[0.4em] rounded-none transition-all duration-500 flex items-center justify-center gap-4 group/btn overflow-hidden relative ${inter.className}`}
                >
                  <span className="relative z-10 flex items-center gap-4 group-hover/btn:text-white transition-colors duration-500">
                    INITIATE ACQUISITION
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform duration-500" />
                  </span>
                  <div className="absolute inset-0 bg-[#ff0044] translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] z-0" />
                </button>
              </div>

            </div>
          </motion.div>

          {/* HUD Edge Brackets */}
          <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-white/20 z-10 pointer-events-none" />
          <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-white/20 z-10 pointer-events-none" />
          <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-white/20 z-10 pointer-events-none" />
          <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-white/20 z-10 pointer-events-none" />
        </div>
      </div>
    </>
  );
}
