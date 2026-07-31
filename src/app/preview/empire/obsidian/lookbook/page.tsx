"use client";

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Inter, Oswald } from 'next/font/google';
import { Hexagon, Maximize } from 'lucide-react';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });
const oswald = Oswald({ subsets: ['latin'] });

const IMAGES = [
  "https://images.unsplash.com/photo-1614729939124-03290b040973?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=800&auto=format&fit=crop",
];

export default function ObsidianLookbookPage() {
  const containerRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '10%']);

  return (
    <div ref={containerRef} className="relative min-h-screen bg-[#050505] overflow-hidden pb-40 pt-40 md:pt-56 px-6 md:px-12 text-white">
      
      {/* Background Typography */}
      <motion.div 
        style={{ y: bgY }}
        className="fixed top-32 left-0 w-full pointer-events-none flex justify-center opacity-[0.03] z-0"
      >
        <h1 className={`text-[30vw] font-bold uppercase tracking-tighter leading-none whitespace-nowrap ${oswald.className}`}>
          VISUALS
        </h1>
      </motion.div>

      <div className="relative z-10 max-w-[1800px] mx-auto">
        <header className="mb-24 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
          >
            <span className={`flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.5em] font-bold text-white/40 mb-8 ${inter.className}`}>
              <Hexagon className="w-3 h-3 fill-white/40" /> SYSTEM_RECORDS
            </span>
            <h1 className={`text-5xl md:text-8xl font-bold tracking-widest uppercase text-white mb-6 ${oswald.className}`}>
              VISUAL DATA
            </h1>
            <p className={`text-xs uppercase tracking-[0.3em] text-white/60 font-bold max-w-lg mx-auto leading-loose ${inter.className}`}>
              Field recordings of Obsidian operatives in high-stress environments.
            </p>
          </motion.div>
        </header>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
          {IMAGES.map((src, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: (index % 3) * 0.2, ease: [0.76, 0, 0.24, 1] }}
              className="break-inside-avoid relative group border border-white/5 bg-[#111]"
            >
              <div className="relative w-full overflow-hidden">
                <div className="absolute inset-0 bg-white/5 group-hover:bg-transparent transition-colors duration-700 z-10 pointer-events-none" />
                <motion.img 
                  src={src}
                  alt={`Visual Record ${index + 1}`}
                  className="w-full object-cover grayscale contrast-125 group-hover:grayscale-0 group-hover:contrast-100 transition-all duration-[1500ms] ease-[0.76,0,0.24,1] opacity-80 group-hover:opacity-100 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20">
                  <div className="w-16 h-16 rounded-none bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center">
                    <Maximize className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-white/5 flex justify-between items-center bg-[#0a0a0a]">
                <span className={`text-[9px] font-bold uppercase tracking-[0.4em] text-white/40 ${inter.className}`}>
                  RECORD // 0{index + 1}
                </span>
                <span className={`text-[9px] font-bold uppercase tracking-[0.2em] text-white/20 ${inter.className}`}>
                  {2026 - (index % 2)}.{10 - index}.01
                </span>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-32 text-center">
          <Link href="/preview/empire/obsidian/products">
            <button className={`px-12 py-5 border border-white/20 text-white text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-colors ${inter.className}`}>
              RETURN TO ARCHIVE
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
