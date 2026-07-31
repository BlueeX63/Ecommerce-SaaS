"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function QuantumContactPage() {
  const [formState, setFormState] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setFormState({ name: "", email: "", message: "" });
      setTimeout(() => setIsSuccess(false), 5000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F9F9FB] pt-32 pb-24 relative overflow-hidden">
      {/* Abstract Background Blur */}
      <div className="absolute top-1/4 -left-1/4 w-[800px] h-[800px] bg-gradient-to-br from-gray-200 to-gray-100 rounded-full blur-[100px] -z-10 animate-[pulse_10s_ease-in-out_infinite]" />

      <div className="max-w-[1200px] mx-auto px-6 md:px-12 flex flex-col md:flex-row gap-16">
        <div className="w-full md:w-1/2">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="font-playfair text-5xl md:text-7xl font-bold text-[#121212] mb-6">Let's Connect.</h1>
            <p className="font-inter text-gray-500 text-lg mb-12 max-w-md">
              Whether you're inquiring about a bespoke commission or need support with a recent acquisition, our concierge is at your disposal.
            </p>

            <div className="space-y-8 font-inter">
              <div>
                <h3 className="text-[#111111] font-bold uppercase tracking-widest text-xs mb-2">Studio</h3>
                <p className="text-[#121212] font-medium text-lg">100 Quantum Way<br/>Neo-Tokyo, 100-0001</p>
              </div>
              <div>
                <h3 className="text-[#111111] font-bold uppercase tracking-widest text-xs mb-2">Direct</h3>
                <p className="text-[#121212] font-medium text-lg">concierge@quantum.design<br/>+81 3 1234 5678</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="w-full md:w-1/2 relative">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white/60 backdrop-blur-2xl border border-white/50 p-8 md:p-12 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
          >
            {isSuccess ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col items-center justify-center text-center py-16"
              >
                <div className="w-20 h-20 bg-[#111111]/10 text-[#111111] rounded-full flex items-center justify-center mb-6">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="font-playfair text-3xl font-bold text-[#121212] mb-2">Transmission Received</h2>
                <p className="font-inter text-gray-500">Our concierge will contact you shortly.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative group">
                  <input
                    type="text"
                    id="name"
                    required
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    className="w-full bg-transparent border-b-2 border-gray-200 py-4 font-inter text-lg focus:outline-none focus:border-[#111111] transition-colors peer"
                    placeholder=" "
                  />
                  <label htmlFor="name" className="absolute left-0 top-4 text-gray-400 font-inter text-lg transition-all peer-focus:-top-2 peer-focus:text-xs peer-focus:text-[#111111] peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-widest peer-valid:-top-2 peer-valid:text-xs peer-valid:text-gray-400 peer-valid:font-bold peer-valid:uppercase peer-valid:tracking-widest pointer-events-none">
                    Your Name
                  </label>
                </div>

                <div className="relative group">
                  <input
                    type="email"
                    id="email"
                    required
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    className="w-full bg-transparent border-b-2 border-gray-200 py-4 font-inter text-lg focus:outline-none focus:border-[#111111] transition-colors peer"
                    placeholder=" "
                  />
                  <label htmlFor="email" className="absolute left-0 top-4 text-gray-400 font-inter text-lg transition-all peer-focus:-top-2 peer-focus:text-xs peer-focus:text-[#111111] peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-widest peer-valid:-top-2 peer-valid:text-xs peer-valid:text-gray-400 peer-valid:font-bold peer-valid:uppercase peer-valid:tracking-widest pointer-events-none">
                    Email Address
                  </label>
                </div>

                <div className="relative group">
                  <textarea
                    id="message"
                    required
                    rows={4}
                    value={formState.message}
                    onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                    className="w-full bg-transparent border-b-2 border-gray-200 py-4 font-inter text-lg focus:outline-none focus:border-[#111111] transition-colors peer resize-none"
                    placeholder=" "
                  />
                  <label htmlFor="message" className="absolute left-0 top-4 text-gray-400 font-inter text-lg transition-all peer-focus:-top-2 peer-focus:text-xs peer-focus:text-[#111111] peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-widest peer-valid:-top-2 peer-valid:text-xs peer-valid:text-gray-400 peer-valid:font-bold peer-valid:uppercase peer-valid:tracking-widest pointer-events-none">
                    Your Message
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 bg-[#121212] text-white rounded-full font-bold font-inter uppercase tracking-widest text-sm hover:bg-[#111111] transition-all shadow-xl hover:shadow-[#111111]/40 relative overflow-hidden group mt-4"
                >
                  <span className={`transition-opacity ${isSubmitting ? 'opacity-0' : 'opacity-100'}`}>
                    Send Message
                  </span>
                  {isSubmitting && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </span>
                  )}
                  <motion.span 
                    className="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-[shimmer_1s_forwards]"
                    style={{ transform: "skewX(-20deg)" }}
                  />
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
