"use client";

import React, { useState } from 'react';
import { Outfit, Syne } from 'next/font/google';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

const outfit = Outfit({ subsets: ['latin'] });
const syne = Syne({ subsets: ['latin'] });

export default function BentoContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', message: '' });
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-[#f0f0f0] p-4 pt-28 md:p-6 md:pt-32 lg:p-8 lg:pt-32 flex flex-col lg:flex-row gap-4 md:gap-6 lg:gap-8 font-light text-[#050505]">
      
      {/* BOX 1: Left Vertical Branding (Dark) */}
      <motion.div 
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="w-full lg:w-[32%] lg:min-h-[calc(100vh-4rem)] bg-[#050505] text-white rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden group shadow-xl"
      >
        <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay bg-[url('https://upload.wikimedia.org/wikipedia/commons/7/76/1k_Dissolve_Noise_Texture.png')] bg-repeat pointer-events-none" />
        
        {/* Animated gradient blob */}
        <motion.div 
          animate={{ scale: [1, 1.3, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -right-[20%] w-[150%] h-[150%] bg-gradient-to-br from-white/10 to-transparent blur-[100px] rounded-full z-0 pointer-events-none"
        />

        <div className="relative z-10 flex justify-between items-start">
          <motion.div 
            whileHover={{ rotate: 45, scale: 1.1 }}
            className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center cursor-pointer bg-white/5 backdrop-blur-sm"
          >
            <ArrowUpRight className="w-6 h-6 text-white" />
          </motion.div>
          <span className={`text-[10px] uppercase tracking-[0.4em] font-bold text-white/40 ${syne.className} py-4`}>
            HQ / Paris
          </span>
        </div>

        <div className="relative z-10 mt-32 lg:mt-0">
          <h1 className={`text-6xl md:text-8xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-black uppercase leading-[0.8] tracking-tighter text-white whitespace-nowrap ${syne.className}`}>
            Get<br/>In<br/>Touch
          </h1>
          <p className={`mt-10 text-white/60 max-w-sm text-sm md:text-base leading-relaxed ${outfit.className}`}>
            For bespoke inquiries, press, and collaborative opportunities, our concierge is at your absolute disposal.
          </p>
        </div>
      </motion.div>

      {/* BOX 2: Center Column (The Form) */}
      <motion.div 
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="w-full lg:w-[43%] lg:min-h-[calc(100vh-4rem)] bg-white rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 lg:p-16 flex flex-col shadow-xl relative overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 flex flex-col items-center justify-center text-center py-20"
            >
              <div className="w-24 h-24 rounded-full bg-[#f2f2f2] flex items-center justify-center mb-10 relative">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="w-12 h-12 bg-[#050505] rounded-full"
                />
              </div>
              <h3 className={`text-3xl md:text-4xl font-bold uppercase tracking-tighter mb-4 ${syne.className}`}>
                Transmission<br/>Received
              </h3>
              <p className={`text-[#050505]/50 font-medium text-sm md:text-base leading-relaxed max-w-[250px] ${outfit.className}`}>
                Our concierge has received your message and will establish contact within 24 hours.
              </p>
            </motion.div>
          ) : (
            <motion.form 
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col justify-between"
              onSubmit={handleSubmit}
            >
              <div>
                <div className="flex items-center justify-between mb-16">
                  <h2 className={`text-2xl font-bold uppercase tracking-widest ${syne.className}`}>Direct Line</h2>
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_15px_#22c55e]" />
                </div>
                
                <div className="space-y-4">
                  {/* Form fields with sleek pill highlights */}
                  {['name', 'email', 'message'].map((field) => (
                    <div key={field} className="relative group">
                      {/* Hover/Focus Pill Background */}
                      <div className="absolute inset-0 bg-[#f7f7f7] rounded-3xl transition-all duration-500 scale-[0.98] opacity-0 group-focus-within:scale-100 group-focus-within:opacity-100 group-hover:scale-100 group-hover:opacity-100" />
                      
                      <div className="relative z-10 p-6 md:p-8 flex flex-col">
                        <label className={`text-[10px] uppercase tracking-[0.2em] font-bold text-[#050505]/30 mb-3 transition-colors duration-500 group-focus-within:text-[#050505] ${syne.className}`}>
                          {field}
                        </label>
                        {field === 'message' ? (
                          <textarea 
                            required
                            rows={3}
                            value={(formData as any)[field]}
                            onChange={e => setFormData({...formData, [field]: e.target.value})}
                            className={`w-full bg-transparent border-none outline-none resize-none text-xl md:text-2xl font-medium text-[#050505] placeholder:text-[#050505]/20 ${outfit.className}`}
                            placeholder="Type your transmission..."
                          />
                        ) : (
                          <input 
                            required
                            type={field === 'email' ? 'email' : 'text'}
                            value={(formData as any)[field]}
                            onChange={e => setFormData({...formData, [field]: e.target.value})}
                            className={`w-full bg-transparent border-none outline-none text-xl md:text-2xl font-medium text-[#050505] placeholder:text-[#050505]/20 ${outfit.className}`}
                            placeholder={`Enter your ${field}`}
                          />
                        )}
                      </div>
                      {/* Subtle separator line, disappears on focus */}
                      <div className="absolute bottom-0 left-8 right-8 h-[1px] bg-[#050505]/5 group-focus-within:bg-transparent transition-colors duration-500" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-16 flex justify-end">
                <button type="submit" className="relative group overflow-hidden rounded-full bg-[#050505] text-white p-2 pl-8 flex items-center gap-6 cursor-pointer">
                  <span className={`relative z-10 text-xs uppercase tracking-[0.2em] font-bold mix-blend-difference ${syne.className}`}>
                    Send Signal
                  </span>
                  <div className="relative z-10 w-12 h-12 rounded-full bg-white flex items-center justify-center mix-blend-difference group-hover:scale-90 transition-transform duration-500">
                    <ArrowRight className="w-5 h-5 text-[#050505]" />
                  </div>
                  <motion.div 
                    className="absolute inset-0 bg-white"
                    initial={{ scale: 0, originX: 1, originY: 0.5, borderRadius: "100%" }}
                    whileHover={{ scale: 2 }}
                    transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.6 }}
                  />
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>

      {/* BOX 3: Right Column (Stacked Boxes) */}
      <div className="w-full lg:w-[25%] flex flex-col gap-4 md:gap-6 lg:gap-8 lg:h-[calc(100vh-4rem)]">
        
        {/* Top Right: Image/Visual */}
        <motion.div 
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 rounded-[2rem] md:rounded-[3rem] overflow-hidden relative group shadow-xl min-h-[300px]"
        >
          <motion.img 
            src="https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=800" 
            alt="Aero aesthetic" 
            className="absolute inset-0 w-full h-full object-cover scale-100 group-hover:scale-110 transition-transform duration-[2000ms] ease-[cubic-bezier(0.25,1,0.5,1)]"
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-1000" />
          <div className="absolute top-6 right-6 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
            <span className={`text-[9px] uppercase tracking-[0.2em] font-bold text-white ${syne.className}`}>Visuals</span>
          </div>
        </motion.div>

        {/* Bottom Right: Contact Info */}
        <motion.div 
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white rounded-[2rem] md:rounded-[3rem] p-8 md:p-10 flex flex-col justify-center gap-10 shadow-xl"
        >
          <div className="group cursor-default">
            <span className={`block text-[10px] uppercase tracking-[0.3em] font-bold text-[#050505]/40 mb-3 transition-colors group-hover:text-[#050505] ${syne.className}`}>Atelier</span>
            <p className={`text-sm md:text-base font-medium leading-relaxed text-[#050505] ${outfit.className}`}>
              101 Avenue des Champs-Élysées<br/>75008 Paris, France
            </p>
          </div>
          <div className="w-full h-[1px] bg-[#050505]/10" />
          <div className="group cursor-default">
            <span className={`block text-[10px] uppercase tracking-[0.3em] font-bold text-[#050505]/40 mb-3 transition-colors group-hover:text-[#050505] ${syne.className}`}>Concierge</span>
            <p className={`text-sm md:text-base font-medium leading-relaxed text-[#050505] ${outfit.className}`}>
              concierge@aerostudios.com<br/>+33 1 40 70 22 11
            </p>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
