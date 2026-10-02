"use client";

import { motion } from "framer-motion";

export default function NexusProPrivacyPage() {
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
            Privacy Policy.
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
            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-widest">1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us. For example, we collect information when you create an account, participate in any interactive features of our services, fill out a form, request customer support or otherwise communicate with us.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-widest">2. Use of Information</h2>
            <p>
              We use the information we collect to provide, maintain, and improve our services, such as to administer your account, process your transactions, and send you related information, including confirmations and receipts.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-widest">3. Sharing of Information</h2>
            <p>
              We may share information about you as follows or as otherwise described in this Privacy Policy: With vendors, consultants and other service providers who need access to such information to carry out work on our behalf.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-widest">4. Security</h2>
            <p>
              We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.
            </p>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
