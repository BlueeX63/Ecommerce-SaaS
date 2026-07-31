"use client";

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Inter, Oswald } from 'next/font/google';
import { useObsidian } from '../ObsidianContext';
import { Hexagon, X, ArrowRight, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });
const oswald = Oswald({ subsets: ['latin'] });

const PRODUCTS = [
  {
    id: "obsidian-prime",
    name: "PRIME",
    edition: "V1",
    price: 950,
    image: "https://images.unsplash.com/photo-1614729939124-03290b040973?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "obsidian-core",
    name: "CORE",
    edition: "V2",
    price: 850,
    image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "obsidian-apex",
    name: "APEX",
    edition: "V3",
    price: 1200,
    image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=1200&auto=format&fit=crop",
  }
];

export default function ObsidianWishlistPage() {
  const { wishlist, toggleWishlist, addToCart, mounted } = useObsidian();
  const containerRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const wishlistedItems = wishlist;
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);

  if (!mounted) return null;

  return (
    <div ref={containerRef} className="relative min-h-screen bg-[#050505] overflow-hidden selection:bg-white selection:text-black pb-40 pt-40 md:pt-56 px-6 md:px-12 text-white">
      
      {/* Background Typography */}
      <motion.div 
        style={{ y: bgY }}
        className="fixed top-20 left-0 w-full pointer-events-none flex justify-center opacity-[0.03] z-0"
      >
        <h1 className={`text-[30vw] font-bold uppercase tracking-tighter leading-none whitespace-nowrap ${oswald.className}`}>
          ARCHIVE
        </h1>
      </motion.div>

      <div className="relative z-10 max-w-[1800px] mx-auto">
        <header className="mb-24 md:mb-40 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-end">
          <div className="col-span-1 md:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
            >
              <span className={`block text-[10px] md:text-xs uppercase tracking-[0.4em] font-bold text-white/40 mb-8 md:mb-12 flex items-center gap-2 ${inter.className}`}>
                <Hexagon className="w-3 h-3 fill-white/40" /> SECURE_STORAGE
              </span>
              <h1 className={`text-6xl md:text-[120px] font-bold tracking-widest uppercase text-white leading-[0.85] ${oswald.className}`}>
                PERSONAL<br/>
                <span className="text-white/30 ml-12 md:ml-24">ARCHIVE</span>
              </h1>
            </motion.div>
          </div>
          
          <div className="col-span-1 md:col-span-4 pb-2 md:pb-6 flex justify-between items-end">
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.76, 0, 0.24, 1] }}
              className={`text-xs md:text-sm text-white/60 font-bold tracking-widest leading-loose max-w-sm uppercase ${inter.className}`}
            >
              ASSETS SECURED FOR FUTURE ACQUISITION.
            </motion.p>
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className={`text-4xl md:text-6xl font-bold tracking-tighter text-white/20 ${oswald.className}`}
            >
              ({wishlistedItems.length})
            </motion.span>
          </div>
        </header>

        {wishlistedItems.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col items-center justify-center py-40 border-t border-white/10"
          >
            <Hexagon className="w-16 h-16 stroke-[1] text-white/20 mb-8" />
            <h2 className={`text-2xl md:text-4xl font-bold uppercase tracking-widest text-white/40 mb-6 ${oswald.className}`}>
              ARCHIVE EMPTY
            </h2>
            <Link href="/preview/empire/obsidian/products">
              <button className={`px-10 py-5 bg-white text-black text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-3 group transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] ${inter.className}`}>
                <span className="flex items-center gap-3">
                  INITIALIZE SEARCH <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </span>
              </button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
            <AnimatePresence>
              {wishlistedItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                  transition={{ duration: 0.8, delay: index * 0.1, ease: [0.76, 0, 0.24, 1] }}
                  className="relative group border border-white/10 p-4 bg-[#111] hover:border-white/30 transition-colors duration-500"
                >
                  <Link href={`/preview/empire/obsidian/products/${item.id}`} className="block relative w-full overflow-hidden bg-[#0a0a0a] mb-6 aspect-square">
                    <div className="absolute inset-0 bg-white/5 group-hover:bg-transparent transition-colors duration-700 z-10 pointer-events-none" />
                    
                    <motion.img 
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover mix-blend-screen opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] grayscale contrast-125"
                    />

                    {/* Actions Overlay */}
                    <div className="absolute top-4 right-4 z-30 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button 
                        onClick={(e) => { e.preventDefault(); toggleWishlist(item); }}
                        className="w-10 h-10 bg-[#111] border border-white/20 hover:bg-white hover:text-black text-white flex items-center justify-center transition-all duration-300 pointer-events-auto"
                      >
                        <X className="w-4 h-4 transition-transform duration-500" />
                      </button>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 z-30 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-100 pointer-events-none">
                      <button 
                        onClick={(e) => { e.preventDefault(); addToCart({ ...item, quantity: 1, color: item.edition, size: "42", category: "Performance" }); }}
                        className={`w-full py-4 bg-white text-black font-bold flex items-center justify-center gap-3 transition-colors pointer-events-auto hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] ${inter.className}`}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span className="text-[9px] font-bold uppercase tracking-[0.3em]">ACQUIRE</span>
                      </button>
                    </div>
                  </Link>

                  <div className="flex flex-col gap-2">
                    <span className={`text-[9px] font-bold uppercase tracking-[0.4em] text-white/40 ${inter.className}`}>
                      SPEC: {item.edition}
                    </span>
                    <h3 className={`text-2xl font-bold tracking-widest uppercase text-white ${oswald.className}`}>
                      {item.name}
                    </h3>
                    <p className={`text-sm font-bold text-white/80 ${oswald.className}`}>
                      ${item.price.toFixed(2)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
