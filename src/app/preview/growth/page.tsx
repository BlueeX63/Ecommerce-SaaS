"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ShoppingBag, Search, Menu, ArrowUpRight } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import Lenis from "lenis";

export default function GrowthTemplatePreview() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // Initialize Lenis for smooth scrolling inside the template
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  return (
    <div className="bg-[#FAF9F6] font-body text-[#2C3E35] min-h-screen selection:bg-[#E87A5D] selection:text-white">
      
      {/* Navigation (Floating) */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-6 left-6 right-6 z-50 flex items-center justify-between"
      >
        <Link href="#" className="font-heading text-3xl tracking-tight text-[#2C3E35] mix-blend-difference hover:opacity-70 transition-opacity">
          AURA
        </Link>

        <div className="flex items-center gap-4">
          <button className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center border border-black/5 hover:scale-105 transition-transform shadow-sm">
            <Search className="w-5 h-5" />
          </button>
          <button className="w-12 h-12 rounded-full bg-[#E87A5D] text-white flex items-center justify-center hover:scale-105 transition-transform shadow-[0_8px_24px_rgba(232,122,93,0.3)] relative">
            <ShoppingBag className="w-5 h-5" />
            <div className="absolute top-0 right-0 w-3 h-3 bg-[#2C3E35] rounded-full border-2 border-[#E87A5D]" />
          </button>
          <button className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center border border-black/5 hover:scale-105 transition-transform shadow-sm md:hidden">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </motion.header>

      {/* Hero Section with Parallax */}
      <section ref={containerRef} className="h-screen relative overflow-hidden flex items-center justify-center px-6">
        <motion.div style={{ y, opacity }} className="text-center z-10 mt-20 max-w-4xl">
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-[#E87A5D] font-accent uppercase tracking-widest text-sm font-bold mb-6"
          >
            Spring / Summer 2026
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="font-heading text-6xl md:text-[100px] leading-[0.9] tracking-tight mb-8"
          >
            Radiate <br className="hidden md:block"/>
            <span className="italic font-light">Natural Beauty.</span>
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            <Link 
              href="#"
              className="inline-flex items-center gap-3 bg-[#2C3E35] text-white px-8 py-4 rounded-full font-accent font-medium tracking-wide hover:bg-[#1A2620] hover:scale-105 transition-all shadow-[0_8px_32px_rgba(44,62,53,0.2)]"
            >
              Explore Collection <ArrowUpRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Abstract Background Shapes */}
        <div className="absolute inset-0 pointer-events-none -z-10">
          <div className="absolute top-[-10%] right-[-5%] w-[60vh] h-[60vh] bg-[#E87A5D]/10 rounded-full blur-3xl mix-blend-multiply" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[80vh] h-[80vh] bg-[#2C3E35]/5 rounded-full blur-3xl mix-blend-multiply" />
        </div>
      </section>

      {/* Featured Products (Staggered Grid) */}
      <section className="py-32 px-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20">
            <h2 className="font-heading text-5xl md:text-6xl max-w-lg leading-tight">
              Curated for your daily ritual.
            </h2>
            <Link href="#" className="group flex items-center gap-2 font-accent uppercase tracking-widest text-sm font-bold text-[#E87A5D] mt-6 md:mt-0">
              Shop All <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: "Botanical Serum", price: "$68.00", color: "bg-[#F3E8E0]", delay: 0 },
              { name: "Mineral Clay Mask", price: "$42.00", color: "bg-[#E6E8E3]", delay: 0.1 },
              { name: "Hydrating Mist", price: "$34.00", color: "bg-[#F5E6E8]", delay: 0.2 },
            ].map((product, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: product.delay, ease: [0.16, 1, 0.3, 1] }}
                className="group cursor-pointer"
              >
                <div className={`${product.color} aspect-[3/4] rounded-3xl mb-6 relative overflow-hidden`}>
                  {/* Image Placeholder */}
                  <div className="absolute inset-0 flex items-center justify-center font-heading text-2xl text-black/10 mix-blend-multiply group-hover:scale-105 transition-transform duration-700 ease-[0.16,1,0.3,1]">
                    Image {i+1}
                  </div>
                  {/* Quick Add Button */}
                  <div className="absolute bottom-6 left-6 right-6 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    <button className="w-full bg-white/90 backdrop-blur-sm text-[#2C3E35] py-4 rounded-xl font-accent font-bold text-sm tracking-wide shadow-lg hover:bg-white">
                      Quick Add
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-start px-2">
                  <div>
                    <h3 className="font-heading text-2xl mb-1">{product.name}</h3>
                    <p className="font-body text-sm text-[#2C3E35]/60">100ml / 3.4oz</p>
                  </div>
                  <p className="font-accent font-bold">{product.price}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Marquee Banner */}
      <div className="w-full overflow-hidden bg-[#2C3E35] text-[#FAF9F6] py-6 flex whitespace-nowrap">
        <motion.div 
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, ease: "linear", duration: 15 }}
          className="flex font-heading text-3xl md:text-5xl uppercase tracking-wider"
        >
          {Array(8).fill("100% ORGANIC • CRUELTY FREE • VEGAN • ").map((text, i) => (
            <span key={i} className="mx-4">{text}</span>
          ))}
        </motion.div>
      </div>
      
    </div>
  );
}
