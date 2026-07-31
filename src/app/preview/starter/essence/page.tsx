"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { ALL_PRODUCTS, useCart } from "./CartContext";
import { useRef } from "react";

export default function EssenceHomePage() {
  const { addToCart } = useCart();
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const featuredProducts = ALL_PRODUCTS.slice(0, 4);

  return (
    <div ref={containerRef} className="w-full">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-24 pb-12 px-6 overflow-hidden">
        <div className="absolute inset-0 z-0 flex md:flex-row flex-col">
          <div className="w-full md:w-1/2 h-full bg-[#F3EDE2]" />
          <div className="w-full md:w-1/2 h-full relative">
            <motion.div 
              className="absolute inset-0 bg-[#E3D8C8]"
              initial={{ scaleY: 1 }}
              animate={{ scaleY: 0 }}
              transition={{ duration: 1.5, ease: [0.77, 0, 0.175, 1], delay: 0.2 }}
              style={{ transformOrigin: "bottom" }}
            />
            <img 
              src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=2940&auto=format&fit=crop" 
              alt="Hero Interior" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="max-w-[1600px] w-full mx-auto relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col items-start pr-8 md:pr-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
              className="inline-block border border-[#4A3F35]/20 px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-medium text-[#4A3F35] mb-8"
            >
              New Collection 2026
            </motion.div>
            
            <div className="overflow-hidden mb-6">
              <motion.h1
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.7 }}
                className="font-serif text-5xl md:text-7xl lg:text-8xl text-[#4A3F35] leading-[1.1]"
              >
                Timeless Form <br/>
                <span className="italic text-[#A69684]">Meets Function.</span>
              </motion.h1>
            </div>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1.2 }}
              className="text-[#4A3F35]/70 max-w-md text-sm md:text-base leading-relaxed mb-10"
            >
              Discover our latest collection of meticulously crafted homeware. Designed to elevate your everyday rituals with understated elegance.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1.4 }}
            >
              <Link 
                href="/preview/starter/essence/products" 
                className="group flex items-center gap-4 text-[#4A3F35] hover:text-[#A69684] transition-colors"
              >
                <span className="text-xs uppercase tracking-[0.2em] font-bold border-b border-[#4A3F35] group-hover:border-[#A69684] pb-1">Explore Collection</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-32 px-6 bg-[#F3EDE2]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
            className="font-serif text-3xl md:text-5xl text-[#4A3F35] leading-tight mb-8"
          >
            "We believe that the objects we surround ourselves with should inspire calm and bring quiet joy to daily life."
          </motion.h2>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-[10px] uppercase tracking-[0.3em] text-[#A69684] font-bold"
          >
            — The Essence Studio
          </motion.div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 px-6 md:px-12 bg-[#F5F4F0]">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="font-serif text-4xl md:text-5xl text-[#4A3F35] mb-4">Curated Objects</h2>
              <p className="text-[#4A3F35]/60 text-sm">Essentials for the modern home.</p>
            </div>
            <Link 
              href="/preview/starter/essence/products" 
              className="text-xs uppercase tracking-[0.2em] text-[#4A3F35] border-b border-[#4A3F35]/20 pb-1 hover:border-[#4A3F35] transition-colors"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
            {featuredProducts.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.8, delay: idx * 0.1 }}
                className="group cursor-pointer"
              >
                <Link href={`/preview/starter/essence/products/${product.id}`}>
                  <div className="relative aspect-[3/4] mb-6 overflow-hidden bg-[#E3D8C8]">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
                    
                    {/* Hover Add to Cart Button */}
                    <div className="absolute bottom-0 left-0 w-full p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.16,1,0.3,1]">
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          addToCart(product);
                        }}
                        className="w-full py-4 bg-[#F3EDE2]/90 backdrop-blur-md text-[#4A3F35] text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#4A3F35] hover:text-[#F3EDE2] transition-colors"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </Link>
                <div className="flex flex-col gap-1 text-center">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[#A69684]">{product.category}</div>
                  <h3 className="font-serif text-lg text-[#4A3F35]">{product.name}</h3>
                  <div className="text-sm text-[#4A3F35]/70">${product.price.toFixed(2)}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Editorial Section */}
      <section className="py-0 flex flex-col md:flex-row h-auto md:h-[80vh]">
        <div className="w-full md:w-1/2 h-[50vh] md:h-full">
          <img 
            src="https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?q=80&w=2940&auto=format&fit=crop" 
            alt="Editorial" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="w-full md:w-1/2 h-full flex items-center justify-center p-12 md:p-24 bg-[#F3EDE2]">
          <div className="max-w-md">
            <h2 className="font-serif text-3xl md:text-5xl text-[#4A3F35] mb-8">The Art of Stillness</h2>
            <p className="text-[#4A3F35]/70 text-sm md:text-base leading-relaxed mb-10">
              Our designs are rooted in the belief that simplicity is the ultimate sophistication. We source natural materials and work with master artisans to create pieces that age beautifully over time.
            </p>
            <Link 
              href="/preview/starter/essence/about" 
              className="text-xs uppercase tracking-[0.2em] text-[#4A3F35] border-b border-[#4A3F35] pb-1 hover:text-[#A69684] hover:border-[#A69684] transition-colors"
            >
              Read Our Story
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
