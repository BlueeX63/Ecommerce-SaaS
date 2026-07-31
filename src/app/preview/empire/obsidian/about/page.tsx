"use client";

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Inter, Oswald } from 'next/font/google';
import { ArrowRight, Hexagon } from 'lucide-react';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });
const oswald = Oswald({ subsets: ['latin'] });

export default function ObsidianManifestoPage() {
  const containerRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const textY1 = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const textY2 = useTransform(scrollYProgress, [0, 1], ["0%", "-50%"]);
  
  return (
    <div ref={containerRef} className="relative bg-[#050505] text-white selection:bg-white selection:text-black">
      
      {/* 1. Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
        
        <div className="relative z-10 w-full px-6 md:px-12 flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
            className="flex items-center gap-4 mb-8"
          >
            <Hexagon className="w-4 h-4 fill-white" />
            <span className={`text-[10px] uppercase tracking-[0.5em] font-bold text-white/60 ${inter.className}`}>
              DOCUMENT // 01
            </span>
          </motion.div>

          <div className="overflow-hidden mb-6">
            <motion.h1 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.76, 0, 0.24, 1] }}
              className={`text-6xl md:text-[10vw] font-bold tracking-tighter uppercase leading-[0.8] text-center ${oswald.className}`}
            >
              MANIFESTO
            </motion.h1>
          </div>
        </div>
      </section>

      {/* 2. Core Philosophy */}
      <section className="py-32 md:py-48 px-6 md:px-12 max-w-[1200px] mx-auto border-t border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
          <motion.div 
            style={{ y: textY1 }}
            className="flex flex-col gap-8"
          >
            <h2 className={`text-4xl md:text-6xl font-bold uppercase tracking-widest leading-none ${oswald.className}`}>
              WE REJECT<br/>COMPROMISE.
            </h2>
            <div className="w-24 h-[2px] bg-white" />
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
            className="flex flex-col justify-center"
          >
            <p className={`text-lg md:text-xl text-white/60 leading-loose uppercase tracking-widest font-medium ${inter.className}`}>
              Obsidian was forged from a necessity for absolute performance. 
              We do not build for the casual observer. We engineer equipment for extreme environments, 
              utilizing synthetic carbon matrices and impact dispersion protocols that defy conventional logic.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 3. Visual Break */}
      <section className="h-[70vh] md:h-screen w-full relative overflow-hidden">
        <motion.img 
          style={{ y: textY2, scale: 1.2 }}
          src="https://images.unsplash.com/photo-1618365908648-e71bd5716cba?auto=format&fit=crop&q=80&w=2000"
          alt="Obsidian Engineering"
          className="absolute inset-0 w-full h-full object-cover grayscale contrast-150"
        />
        <div className="absolute inset-0 bg-black/60 mix-blend-multiply" />
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center z-10">
          <h2 className={`text-5xl md:text-8xl font-bold uppercase tracking-[0.2em] mix-blend-overlay opacity-80 ${oswald.className}`}>
            ENGINEERED<br/>RESILIENCE
          </h2>
        </div>
      </section>

      {/* 4. Action */}
      <section className="py-40 flex flex-col items-center justify-center text-center px-6 border-t border-white/10">
        <h2 className={`text-3xl md:text-5xl font-bold uppercase tracking-widest mb-12 ${oswald.className}`}>
          JOIN THE DIRECTIVE
        </h2>
        <Link href="/preview/empire/obsidian/products">
          <button className={`px-12 py-6 bg-white text-black text-[11px] font-bold uppercase tracking-[0.3em] transition-all flex items-center gap-4 group hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] ${inter.className}`}>
            ACCESS ARCHIVE <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
          </button>
        </Link>
      </section>
      
    </div>
  );
}
