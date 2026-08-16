"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { useCustomization } from "@/hooks/useCustomization";

export default function CanvasAboutPage() {
  const customData = useCustomization();
  
  const tTitle = customData?.formData?.aboutTitle || "The Shape \nOf Things.";
  const tContent1 = customData?.formData?.aboutText1 || "Canvas is an independent design house focused on creating objects of uncompromising quality. We believe that true luxury lies in restraint and negative space.";
  const tContent2 = customData?.formData?.aboutText2 || "Second text block.";
  const tContent3 = customData?.formData?.aboutText3 || "Third text block.";
  const tImage = customData?.formData?.aboutHeroImage || "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2000&auto=format&fit=crop";
  const tFeature1Title = customData?.formData?.feature1Title || "The Gallery";
  const tFeature1Desc = customData?.formData?.aboutText2 || "Our flagship space was conceived as a brutalist sanctuary in the heart of the city. A place where objects can breathe and be appreciated for their intrinsic forms.";
  const tFeature2Title = customData?.formData?.feature2Title || "The Collection";
  const tFeature2Desc = customData?.formData?.aboutText3 || "We curate pieces from independent designers globally. Each object must meet our strict criteria: uncompromising quality, bold geometry, and absolute permanence.";
  
  return (
    <div className="flex flex-col w-full bg-black text-white min-h-screen">

      {/* Intro */}
      <section className="px-6 md:px-12 w-full pt-32 pb-24 border-b border-white/20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl"
        >
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-12">
            [ Maison ]
          </div>
          <h1 className="font-serif text-5xl md:text-8xl lg:text-[100px] tracking-tighter uppercase leading-[0.8] mb-12">
            {tTitle.split('\\n').map((line: string, i: number) => (
              <span key={i}>{line}<br/></span>
            ))}
          </h1>
          <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] leading-loose text-white/70 max-w-xl">
            {tContent1}
          </p>
        </motion.div>
      </section>

      {/* Editorial Content */}
      <section className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 border-b border-white/20">
          
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, delay: 0.2 }}
            className="aspect-square md:aspect-auto h-full border-b md:border-b-0 md:border-r border-white/20 overflow-hidden relative"
          >
            <img 
              src={tImage}
              alt="Studio" 
              className="absolute inset-0 w-full h-full object-cover grayscale opacity-80"
            />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="p-12 md:p-24 flex flex-col justify-center"
          >
            <h2 className="font-serif text-3xl md:text-5xl uppercase tracking-tighter mb-8">{tFeature1Title}</h2>
            <div className="w-[1px] h-12 bg-white/30 mb-8"></div>
            <p className="text-[10px] uppercase tracking-[0.2em] leading-loose text-white/60 mb-8">
              {tContent2}
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] leading-loose text-white/60">
              {tContent3}
            </p>
          </motion.div>
          
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="py-32 px-6 flex justify-center text-center">
        <Link 
          href="/templates/canvas/products"
          className="group inline-flex flex-col items-center gap-8"
        >
          <span className="font-serif text-4xl md:text-6xl uppercase tracking-tighter group-hover:italic transition-all duration-500">
            View The Archive
          </span>
          <ArrowRight className="w-8 h-8 group-hover:translate-y-2 transition-transform duration-500" />
        </Link>
      </section>

    </div>
  );
}
