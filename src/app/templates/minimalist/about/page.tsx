"use client";

import { motion } from "framer-motion";

import { useCustomization } from "@/hooks/useCustomization";

export default function StarterAboutPage() {
  const customData = useCustomization();

  const tTitle = customData?.formData?.aboutTitle || "Our Story";
  const tContent = customData?.formData?.aboutText1 || "Founded on the principle that less is more, we create everyday essentials that strip away the excess to focus on what truly matters: quality, fit, and timeless design.";
  const tImage = customData?.formData?.aboutHeroImage || "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2000&auto=format&fit=crop";
  const tFeature1Title = customData?.formData?.feature1Title || "Uncompromising Quality";
  const tFeature1Desc = customData?.formData?.aboutText2 || "We partner with the world's most ethical factories to source premium materials. Every stitch is considered, every seam is tested. We don't believe in planned obsolescence.";
  const tFeature2Title = customData?.formData?.feature2Title || "Radical Transparency";
  const tFeature2Desc = customData?.formData?.aboutText3 || "We believe you have the right to know what your clothes cost to make. We reveal the true costs behind all of our products—from materials to labor to transportation.";

  return (
    <div className="px-6 py-24 md:py-32 max-w-4xl mx-auto w-full flex flex-col gap-24">
      <section className="text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="font-heading text-5xl md:text-7xl tracking-tighter text-[#111111] mb-8"
        >
          {tTitle}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg md:text-xl text-black/60 leading-relaxed font-medium"
        >
          {tContent}
        </motion.p>
      </section>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="w-full aspect-video bg-[#F8F7F5] relative overflow-hidden rounded-sm"
      >
        <img 
          src={tImage}
          alt="Our workshop"
          className="absolute inset-0 w-full h-full object-cover mix-blend-multiply"
        />
      </motion.div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="font-heading text-3xl tracking-tighter text-[#111111] mb-4">{tFeature1Title}</h2>
          <p className="text-black/60 leading-relaxed">
            {tFeature1Desc}
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="font-heading text-3xl tracking-tighter text-[#111111] mb-4">{tFeature2Title}</h2>
          <p className="text-black/60 leading-relaxed">
            {tFeature2Desc}
          </p>
        </motion.div>
      </section>
    </div>
  );
}
