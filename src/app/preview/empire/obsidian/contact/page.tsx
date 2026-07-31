"use client";

import React from 'react';
import { Inter, Oswald } from 'next/font/google';
import { motion } from 'framer-motion';
import { Hexagon, ArrowRight, Mail, MapPin } from 'lucide-react';

const inter = Inter({ subsets: ['latin'] });
const oswald = Oswald({ subsets: ['latin'] });

export default function ObsidianContactPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white pt-40 md:pt-56 pb-20 px-6 md:px-12 selection:bg-white selection:text-black">
      <div className="max-w-[1400px] mx-auto">
        
        <header className="mb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          >
            <span className={`flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.4em] font-bold text-white/40 mb-6 ${inter.className}`}>
              <Hexagon className="w-3 h-3 fill-white/40" /> SECURE_COMMS
            </span>
            <h1 className={`text-5xl md:text-8xl font-bold uppercase tracking-widest mb-6 ${oswald.className}`}>
              COMMUNICATE
            </h1>
            <p className={`text-xs text-white/60 uppercase tracking-[0.2em] font-bold max-w-md mx-auto leading-loose ${inter.className}`}>
              Establish a secure line with Obsidian Headquarters. Response protocol initiates within 24 hours.
            </p>
          </motion.div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
          
          {/* Left: Contact Info */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col justify-center"
          >
            <div className="space-y-12">
              <div>
                <h3 className={`text-[10px] uppercase tracking-[0.4em] font-bold text-white/40 mb-4 flex items-center gap-2 ${inter.className}`}>
                  <MapPin className="w-3 h-3" /> HQ_COORDINATES
                </h3>
                <p className={`text-2xl font-bold uppercase tracking-widest leading-loose ${oswald.className}`}>
                  OBSIDIAN TOWER <br/>
                  DISTRICT 9, NEO-TOKYO <br/>
                  JP // 100-0001
                </p>
              </div>
              
              <div>
                <h3 className={`text-[10px] uppercase tracking-[0.4em] font-bold text-white/40 mb-4 flex items-center gap-2 ${inter.className}`}>
                  <Mail className="w-3 h-3" /> DIRECT_LINE
                </h3>
                <p className={`text-2xl font-bold uppercase tracking-widest ${oswald.className}`}>
                  SYS@OBSIDIAN.CORP
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right: Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-[#111] border border-white/10 p-8 md:p-12"
          >
            <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className={`block text-[9px] uppercase tracking-[0.3em] font-bold text-white/40 mb-3 ${inter.className}`}>OPERATIVE_ID (NAME)</label>
                <input required type="text" className={`w-full bg-[#0a0a0a] border border-white/10 p-5 text-sm focus:border-white focus:outline-none transition-colors rounded-none ${inter.className}`} />
              </div>
              
              <div>
                <label className={`block text-[9px] uppercase tracking-[0.3em] font-bold text-white/40 mb-3 ${inter.className}`}>TRANSMISSION_RETURN (EMAIL)</label>
                <input required type="email" className={`w-full bg-[#0a0a0a] border border-white/10 p-5 text-sm focus:border-white focus:outline-none transition-colors rounded-none ${inter.className}`} />
              </div>
              
              <div>
                <label className={`block text-[9px] uppercase tracking-[0.3em] font-bold text-white/40 mb-3 ${inter.className}`}>DATA_PAYLOAD (MESSAGE)</label>
                <textarea required rows={5} className={`w-full bg-[#0a0a0a] border border-white/10 p-5 text-sm focus:border-white focus:outline-none transition-colors rounded-none resize-none ${inter.className}`} />
              </div>

              <button type="submit" className={`w-full py-6 bg-white text-black text-[11px] font-bold uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 group hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] mt-4 ${inter.className}`}>
                TRANSMIT DATA <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </button>
            </form>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
