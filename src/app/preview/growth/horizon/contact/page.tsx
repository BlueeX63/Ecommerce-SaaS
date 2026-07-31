"use client";

import { motion } from "framer-motion";
import { ArrowRight, Mail, MapPin } from "lucide-react";
import { useState } from "react";
import { useHorizon } from "../HorizonContext";

export default function HorizonContact() {
  const { setToastMessage } = useHorizon();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setToastMessage("Inquiry submitted successfully.");
    }, 1500);
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen text-[#111] pt-40 pb-32 relative overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="mb-32"
        >
          <span className="font-outfit text-[10px] uppercase tracking-[0.4em] text-black/40 mb-8 block font-medium">
            Connect
          </span>
          <h1 className="font-cormorant text-6xl md:text-[8rem] font-light tracking-tight leading-none text-[#111]">
            Start a <span className="italic font-medium">Dialogue</span>.
          </h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 xl:gap-32">
          
          {/* Contact Details */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="font-outfit text-sm font-light leading-relaxed text-black/50 mb-16 max-w-sm">
                Whether you're looking for bespoke digital assets, enterprise licensing, or simply want to discuss the architecture of elegance, our team is at your disposal.
              </p>

              <div className="space-y-16">
                <div>
                  <h4 className="font-outfit text-[9px] uppercase tracking-[0.3em] text-black/40 mb-4 flex items-center gap-2 font-medium">
                    <Mail className="w-3 h-3" strokeWidth={1.5} /> Direct Email
                  </h4>
                  <a href="mailto:studio@horizon.design" className="font-cormorant text-4xl font-light hover:text-black/50 transition-colors pointer-events-auto" style={{ cursor: "none" }}>
                    studio@horizon.design
                  </a>
                </div>
                
                <div>
                  <h4 className="font-outfit text-[9px] uppercase tracking-[0.3em] text-black/40 mb-4 flex items-center gap-2 font-medium">
                    <MapPin className="w-3 h-3" strokeWidth={1.5} /> Global Headquarters
                  </h4>
                  <p className="font-cormorant text-3xl font-light text-black/80 leading-relaxed">
                    142 Aesthetics Blvd.<br />
                    Design District<br />
                    New York, NY 10012
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Form Section */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white p-12 md:p-16 shadow-[0_20px_60px_rgba(0,0,0,0.03)] border border-black/5"
            >
               {isSuccess ? (
                 <motion.div 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   className="flex flex-col items-center justify-center text-center h-full min-h-[400px]"
                 >
                   <h3 className="font-cormorant text-5xl font-light italic mb-8 text-[#111]">Inquiry Received.</h3>
                   <p className="font-outfit text-black/50 font-light text-sm max-w-sm leading-relaxed">
                     A member of our team will respond to your request within 24 hours.
                   </p>
                 </motion.div>
               ) : (
                 <form onSubmit={handleSubmit} className="space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="relative group pointer-events-auto" style={{ cursor: "none" }}>
                      <input 
                        required 
                        type="text" 
                        placeholder="Name"
                        className="w-full bg-transparent border-b border-black/10 pb-4 font-outfit font-light text-sm text-[#111] focus:outline-none focus:border-black transition-colors peer placeholder-transparent" 
                        style={{ cursor: "none" }}
                      />
                      <label className="absolute left-0 -top-6 text-[10px] uppercase tracking-[0.2em] font-outfit text-black/40 transition-all peer-placeholder-shown:top-0 peer-placeholder-shown:text-sm peer-focus:-top-6 peer-focus:text-[10px] peer-focus:text-black">
                        Full Name
                      </label>
                    </div>
                    
                    <div className="relative group pointer-events-auto" style={{ cursor: "none" }}>
                      <input 
                        required 
                        type="email" 
                        placeholder="Email"
                        className="w-full bg-transparent border-b border-black/10 pb-4 font-outfit font-light text-sm text-[#111] focus:outline-none focus:border-black transition-colors peer placeholder-transparent" 
                        style={{ cursor: "none" }}
                      />
                      <label className="absolute left-0 -top-6 text-[10px] uppercase tracking-[0.2em] font-outfit text-black/40 transition-all peer-placeholder-shown:top-0 peer-placeholder-shown:text-sm peer-focus:-top-6 peer-focus:text-[10px] peer-focus:text-black">
                        Email Address
                      </label>
                    </div>
                  </div>

                  <div className="relative group pointer-events-auto" style={{ cursor: "none" }}>
                    <input 
                      type="text" 
                      placeholder="Subject"
                      className="w-full bg-transparent border-b border-black/10 pb-4 font-outfit font-light text-sm text-[#111] focus:outline-none focus:border-black transition-colors peer placeholder-transparent" 
                      style={{ cursor: "none" }}
                    />
                    <label className="absolute left-0 -top-6 text-[10px] uppercase tracking-[0.2em] font-outfit text-black/40 transition-all peer-placeholder-shown:top-0 peer-placeholder-shown:text-sm peer-focus:-top-6 peer-focus:text-[10px] peer-focus:text-black">
                      Subject
                    </label>
                  </div>

                  <div className="relative group pt-6 pointer-events-auto" style={{ cursor: "none" }}>
                    <textarea 
                      required 
                      rows={4}
                      placeholder="Message"
                      className="w-full bg-transparent border-b border-black/10 pb-4 font-outfit font-light text-sm text-[#111] focus:outline-none focus:border-black transition-colors peer placeholder-transparent resize-none" 
                      style={{ cursor: "none" }}
                    />
                    <label className="absolute left-0 -top-6 text-[10px] uppercase tracking-[0.2em] font-outfit text-black/40 transition-all peer-placeholder-shown:top-6 peer-placeholder-shown:text-sm peer-focus:-top-6 peer-focus:text-[10px] peer-focus:text-black">
                      Your Inquiry
                    </label>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    style={{ cursor: "none" }}
                    className="w-full py-6 bg-black text-white text-[10px] uppercase tracking-[0.3em] font-outfit font-medium transition-all duration-500 flex items-center justify-center gap-4 group overflow-hidden relative disabled:opacity-50 pointer-events-auto"
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      {isSubmitting ? "TRANSMITTING..." : "SUBMIT INQUIRY"}
                      {!isSubmitting && <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" strokeWidth={1.5} />}
                    </span>
                    <div className="absolute inset-0 bg-[#333] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-0" />
                  </button>
                </form>
               )}
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
