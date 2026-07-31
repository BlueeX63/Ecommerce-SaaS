"use client";

import { motion } from "framer-motion";
import { ArrowRight, Send } from "lucide-react";
import { useState } from "react";

export default function CanvasContactPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setTimeout(() => setStatus("sent"), 1500);
  };

  return (
    <div className="flex flex-col w-full bg-black text-white min-h-screen">

      <section className="px-6 md:px-12 w-full pt-32 pb-16 border-b border-white/20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-12">
            [ Concierge ]
          </div>
          <h1 className="font-serif text-5xl md:text-8xl tracking-tighter uppercase leading-[0.8]">
            Inquiries.
          </h1>
        </motion.div>
      </section>

      <section className="w-full grid grid-cols-1 lg:grid-cols-2">
        
        {/* Left Side: Contact Info */}
        <div className="p-12 md:p-24 border-b lg:border-b-0 lg:border-r border-white/20 flex flex-col justify-between">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.2 }}
            className="mb-24"
          >
            <p className="text-[10px] uppercase tracking-[0.2em] leading-loose text-white/60 max-w-sm">
              For acquisitions, editorial pulls, or studio visits, direct your transmission through the form or utilize the contacts provided.
            </p>
          </motion.div>
          
          <div className="space-y-16">
            <div>
              <h3 className="text-[10px] font-mono tracking-widest text-white mb-6 uppercase border-b border-white/20 pb-2 inline-block">Atelier</h3>
              <p className="text-[10px] uppercase tracking-[0.2em] leading-loose text-white/50">
                1984 Monolith Blvd<br/>
                Sector 4<br/>
                New York, NY 10001
              </p>
            </div>
            <div>
              <h3 className="text-[10px] font-mono tracking-widest text-white mb-6 uppercase border-b border-white/20 pb-2 inline-block">Direct</h3>
              <p className="text-[10px] uppercase tracking-[0.2em] leading-loose text-white/50">
                inquiries@canvas.studio<br/>
                +1 (555) 019-8472
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-12 md:p-24 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md"
          >
            <form onSubmit={handleSubmit} className="space-y-12 w-full">
              
              <div className="space-y-4">
                <label htmlFor="name" className="block text-[10px] uppercase tracking-[0.2em] text-white/50">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  className="w-full bg-transparent border-b border-white/20 pb-4 text-[10px] uppercase tracking-[0.2em] text-white focus:outline-none focus:border-white transition-colors placeholder:text-white/20 rounded-none"
                  placeholder="J. DOE"
                />
              </div>
              
              <div className="space-y-4">
                <label htmlFor="email" className="block text-[10px] uppercase tracking-[0.2em] text-white/50">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  className="w-full bg-transparent border-b border-white/20 pb-4 text-[10px] uppercase tracking-[0.2em] text-white focus:outline-none focus:border-white transition-colors placeholder:text-white/20 rounded-none"
                  placeholder="USER@DOMAIN.COM"
                />
              </div>
              
              <div className="space-y-4">
                <label htmlFor="message" className="block text-[10px] uppercase tracking-[0.2em] text-white/50">
                  Transmission
                </label>
                <textarea
                  id="message"
                  required
                  rows={4}
                  className="w-full bg-transparent border-b border-white/20 pb-4 text-[10px] uppercase tracking-[0.2em] text-white focus:outline-none focus:border-white transition-colors resize-none placeholder:text-white/20 rounded-none"
                  placeholder="ENTER MESSAGE..."
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={status !== "idle"}
                className="w-full border border-white/30 text-[10px] uppercase tracking-[0.2em] flex items-center justify-between px-8 py-5 hover:bg-white hover:text-black transition-colors duration-500 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-white"
              >
                <span>{status === "idle" ? "Send Transmission" : status === "sending" ? "Transmitting..." : "Received."}</span>
                {status === "idle" && <Send className="w-4 h-4" />}
              </button>
            </form>
          </motion.div>
        </div>

      </section>
    </div>
  );
}
