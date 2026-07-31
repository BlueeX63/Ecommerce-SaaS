"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function NexusProAboutPage() {
  return (
    <div className="flex flex-col w-full bg-[#0a0a0a] text-[#ededed] pt-32 pb-32">
      
      {/* Header */}
      <section className="px-6 md:px-12 max-w-7xl mx-auto w-full mb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="text-[#d4af37] text-xs font-bold uppercase tracking-[0.3em] mb-6 block">
            Our Story
          </span>
          <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9] mb-8 max-w-4xl">
            Designing the Future of Essentials.
          </h1>
        </motion.div>
      </section>

      {/* Image Banner */}
      <section className="w-full h-[60vh] overflow-hidden mb-24 relative">
        <motion.div
          initial={{ scale: 1.1 }}
          whileInView={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          viewport={{ once: true }}
          className="w-full h-full"
        >
          <img 
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2000&auto=format&fit=crop" 
            alt="Studio"
            className="w-full h-full object-cover grayscale opacity-60"
          />
        </motion.div>
      </section>

      {/* Content */}
      <section className="px-6 md:px-12 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-16">
        <div className="col-span-1 md:col-span-4">
          <div className="sticky top-32">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-8">
              The Vision
            </h2>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="w-full aspect-square md:aspect-[4/5] rounded-xl overflow-hidden bg-white/5"
            >
              <img 
                src="https://images.unsplash.com/photo-1608063615781-e2ef8c73d114?q=80&w=2000&auto=format&fit=crop" 
                alt="Vision Detail" 
                className="w-full h-full object-cover grayscale opacity-80" 
              />
            </motion.div>
          </div>
        </div>
        <div className="col-span-1 md:col-span-8 space-y-12 text-lg text-white/70 leading-relaxed font-light">
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-8 opacity-0 hidden md:block pointer-events-none" aria-hidden="true">
            The Vision
          </h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            Nexus Pro was born from a singular obsession: to eliminate the unnecessary and elevate the essential. We observed a landscape cluttered with over-designed products that lacked fundamental utility. Our response was a return to first principles.
          </motion.p>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Every piece in our collection is rigorously engineered. We source advanced materials from state-of-the-art mills, prioritize ergonomic articulation, and apply a brutalist aesthetic that favors raw function over superficial ornamentation.
          </motion.p>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            This isn't just clothing or accessories; it's industrial design applied to the body. It is hardware for the human form.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.6 }}
            className="pt-12 border-t border-white/10"
          >
            <Link 
              href="/preview/growth/nexus-pro/products"
              className="inline-flex items-center gap-4 text-white hover:text-[#d4af37] text-sm font-bold uppercase tracking-widest transition-colors"
            >
              Explore The Collection <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
