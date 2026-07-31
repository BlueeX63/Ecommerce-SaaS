"use client";

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Inter, Space_Grotesk, Syne } from 'next/font/google';
import { useAero } from '../AeroContext';
import { Heart, X, ArrowRight, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] });
const syne = Syne({ subsets: ['latin'] });

const PRODUCTS = [
  {
    id: "aero-one-noir",
    name: "AERO ONE",
    edition: "Noir",
    price: 850,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1600",
  },
  {
    id: "aero-one-blanc",
    name: "AERO ONE",
    edition: "Blanc",
    price: 850,
    image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=1200",
  },
  {
    id: "aero-x-graphite",
    name: "AERO X",
    edition: "Graphite",
    price: 1200,
    image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&q=80&w=1200",
  },
  {
    id: "aero-v2-stealth",
    name: "AERO V2",
    edition: "Stealth",
    price: 950,
    image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=1600",
  }
];

export default function AeroWishlistPage() {
  const { wishlist, toggleWishlist, addToCart, mounted } = useAero();
  const containerRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const wishlistedItems = wishlist;
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);

  if (!mounted) return null;

  return (
    <div ref={containerRef} className="relative min-h-screen bg-[#F8F7F5] overflow-hidden selection:bg-black selection:text-white pb-40 pt-40 md:pt-56 px-6 md:px-12">
      
      {/* Background Typography */}
      <motion.div 
        style={{ y: bgY }}
        className="fixed top-20 left-0 w-full pointer-events-none flex justify-center opacity-[0.03] z-0"
      >
        <h1 className={`text-[30vw] font-bold uppercase tracking-tighter leading-none whitespace-nowrap ${spaceGrotesk.className}`}>
          DESIRES
        </h1>
      </motion.div>

      <div className="relative z-10 max-w-[1800px] mx-auto">
        <header className="mb-24 md:mb-40 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-end">
          <div className="col-span-1 md:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className={`block text-[10px] md:text-xs uppercase tracking-[0.4em] font-bold text-black/40 mb-8 md:mb-12 ${inter.className}`}>
                Curated Selection
              </span>
              <h1 className={`text-6xl md:text-[120px] font-bold tracking-tighter uppercase text-black leading-[0.85] ${spaceGrotesk.className}`}>
                Your<br/>
                <span className="text-black/30 italic font-light ml-12 md:ml-24">Archive.</span>
              </h1>
            </motion.div>
          </div>
          
          <div className="col-span-1 md:col-span-4 pb-2 md:pb-6 flex justify-between items-end">
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className={`text-sm md:text-base text-black/60 font-medium leading-relaxed max-w-sm ${inter.className}`}
            >
              The objects you desire. Carefully saved for future acquisition.
            </motion.p>
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className={`text-xs font-bold uppercase tracking-widest text-black/40 ${syne.className}`}
            >
              {wishlist.length} Items
            </motion.span>
          </div>
        </header>

        {wishlistedItems.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-[50vh] rounded-[3rem] border border-black/10 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
            <Heart className="w-16 h-16 text-black/20 mb-8 stroke-[1]" />
            <h3 className={`text-2xl font-bold tracking-tighter uppercase text-black mb-4 ${spaceGrotesk.className}`}>Archive Empty</h3>
            <p className={`text-black/50 text-sm mb-12 ${inter.className}`}>You haven't saved any objects yet.</p>
            <Link href="/preview/empire/aero/products">
              <button className="relative overflow-hidden bg-[#050505] text-white px-12 py-5 rounded-full flex justify-center items-center group/btn cursor-pointer">
                <motion.div 
                  variants={{ hover: { y: "0%" }, initial: { y: "100%" } }}
                  initial="initial" whileHover="hover"
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 bg-white"
                />
                <span className={`relative z-10 text-xs font-bold uppercase tracking-[0.2em] mix-blend-difference text-white flex items-center gap-3 ${syne.className}`}>
                  Explore Collection <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform" />
                </span>
              </button>
            </Link>
          </motion.div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-8 md:gap-12 space-y-8 md:space-y-12">
            <AnimatePresence>
              {wishlistedItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                  transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="break-inside-avoid relative group"
                >
                  <Link href={`/preview/empire/aero/products/${item.id}`} className="block relative w-full overflow-hidden rounded-[2rem] bg-[#EAE9E6] mb-6">
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-700 z-10 pointer-events-none" />
                    
                    <motion.img 
                      src={item.image}
                      alt={item.name}
                      className="w-full object-cover mix-blend-multiply opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)] aspect-[3/4]"
                    />

                    {/* Actions Overlay */}
                    <div className="absolute top-6 right-6 z-30 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button 
                        onClick={(e) => { e.preventDefault(); toggleWishlist(item); }}
                        className="w-12 h-12 bg-white/80 hover:bg-white backdrop-blur-md rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 pointer-events-auto group/close"
                      >
                        <X className="w-5 h-5 text-black group-hover/close:rotate-90 transition-transform duration-500" />
                      </button>
                    </div>

                    <div className="absolute bottom-6 left-6 right-6 z-30 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-100 pointer-events-none">
                      <button 
                        onClick={(e) => { e.preventDefault(); addToCart({ ...item, quantity: 1, color: item.edition, size: "42", category: "Shoes" }); }}
                        className={`w-full h-14 bg-black text-white rounded-full flex items-center justify-center gap-3 shadow-2xl hover:bg-neutral-800 transition-colors pointer-events-auto ${spaceGrotesk.className}`}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Add to Bag</span>
                      </button>
                    </div>
                  </Link>

                  <div className="flex flex-col gap-1 px-2">
                    <span className={`text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 ${inter.className}`}>
                      Edition: {item.edition}
                    </span>
                    <h3 className={`text-2xl font-bold tracking-tighter uppercase text-black ${spaceGrotesk.className}`}>
                      {item.name}
                    </h3>
                    <span className={`text-lg font-medium text-black/60 ${syne.className}`}>
                      €{item.price}
                    </span>
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
