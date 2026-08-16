"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import Link from "next/link";
import { MoveRight } from "lucide-react";
import { useCustomization } from "@/hooks/useCustomization";

export default function HorizonAbout() {
  const customData = useCustomization();
  
  const tTitle = customData?.formData?.aboutTitle || "We believe that aesthetic excellence is not a luxury, but a fundamental requirement for the modern digital experience.";
  const tContent1 = customData?.formData?.aboutText1 || "Uncompromising Quality.";
  const tContent2 = customData?.formData?.aboutText2 || "Horizon was founded on a singular principle: digital assets should be crafted with the same meticulous attention to detail as physical luxury goods. We reject the generic, the templated, and the uninspired.";
  const tContent3 = customData?.formData?.aboutText3 || "Every UI kit, typography pairing, and motion asset in our archive is designed to elevate your brand from merely functional to profoundly memorable. We exist for the creators who push boundaries.";
  const tImage = customData?.formData?.aboutHeroImage || "https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?q=80&w=2000&auto=format&fit=crop";
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ 
    target: containerRef,
    offset: ["start start", "end end"]
  });
  
  // Use spring for much smoother parallax and to eliminate glitches
  const smoothProgress = useSpring(scrollYProgress, { damping: 30, stiffness: 100, mass: 0.5 });
  const yImage = useTransform(smoothProgress, [0, 1], ["0%", "30%"]);
  
  return (
    <div ref={containerRef} className="bg-[#FAFAFA] min-h-screen text-[#111] pt-40 pb-32 relative overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="mb-32 text-center flex flex-col items-center"
        >
          <span className="font-outfit text-[10px] uppercase tracking-[0.4em] text-black/40 mb-8 block font-medium">
            The Manifesto
          </span>
          <h1 className="font-cormorant text-5xl md:text-7xl font-light tracking-tight leading-[1.1] max-w-4xl text-[#111]">
            {tTitle}
          </h1>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-start mb-32">
          
          <div className="relative aspect-[3/4] overflow-hidden bg-[#F5F5F5]">
            <motion.img 
              style={{ y: yImage, scale: 1.15 }}
              src={tImage} 
              alt="Studio Abstract"
              className="w-full h-full object-cover opacity-90 filter brightness-[0.9]"
            />
          </div>
          
          <div className="pt-12 md:pt-48">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="font-cormorant text-3xl md:text-5xl font-light text-[#111] mb-12 leading-snug">
                {tContent1}
              </h2>
              <p className="font-outfit text-sm font-light leading-loose text-black/60 mb-12">
                {tContent2}
              </p>
              <p className="font-outfit text-sm font-light leading-loose text-black/60 mb-12">
                {tContent3}
              </p>
              
              <Link href="/templates/horizon/products" className="group inline-flex items-center gap-4 pointer-events-auto" style={{ cursor: "none" }}>
                <span className="font-outfit text-xs uppercase tracking-[0.2em] text-black group-hover:text-black/60 font-medium transition-colors duration-500 pb-1 border-b border-black group-hover:border-black/20">
                  Explore The Collection
                </span>
                <MoveRight className="w-4 h-4 text-black group-hover:text-black/60 transition-all group-hover:translate-x-2" strokeWidth={1.5} />
              </Link>
            </motion.div>
          </div>
        </div>

      </div>
    </div>
  );
}
