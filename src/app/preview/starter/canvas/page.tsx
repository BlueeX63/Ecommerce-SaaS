"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ALL_PRODUCTS } from "./CartContext";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function CanvasHomePage() {
  const featuredProducts = ALL_PRODUCTS.slice(0, 4);
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="flex flex-col w-full bg-black text-white" ref={containerRef}>
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-end px-6 md:px-12 pb-12 pt-32 z-10 overflow-hidden">
        <motion.div style={{ y, opacity }} className="w-full flex flex-col justify-between h-full">
          <div className="flex justify-between items-start w-full mb-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2, delay: 0.5 }}
              className="text-[10px] uppercase tracking-[0.2em] text-white/50"
            >
              Collection 001
            </motion.div>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2, delay: 0.7 }}
              className="text-[10px] uppercase tracking-[0.2em] text-white/50 text-right"
            >
              Curated <br/> Objects
            </motion.div>
          </div>
          
          <div className="mt-auto">
            <motion.h1 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              className="font-serif text-[12vw] md:text-[14vw] leading-[0.8] tracking-tighter uppercase max-w-full break-words"
            >
              Canvas.
            </motion.h1>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2, delay: 0.8 }}
              className="flex justify-between items-end mt-12 md:mt-24 border-t border-white/20 pt-6"
            >
              <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] leading-loose text-white/70 max-w-sm">
                A study in restraint. High-fidelity objects stripped of all ornamentation.
              </p>
              <Link 
                href="/preview/starter/canvas/products"
                className="text-[10px] md:text-xs uppercase tracking-[0.2em] flex items-center gap-4 hover:text-white/50 transition-colors"
              >
                <span>Enter Archive</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Cinematic Image Break */}
      <section className="relative w-full h-screen overflow-hidden">
        <motion.div 
          initial={{ scale: 1.1 }}
          whileInView={{ scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          viewport={{ once: true }}
          className="absolute inset-0 w-full h-full"
        >
          <img 
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2000&auto=format&fit=crop" 
            alt="Architecture"
            className="w-full h-full object-cover grayscale opacity-80"
          />
        </motion.div>
      </section>

      {/* Featured Products */}
      <section className="relative z-10 py-32 px-6 md:px-12 border-t border-white/10">
        <div className="w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-24 border-b border-white/10 pb-6 gap-8">
            <h2 className="font-serif text-5xl md:text-7xl uppercase tracking-tighter">
              Selected <br/> Works.
            </h2>
            <Link href="/preview/starter/canvas/products" className="text-[10px] uppercase tracking-[0.2em] hover:text-white/50 transition-colors">
              [ View All ]
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-l border-white/10">
            {featuredProducts.map((product, index) => (
              <Link 
                key={product.id} 
                href={`/preview/starter/canvas/products/${product.id}`}
                className="group block border-r border-b border-white/10 relative overflow-hidden"
              >
                <div className="aspect-[3/4] overflow-hidden relative">
                  <div className="absolute top-6 left-6 z-10">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white mix-blend-difference">
                      [{product.id}]
                    </span>
                  </div>
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-[1.5s] ease-out opacity-80 group-hover:opacity-100"
                  />
                </div>
                <div className="p-6 bg-black flex flex-col justify-between h-32">
                  <h3 className="font-serif text-xl tracking-tight truncate text-white">{product.name}</h3>
                  <div className="flex justify-between items-end">
                    <p className="text-[10px] tracking-[0.2em] uppercase text-white/50">{product.category}</p>
                    <p className="font-mono text-xs tracking-widest text-white">${product.price.toFixed(2)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="relative z-10 py-32 md:py-48 px-6 md:px-12 border-t border-white/10 flex justify-center text-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <h2 className="font-serif text-4xl md:text-6xl lg:text-8xl italic tracking-tighter uppercase leading-[0.9] mb-12">
            "We surround ourselves with objects that demand nothing but our attention."
          </h2>
          <div className="w-[1px] h-24 bg-white/30 mb-12"></div>
          <Link 
            href="/preview/starter/canvas/about"
            className="text-[10px] uppercase tracking-[0.2em] border border-white px-8 py-4 hover:bg-white hover:text-black transition-colors duration-500"
          >
            Discover the Maison
          </Link>
        </div>
      </section>

    </div>
  );
}
