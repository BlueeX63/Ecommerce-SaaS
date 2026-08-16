"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useCustomization } from "@/hooks/useCustomization";

export default function QuantumAboutPage() {
  const customData = useCustomization();
  
  const tTitle = customData?.formData?.aboutTitle || "Beyond Form. \nBeyond Function.";
  const tContent1 = customData?.formData?.aboutText1 || "Quantum was founded on a singular premise: that the objects we interact with every day should not merely serve a purpose, but should elevate our consciousness.";
  const tContent2 = customData?.formData?.aboutText2 || "We collaborate with visionary designers and avant-garde artists to blur the lines between conceptual art and functional homeware. Every artifact in our collection is a testament to what happens when imagination is unconstrained by traditional manufacturing limitations.";
  const tContent3 = customData?.formData?.aboutText3 || "We don't sell furniture. We curate experiences.";
  const tImage = customData?.formData?.aboutHeroImage || "https://images.unsplash.com/photo-1574958269340-fa927503f3dd?q=80&w=2000&auto=format&fit=crop";
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });
  const yImage = useTransform(scrollYProgress, [0, 1], [-100, 100]);
  const rotateImage = useTransform(scrollYProgress, [0, 1], [-5, 5]);

  return (
    <div className="min-h-screen bg-[#F9F9FB] pt-32 pb-24 overflow-hidden" ref={containerRef}>
      <div className="max-w-[1600px] mx-auto px-6 md:px-12">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="w-full lg:w-1/2">
            <motion.h1 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="font-playfair text-5xl md:text-7xl font-bold text-[#121212] mb-8 leading-tight"
            >
              {tTitle.split('\\n').map((line: string, i: number) => (
                <span key={i} className={i === 1 ? "text-[#111111] italic" : ""}>{line}{i === 0 && <br/>}</span>
              ))}
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="space-y-6 font-inter text-gray-600 text-lg leading-relaxed"
            >
              <p>
                {tContent1}
              </p>
              <p>
                {tContent2}
              </p>
              <p>
                {tContent3}
              </p>
            </motion.div>
          </div>

          <div className="w-full lg:w-1/2 relative h-[600px] rounded-[3rem] overflow-hidden bg-gray-100 flex items-center justify-center">
            {/* Blurred glow behind image */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#111111]/30 to-gray-800/30 mix-blend-overlay z-10" />
            <motion.img 
              style={{ y: yImage, rotate: rotateImage, scale: 1.2 }}
              src={tImage} 
              alt="Studio"
              className="w-full h-full object-cover relative z-0"
            />
          </div>
        </div>

        <div className="mt-32 border-t border-gray-200 pt-16">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-12"
          >
            <div>
              <h3 className="font-playfair text-2xl font-bold mb-4 text-[#121212]">Material Innovation</h3>
              <p className="font-inter text-gray-500">We pioneer the use of metamaterials, aerogels, and self-healing polymers to create textures never before felt in the home.</p>
            </div>
            <div>
              <h3 className="font-playfair text-2xl font-bold mb-4 text-[#121212]">Spatial Harmony</h3>
              <p className="font-inter text-gray-500">Each object is designed with acoustic and light-bending properties to actively improve the ambiance of your living space.</p>
            </div>
            <div>
              <h3 className="font-playfair text-2xl font-bold mb-4 text-[#121212]">Sustainable Future</h3>
              <p className="font-inter text-gray-500">True luxury is permanence. Our artifacts are designed to outlast generations, with a zero-waste production philosophy.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
