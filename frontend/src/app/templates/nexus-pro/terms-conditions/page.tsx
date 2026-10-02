"use client";

import { motion } from "framer-motion";

export default function NexusProTermsPage() {
  return (
    <div className="flex flex-col w-full bg-[#0a0a0a] text-[#ededed] pt-32 pb-32">
      <section className="px-6 md:px-12 max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <span className="text-[#d4af37] text-xs font-bold uppercase tracking-[0.3em] mb-6 block">
            Legal
          </span>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] mb-8">
            Terms & Conditions.
          </h1>
          <p className="text-white/50 text-sm uppercase tracking-widest">Last Updated: October 2023</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-12 text-white/70 leading-relaxed font-light"
        >
          <div>
            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-widest">1. Agreement to Terms</h2>
            <p>
              By accessing our website, you agree to be bound by these Terms and Conditions and agree that you are responsible for the agreement with any applicable local laws.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-widest">2. Use License</h2>
            <p>
              Permission is granted to temporarily download one copy of the materials on Nexus Pro's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-widest">3. Disclaimer</h2>
            <p>
              All the materials on Nexus Pro's website are provided "as is". Nexus Pro makes no warranties, may it be expressed or implied, therefore negates all other warranties. Furthermore, Nexus Pro does not make any representations concerning the accuracy or reliability of the use of the materials on its website.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-widest">4. Revisions and Errata</h2>
            <p>
              The materials appearing on Nexus Pro's website may include technical, typographical, or photographic errors. Nexus Pro will not promise that any of the materials in this website are accurate, complete, or current.
            </p>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
