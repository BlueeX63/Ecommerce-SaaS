"use client";

import { motion } from "framer-motion";

export default function NexusProContactPage() {
  return (
    <div className="flex flex-col w-full bg-[#0a0a0a] text-[#ededed] pt-32 pb-32">
      
      <section className="px-6 md:px-12 max-w-7xl mx-auto w-full mb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="text-[#d4af37] text-xs font-bold uppercase tracking-[0.3em] mb-6 block">
            Support
          </span>
          <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9] mb-8">
            Contact Us.
          </h1>
        </motion.div>
      </section>

      <section className="px-6 md:px-12 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
        
        {/* Form */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <form className="flex flex-col gap-8">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex flex-col gap-2 flex-1">
                <label className="text-xs font-bold uppercase tracking-widest text-white/50">First Name</label>
                <input 
                  type="text" 
                  className="bg-transparent border-b border-white/20 py-4 focus:outline-none focus:border-[#d4af37] transition-colors text-white"
                  placeholder="John"
                />
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <label className="text-xs font-bold uppercase tracking-widest text-white/50">Last Name</label>
                <input 
                  type="text" 
                  className="bg-transparent border-b border-white/20 py-4 focus:outline-none focus:border-[#d4af37] transition-colors text-white"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/50">Email Address</label>
              <input 
                type="email" 
                className="bg-transparent border-b border-white/20 py-4 focus:outline-none focus:border-[#d4af37] transition-colors text-white"
                placeholder="john@example.com"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/50">Message</label>
              <textarea 
                rows={5}
                className="bg-transparent border-b border-white/20 py-4 focus:outline-none focus:border-[#d4af37] transition-colors text-white resize-none"
                placeholder="How can we help you?"
              />
            </div>

            <button 
              type="button"
              className="mt-4 self-start px-12 py-4 bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-[#d4af37] hover:text-white transition-colors duration-300 rounded-full"
            >
              Send Message
            </button>
          </form>
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-white/5 p-8 lg:p-12 rounded-2xl flex flex-col justify-between lg:h-[calc(100%-86px)] overflow-y-auto"
        >
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-6">Headquarters</h3>
            <div className="flex flex-col gap-6 text-sm text-white/70">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#d4af37] mb-1">Location</p>
                <p>123 Innovation Drive, Silicon Valley, CA 94025</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#d4af37] mb-1">Email</p>
                  <p>support@nexuspro.com</p>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#d4af37] mb-1">Phone</p>
                  <p>+1 (800) 555-0199</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-xs text-white/50 leading-relaxed">
              Our customer service team is available Monday through Friday, from 9 AM to 6 PM PST. We aim to respond to all inquiries within 24 hours.
            </p>
          </div>
        </motion.div>

      </section>
    </div>
  );
}
