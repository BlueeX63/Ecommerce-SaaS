"use client";

import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Inter, Space_Grotesk } from 'next/font/google';
import { useAero } from '../AeroContext';
import { ArrowRight, Star, Plus } from 'lucide-react';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] });

const PRODUCTS = [
  {
    id: "aero-one-noir",
    name: "AERO ONE",
    edition: "Noir",
    price: 850,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1600",
    category: "Signature",
    colSpan: "col-span-12 md:col-span-6",
    aspect: "aspect-square"
  },
  {
    id: "aero-one-blanc",
    name: "AERO ONE",
    edition: "Blanc",
    price: 850,
    image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=1200",
    category: "Signature",
    colSpan: "col-span-12 md:col-span-6",
    aspect: "aspect-square"
  },
  {
    id: "aero-x-graphite",
    name: "AERO X",
    edition: "Graphite",
    price: 1200,
    image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&q=80&w=1200",
    category: "Limited Edition",
    colSpan: "col-span-12 md:col-span-6",
    aspect: "aspect-square"
  },
  {
    id: "aero-v2-stealth",
    name: "AERO V2",
    edition: "Stealth",
    price: 950,
    image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=1600",
    category: "Performance",
    colSpan: "col-span-12 md:col-span-6",
    aspect: "aspect-square"
  }
];

export default function AeroProductsPage() {
  const { addToCart, toggleWishlist, isInWishlist, mounted } = useAero();
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const { scrollYProgress } = useScroll();

  // Gentle parallax for background text
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);

  return (
    <div className="relative min-h-screen bg-[#F8F7F5] overflow-hidden selection:bg-black selection:text-white pb-40">
      
      {/* Massive Background Typography */}
      <motion.div 
        style={{ y: bgY }}
        className="fixed top-20 left-0 w-full pointer-events-none flex justify-center opacity-[0.03] z-0"
      >
        <h1 className={`text-[30vw] font-bold uppercase tracking-tighter leading-none whitespace-nowrap ${spaceGrotesk.className}`}>
          ARCHIVE
        </h1>
      </motion.div>

      <div className="relative z-10 max-w-[1800px] mx-auto px-6 md:px-12 pt-40 md:pt-56">
        
        {/* Editorial Header */}
        <header className="mb-24 md:mb-40 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-end">
          <div className="col-span-1 md:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className={`block text-[10px] md:text-xs uppercase tracking-[0.4em] font-bold text-black/40 mb-8 md:mb-12 ${inter.className}`}>
                Season 01 / Core Collection
              </span>
              <h1 className={`text-6xl md:text-[120px] font-bold tracking-tighter uppercase text-black leading-[0.85] ${spaceGrotesk.className}`}>
                Object<br/>
                <span className="text-black/30 italic font-light ml-12 md:ml-24">Index.</span>
              </h1>
            </motion.div>
          </div>
          
          <div className="col-span-1 md:col-span-4 pb-2 md:pb-6">
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className={`text-sm md:text-base text-black/60 font-medium leading-relaxed max-w-sm ${inter.className}`}
            >
              A curated selection of monolithic footwear. Engineered with absolute precision, designed for the avant-garde. Every silhouette challenges the boundaries of movement.
            </motion.p>
          </div>
        </header>

        {/* Asymmetrical Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 lg:gap-16">
          {PRODUCTS.map((product, i) => (
            <motion.div 
              key={product.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className={`group relative flex flex-col ${product.colSpan}`}
              onMouseEnter={() => setHoveredProduct(product.id)}
              onMouseLeave={() => setHoveredProduct(null)}
            >
              
              <Link href={`/preview/empire/aero/products/${product.id}`} className="block relative w-full overflow-hidden rounded-[2rem] md:rounded-[3rem] bg-[#EAE9E6] mb-8 md:mb-10 group-hover:shadow-[0_40px_80px_rgba(0,0,0,0.05)] transition-shadow duration-[1000ms] cursor-pointer">
                
                <div className={`relative w-full ${product.aspect} overflow-hidden`}>
                  {/* Subtle reveal overlay */}
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-700 z-10 pointer-events-none" />
                  
                  <motion.img 
                    src={product.image}
                    alt={`${product.name} ${product.edition}`}
                    className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                  />

                  {/* Top Tags */}
                  <div className="absolute top-6 left-6 md:top-8 md:left-8 z-20 flex items-center gap-3 bg-white/40 backdrop-blur-md px-4 py-2 rounded-full border border-black/5 opacity-0 group-hover:opacity-100 -translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-100">
                    <span className={`text-[9px] font-bold uppercase tracking-[0.2em] text-black ${inter.className}`}>
                      {product.category}
                    </span>
                  </div>
                </div>

                {/* Hover Add/Wishlist Actions Overlay */}
                <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-end p-6 md:p-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="flex gap-4 translate-y-8 group-hover:translate-y-0 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product); }}
                      className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 hover:bg-black group/wish transition-all duration-300 pointer-events-auto"
                    >
                      <Star className={`w-5 h-5 transition-colors ${mounted && isInWishlist(product.id) ? 'fill-black text-black group-hover/wish:fill-white group-hover/wish:text-white' : 'text-black group-hover/wish:text-white'}`} />
                    </button>
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart({ ...product, quantity: 1, color: product.edition, size: "42" }); }}
                      className={`flex-1 h-14 bg-black text-white rounded-full flex items-center justify-between px-8 shadow-2xl hover:bg-neutral-800 transition-colors pointer-events-auto group/add ${spaceGrotesk.className}`}
                    >
                      <span className="text-xs font-bold uppercase tracking-[0.2em]">Add to Bag</span>
                      <Plus className="w-5 h-5 group-hover/add:rotate-90 transition-transform duration-500" />
                    </button>
                  </div>
                </div>
              </Link>

              {/* Typography / Details */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
                <div className="flex flex-col gap-2">
                  <span className={`text-[10px] uppercase tracking-[0.3em] text-black/40 font-bold ${inter.className}`}>
                    0{i + 1} / Edition: {product.edition}
                  </span>
                  <h3 className={`text-2xl md:text-4xl font-bold tracking-tighter uppercase text-black ${spaceGrotesk.className}`}>
                    {product.name}
                  </h3>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="h-[1px] w-12 bg-black/10 hidden md:block" />
                  <span className={`text-xl md:text-2xl font-bold text-black ${spaceGrotesk.className}`}>
                    ${product.price}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
