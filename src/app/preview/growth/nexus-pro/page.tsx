"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { useRef } from "react";
import { NEXUS_PRODUCTS, useShop } from "./ShopContext";

export default function NexusProHomePage() {
  const containerRef = useRef(null);
  const { addToCart, setIsCartOpen } = useShop();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const featuredProducts = NEXUS_PRODUCTS.slice(0, 3);
  
  return (
    <div className="flex flex-col w-full bg-[#0a0a0a]" ref={containerRef}>
      
      {/* Hero Section */}
      <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }}
          className="absolute inset-0 z-0"
        >
          <img 
            src="https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=2564&auto=format&fit=crop" 
            alt="Nexus Texture" 
            className="w-full h-full object-cover opacity-60 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/50 to-[#0a0a0a]" />
        </motion.div>

        <div className="relative z-10 text-center px-6 mt-16 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <span className="text-[#d4af37] text-xs font-bold uppercase tracking-[0.3em] mb-6 block">
              The Evolution of Style
            </span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
            className="text-6xl md:text-8xl lg:text-[10rem] font-black uppercase tracking-tighter leading-[0.85] text-white mb-8"
          >
            Form Meets <br /> Function.
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="flex flex-col items-center"
          >
            <p className="text-white/60 max-w-md mx-auto mb-10 text-lg">
              Engineered garments and essentials designed for the modern metropolitan landscape.
            </p>
            <Link 
              href="/preview/growth/nexus-pro/products"
              className="group relative px-8 py-4 bg-white text-black font-bold uppercase tracking-widest text-xs overflow-hidden rounded-full"
            >
              <span className="relative z-10 flex items-center gap-2 group-hover:text-white transition-colors duration-500">
                Explore Collection <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-[#d4af37] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-0" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Marquee Section */}
      <section className="py-12 border-y border-white/10 bg-white/5 overflow-hidden whitespace-nowrap flex items-center">
        <motion.div 
          animate={{ x: [0, -1035] }}
          transition={{ repeat: Infinity, ease: "linear", duration: 20 }}
          className="flex gap-16 text-4xl font-black uppercase tracking-tighter text-white/20"
        >
          <span>Engineered Precision</span> <span className="text-[#d4af37]">•</span>
          <span>Aesthetic Dominance</span> <span className="text-[#d4af37]">•</span>
          <span>Urban Utility</span> <span className="text-[#d4af37]">•</span>
          <span>Engineered Precision</span> <span className="text-[#d4af37]">•</span>
          <span>Aesthetic Dominance</span> <span className="text-[#d4af37]">•</span>
          <span>Urban Utility</span> <span className="text-[#d4af37]">•</span>
        </motion.div>
      </section>

      {/* Featured Products */}
      <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-end mb-20 border-b border-white/10 pb-8">
          <div>
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">New Arrivals</h2>
            <p className="text-[#d4af37] text-xs font-bold uppercase tracking-widest mt-4">Curated selection</p>
          </div>
          <Link href="/preview/growth/nexus-pro/products" className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:text-[#d4af37] transition-colors">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {featuredProducts.map((product, index) => (
            <motion.div 
              key={product.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className="group cursor-pointer flex flex-col"
            >
              <Link href={`/preview/growth/nexus-pro/products/${product.id}`} className="block relative">
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg mb-6 bg-white/5">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="absolute inset-0 w-full h-full object-cover transition-all duration-[1.5s] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-110 group-hover:-rotate-1"
                  />
                  
                  {/* Dark Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-700 backdrop-blur-[2px]" />

                  {/* Add to Cart Button */}
                  <div className="absolute inset-x-0 bottom-0 p-6 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] flex justify-center">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addToCart(product);
                        setIsCartOpen(true);
                      }}
                      className="relative overflow-hidden group/btn px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-full w-full shadow-2xl"
                    >
                      <span className="absolute inset-0 w-full h-full bg-[#d4af37] translate-y-[100%] group-hover/btn:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]" />
                      <span className="relative z-10 block transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover/btn:-translate-y-[200%]">
                        Add To Cart
                      </span>
                      <span className="absolute inset-0 z-10 flex items-center justify-center text-white transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] translate-y-[200%] group-hover/btn:translate-y-0">
                        Add To Cart
                      </span>
                    </button>
                  </div>

                  {product.isNew && (
                    <div className="absolute top-4 left-4 bg-[#d4af37] text-black text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full z-10">
                      New
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-start">
                  <div className="transition-transform duration-500 ease-out group-hover:translate-x-2">
                    <h3 className="text-xl font-bold mb-1 transition-colors duration-500 group-hover:text-[#d4af37]">{product.name}</h3>
                    <p className="text-sm text-white/50 transition-colors duration-500 group-hover:text-white/80">{product.category}</p>
                  </div>
                  <div className="text-right transition-transform duration-500 ease-out group-hover:-translate-x-2">
                    <p className="text-lg font-bold">${product.price.toFixed(2)}</p>
                    <div className="flex items-center justify-end gap-1 mt-1 text-[#d4af37]">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-xs font-bold text-white">{product.rating}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Feature Split Section */}
      <section className="py-32 border-t border-white/10 w-full">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] mb-8">
              Redefining <br/> <span className="text-[#d4af37]">Boundaries.</span>
            </h2>
            <p className="text-lg text-white/60 mb-10 max-w-md leading-relaxed">
              We construct garments utilizing avant-garde materials that challenge the status quo. 
              Our designs are driven by uncompromising utility and striking minimalism.
            </p>
            
            <ul className="space-y-6 mb-12">
              {[
                "Advanced Weatherproof Fabrics",
                "Ergonomic Articulation",
                "Sustainable Production Methods"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest border-b border-white/10 pb-4">
                  <span className="text-[#d4af37]">0{i + 1}</span>
                  {item}
                </li>
              ))}
            </ul>

            <Link href="/preview/growth/nexus-pro/about" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:text-[#d4af37] transition-colors pb-1 border-b border-transparent hover:border-[#d4af37]">
              Read Our Story <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="relative aspect-square lg:aspect-[4/5] rounded-xl overflow-hidden group"
          >
            <img 
              src="https://images.unsplash.com/photo-1550684376-efcbd6e3f031?q=80&w=2000&auto=format&fit=crop" 
              alt="Brand Story"
              className="w-full h-full object-cover grayscale transition-transform duration-1000 group-hover:scale-105 group-hover:grayscale-0"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-700" />
          </motion.div>
        </div>
      </section>

    </div>
  );
}
