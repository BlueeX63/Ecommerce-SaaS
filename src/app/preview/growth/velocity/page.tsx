"use client";

import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Zap, Target, Crosshair } from "lucide-react";
import { useRef, useState } from "react";
import { VELOCITY_PRODUCTS } from "./VelocityContext";

// Crazy 3D Card component
function ProductCard3D({ product }: { product: any }) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateXValue = ((y - centerY) / centerY) * -15;
    const rotateYValue = ((x - centerX) / centerX) * 15;
    
    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <Link href={`/preview/growth/velocity/products/${product.id}`} className="block perspective-1000">
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={{ rotateX, rotateY }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative aspect-[3/4] rounded-sm border border-[#00f0ff]/20 bg-[#050505] overflow-visible group"
      >
        <div 
          className="absolute inset-0 bg-[#00f0ff] opacity-0 group-hover:opacity-10 transition-opacity duration-300 blur-xl"
          style={{ transform: "translateZ(-20px)" }}
        />
        
        <div className="absolute inset-0 overflow-hidden" style={{ transform: "translateZ(0px)" }}>
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 mix-blend-lighten"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent opacity-90" />
        </div>

        <div 
          className="absolute bottom-6 left-6 right-6"
          style={{ transform: "translateZ(30px)" }}
        >
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[#00f0ff] text-[9px] font-bold uppercase tracking-[0.3em] mb-2 font-mono">{product.category}</p>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-tight font-orbitron">{product.name}</h3>
            </div>
          </div>
        </div>

        <div 
          className="absolute top-6 right-6"
          style={{ transform: "translateZ(40px)" }}
        >
          <span className="text-[#ff003c] font-black text-lg font-orbitron">${product.price}</span>
        </div>

        {product.isNew && (
          <div 
            className="absolute -top-3 -left-3 bg-[#00f0ff] text-black text-[10px] font-black uppercase tracking-widest px-4 py-2 shadow-[0_0_15px_rgba(0,240,255,0.5)]"
            style={{ transform: "translateZ(50px)" }}
          >
            V.2 Activated
          </div>
        )}
      </motion.div>
    </Link>
  );
}

export default function VelocityHomePage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  
  // Crazy spring physics for scroll
  const smoothProgress = useSpring(scrollYProgress, { damping: 15, mass: 0.27, stiffness: 55 });
  const scale = useTransform(smoothProgress, [0, 1], [1, 1.2]);
  const yOffset = useTransform(smoothProgress, [0, 1], ["0%", "20%"]);

  return (
    <div className="flex flex-col w-full bg-[#050505] overflow-x-hidden" ref={containerRef}>
      
      {/* Glitch Hero */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        <motion.div style={{ scale, y: yOffset }} className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2000&auto=format&fit=crop" 
            alt="Cyberpunk City" 
            className="w-full h-full object-cover opacity-30"
          />
          {/* Cyberpunk grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [transform:perspective(500px)_rotateX(60deg)_translateY(-100px)_translateZ(200px)]" />
        </motion.div>

        <div className="relative z-10 text-center flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="relative"
          >
            <h1 className="text-7xl md:text-[10rem] font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] via-white to-[#ff003c] font-orbitron drop-shadow-[0_0_30px_rgba(0,240,255,0.3)]">
              Velocity
            </h1>
            {/* Glitch layers */}
            <h1 className="absolute inset-0 text-7xl md:text-[10rem] font-black uppercase tracking-tighter text-[#00f0ff] font-orbitron opacity-50 mix-blend-screen translate-x-1 animate-pulse">
              Velocity
            </h1>
            <h1 className="absolute inset-0 text-7xl md:text-[10rem] font-black uppercase tracking-tighter text-[#ff003c] font-orbitron opacity-50 mix-blend-screen -translate-x-1 animate-pulse" style={{ animationDelay: '100ms' }}>
              Velocity
            </h1>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-white/70 uppercase tracking-[0.5em] text-xs md:text-sm mt-6 mb-12 font-space"
          >
            System // Override // Active
          </motion.p>

          <Link href="/preview/growth/velocity/products">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative overflow-hidden group border border-[#00f0ff] bg-[#050505]/50 backdrop-blur-sm px-10 py-5 flex items-center gap-4"
            >
              <span className="absolute inset-0 bg-[#00f0ff] translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-out skew-x-12 scale-150" />
              <span className="relative z-10 font-black uppercase tracking-[0.2em] text-xs text-[#00f0ff] group-hover:text-black transition-colors duration-500 font-orbitron">
                Initialize Sequence
              </span>
              <Target className="relative z-10 w-4 h-4 text-[#ff003c] group-hover:text-black transition-colors duration-500" />
            </motion.button>
          </Link>
        </div>
      </section>

      {/* Marquee High Speed */}
      <section className="py-6 border-y border-[#00f0ff]/20 bg-[#00f0ff]/5 overflow-hidden flex items-center">
        <motion.div 
          animate={{ x: [0, -2000] }}
          transition={{ repeat: Infinity, ease: "linear", duration: 15 }}
          className="flex gap-12 text-2xl font-black uppercase tracking-[0.2em] text-white/50 font-orbitron whitespace-nowrap"
        >
          {Array(8).fill(null).map((_, i) => (
            <span key={i} className="flex items-center gap-12">
              <span>Cybernetic Enhance</span> 
              <Crosshair className="text-[#ff003c] w-6 h-6" />
              <span>Neo-Tokyo Aesthetics</span>
              <Zap className="text-[#00f0ff] w-6 h-6" />
            </span>
          ))}
        </motion.div>
      </section>

      {/* Arsenal (Featured) */}
      <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto w-full relative">
        <div className="absolute top-0 right-12 w-64 h-64 bg-[#ff003c]/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-20 gap-6 border-b border-[#00f0ff]/20 pb-8 relative z-10">
          <div>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter font-orbitron text-white">
              The Arsenal
            </h2>
            <p className="text-[#00f0ff] text-xs font-bold uppercase tracking-[0.3em] mt-4 font-space">
              Latest Deployments
            </p>
          </div>
          <Link href="/preview/growth/velocity/products" className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:text-[#00f0ff] transition-colors">
            <span className="relative">
              Access Full Grid
              <span className="absolute -bottom-1 left-0 w-full h-[1px] bg-[#00f0ff] scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          {VELOCITY_PRODUCTS.slice(0, 3).map((product) => (
            <ProductCard3D key={product.id} product={product} />
          ))}
        </div>
      </section>

    </div>
  );
}
