"use client";

import { motion } from "framer-motion";
import { Terminal, Send, ShieldAlert, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { useCustomization } from "@/hooks/useCustomization";

export default function VelocityContactPage() {
  const customData = useCustomization();
  
  const tPreTitle = customData?.formData?.contactPreTitle || "Contact Information";
  const tTitle = customData?.formData?.contactTitle || "Contact Us";
  const tAddress = customData?.formData?.contactAddress || "35.6762° N, 139.6503° E\nTokyo, Japan";
  const tEmail = customData?.formData?.contactEmail || "support@velocity.com";
  const tPhone = customData?.formData?.contactPhone || "Usually within 24 hours";
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    message: ""
  });
  
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [transmitSuccess, setTransmitSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsTransmitting(true);
    // Fake transmit delay
    setTimeout(() => {
      setIsTransmitting(false);
      setTransmitSuccess(true);
      setTimeout(() => setTransmitSuccess(false), 3000);
      setFormState({ name: "", email: "", message: "" });
    }, 2000);
  };

  return (
    <div className="bg-[#050505] min-h-screen text-white pt-32 pb-32 relative overflow-hidden flex items-center justify-center">
      
      {/* Glitch BG */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,240,255,0.05)_0%,rgba(0,0,0,1)_70%)] pointer-events-none" />

      <div className="w-full max-w-5xl mx-auto px-6 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* Terminal / Info Pane */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className="lg:col-span-2 bg-[#0a0a0a] border border-[#00f0ff]/30 p-6 font-mono text-xs text-[#00f0ff] relative overflow-hidden shadow-[0_0_30px_rgba(0,240,255,0.05)]"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent opacity-50" />
            
            <div className="flex items-center gap-2 mb-8 border-b border-[#00f0ff]/20 pb-4">
              <Terminal className="w-4 h-4" />
              <span className="font-bold tracking-widest uppercase">{tPreTitle}</span>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-white/40 mb-1">OUR LOCATION</p>
                <p className="font-bold tracking-widest whitespace-pre-wrap">
                  {tAddress.split('\\n').map((line: string, i: number) => (
                    <span key={i}>{line}<br/></span>
                  ))}
                </p>
              </div>

              <div>
                <p className="text-white/40 mb-1">EMAIL SUPPORT</p>
                <p className="font-bold tracking-widest text-[#ff003c]">{tEmail}</p>
              </div>

              <div>
                <p className="text-white/40 mb-1">RESPONSE TIME</p>
                <p className="font-bold tracking-widest flex items-center gap-2">
                  <ShieldAlert className="w-3 h-3 text-[#ff003c]" /> {tPhone}
                </p>
              </div>
            </div>

            {/* Scanning animation */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-[#00f0ff] opacity-50 animate-[scan_3s_ease-in-out_infinite]" style={{ boxShadow: '0 0 10px #00f0ff' }} />
          </motion.div>

          {/* Form Pane */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", damping: 20, delay: 0.1 }}
            className="lg:col-span-3 bg-[#0a0a0a]/50 border border-white/10 p-8 md:p-12 backdrop-blur-md relative group"
          >
            <div className="absolute inset-0 bg-[#00f0ff] opacity-0 group-hover:opacity-5 transition-opacity duration-1000 pointer-events-none" />

            <h2 className="text-3xl font-black uppercase tracking-widest text-white mb-8 font-orbitron flex items-center gap-4">
              <Zap className="w-6 h-6 text-[#ff003c]" /> {tTitle}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-8 font-space">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="relative">
                  <input 
                    type="text" 
                    required
                    value={formState.name}
                    onChange={e => setFormState({...formState, name: e.target.value})}
                    className="w-full bg-transparent border-b-2 border-white/20 pb-2 text-white focus:outline-none focus:border-[#00f0ff] transition-colors peer placeholder-transparent"
                    placeholder="YOUR NAME"
                  />
                  <label className="absolute left-0 top-0 text-xs text-white/50 uppercase tracking-widest -translate-y-5 transition-all peer-placeholder-shown:translate-y-0 peer-placeholder-shown:text-base peer-focus:-translate-y-5 peer-focus:text-xs peer-focus:text-[#00f0ff] pointer-events-none">
                    Your Name
                  </label>
                </div>

                <div className="relative">
                  <input 
                    type="email" 
                    required
                    value={formState.email}
                    onChange={e => setFormState({...formState, email: e.target.value})}
                    className="w-full bg-transparent border-b-2 border-white/20 pb-2 text-white focus:outline-none focus:border-[#ff003c] transition-colors peer placeholder-transparent"
                    placeholder="EMAIL ADDRESS"
                  />
                  <label className="absolute left-0 top-0 text-xs text-white/50 uppercase tracking-widest -translate-y-5 transition-all peer-placeholder-shown:translate-y-0 peer-placeholder-shown:text-base peer-focus:-translate-y-5 peer-focus:text-xs peer-focus:text-[#ff003c] pointer-events-none">
                    Email Address
                  </label>
                </div>
              </div>

              <div className="relative pt-6">
                <textarea 
                  required
                  rows={4}
                  value={formState.message}
                  onChange={e => setFormState({...formState, message: e.target.value})}
                  className="w-full bg-transparent border border-white/20 p-4 text-white focus:outline-none focus:border-[#00f0ff] transition-colors peer placeholder-transparent resize-none"
                  placeholder="YOUR MESSAGE"
                />
                <label className="absolute left-4 top-10 text-white/50 uppercase tracking-widest transition-all peer-placeholder-shown:top-10 peer-focus:-top-3 peer-focus:bg-[#0a0a0a] peer-focus:px-2 peer-focus:text-[#00f0ff] peer-focus:text-xs text-xs -top-3 bg-[#0a0a0a] px-2 pointer-events-none">
                  Your Message
                </label>
              </div>

              <button 
                type="submit"
                disabled={isTransmitting}
                className="w-full relative overflow-hidden group bg-transparent border-2 border-[#00f0ff] text-[#00f0ff] font-black uppercase tracking-[0.3em] py-4 flex items-center justify-center gap-3 transition-colors hover:bg-[#00f0ff] hover:text-black font-orbitron"
              >
                {isTransmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Sending...
                  </span>
                ) : transmitSuccess ? (
                  <span className="text-white flex items-center gap-2">Message Sent <ShieldAlert className="w-4 h-4" /></span>
                ) : (
                  <>
                    Send Message <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

          </motion.div>

        </div>
      </div>
    </div>
  );
}
