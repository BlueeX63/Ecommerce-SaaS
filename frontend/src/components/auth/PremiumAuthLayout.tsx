"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function PremiumAuthLayout({
  children,
  title,
  subtitle,
  backLink,
  visualUrl
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  backLink: string;
  visualUrl: string;
}) {
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#050505] font-body text-white selection:bg-white selection:text-black">
      
      {/* Left Visual Area (Cinematic Image/Texture) */}
      <div className="hidden md:flex w-1/2 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 z-0">
          <motion.img 
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.6 }}
            transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
            src={visualUrl} 
            alt="Cinematic Brand Background" 
            className="w-full h-full object-cover mix-blend-screen grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/50" />
        </div>
        
        {/* Giant Typographical Mask */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full"
        >
          <p className="font-accent tracking-[0.4em] text-xs uppercase text-white/50 mb-4 font-bold">Authentication</p>
          <h1 className="font-heading text-[80px] lg:text-[120px] leading-[0.85] tracking-tighter uppercase text-white drop-shadow-2xl">
            Enter <br /> <span className="text-white/40 italic font-light">The</span> <br /> Store.
          </h1>
        </motion.div>
      </div>

      {/* Right Form Area */}
      <div className="w-full md:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-32 py-16 bg-[#F8F7F5] text-[#111111] relative">
        <Link 
          href={backLink} 
          className="absolute top-8 left-8 md:top-12 md:left-12 flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase font-accent hover:text-black/50 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md mx-auto"
        >
          <h2 className="font-heading text-4xl md:text-5xl tracking-tighter uppercase mb-4 text-[#111111]">{title}</h2>
          <p className="font-medium text-[#111111]/50 mb-12 text-sm leading-relaxed">{subtitle}</p>
          
          {children}

        </motion.div>
      </div>
    </div>
  );
}
