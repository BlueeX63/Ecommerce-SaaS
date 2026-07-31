"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function EssenceAboutPage() {
  return (
    <div className="w-full bg-[#F3EDE2] min-h-screen pt-12 pb-32">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="mb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#A69684] mb-6"
          >
            Our Story
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-serif text-4xl md:text-6xl lg:text-7xl text-[#4A3F35] leading-tight max-w-4xl mx-auto"
          >
            Simplicity is the ultimate sophistication.
          </motion.h1>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-center mb-32">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="aspect-[4/5] bg-[#E3D8C8] overflow-hidden"
          >
            <img 
              src="https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?q=80&w=2940&auto=format&fit=crop" 
              alt="About Us"
              className="w-full h-full object-cover"
            />
          </motion.div>
          <div className="flex flex-col gap-8 text-[#4A3F35]/80 text-sm md:text-base leading-relaxed">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
            >
              Founded in 2026, Essence was born out of a desire to create spaces that evoke calm and clarity. We believe that the objects we surround ourselves with have a profound impact on our well-being.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              Our design philosophy is rooted in minimalism, not as an aesthetic, but as a way of life. By stripping away the non-essential, we make room for what truly matters.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Every piece in our collection is carefully curated or crafted by master artisans using ethically sourced, natural materials. Our products are designed to age gracefully, bearing the patina of a life well-lived.
            </motion.p>
          </div>
        </div>

        {/* CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center py-20 border-t border-[#4A3F35]/10"
        >
          <h2 className="font-serif text-3xl md:text-4xl text-[#4A3F35] mb-8">Bring Essence into your home.</h2>
          <Link 
            href="/preview/starter/essence/products" 
            className="inline-flex items-center gap-4 text-[#4A3F35] hover:text-[#A69684] transition-colors group"
          >
            <span className="text-xs uppercase tracking-[0.2em] font-bold border-b border-[#4A3F35] group-hover:border-[#A69684] pb-1">Explore Collection</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
