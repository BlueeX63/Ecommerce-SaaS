"use client";

import { motion } from "framer-motion";

import { useState, useEffect } from "react";

export default function StarterContactPage() {
  const [customData, setCustomData] = useState<any>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "MONOLITH_CUSTOMIZATION") {
        setCustomData(event.data.data);
      }
    };
    window.addEventListener("message", handleMessage);
    
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "MONOLITH_REQUEST_STATE" }, "*");
    }
    
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const tTitle = customData?.formData?.contactPageTitle || "Get in touch";
  const tEmail = customData?.formData?.contactEmail || "hello@essentials.com";

  return (
    <div className="px-6 py-24 md:py-32 max-w-2xl mx-auto w-full flex flex-col items-center">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full text-center mb-16"
      >
        <h1 className="font-heading text-4xl md:text-5xl tracking-tighter text-[#111111] mb-4">
          {tTitle}
        </h1>
        <p className="text-black/50 text-sm">
          We usually respond within 24 hours at {tEmail}.
        </p>
      </motion.div>

      <motion.form 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full flex flex-col gap-10"
        onSubmit={(e) => { e.preventDefault(); alert("Mock form submitted successfully."); }}
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-[#111111]">Name</label>
          <input 
            type="text" 
            id="name" 
            required
            className="w-full bg-transparent border-b border-black/20 py-3 text-[#111111] focus:outline-none focus:border-[#FF4D00] transition-colors placeholder:text-black/20 rounded-none"
            placeholder="Jane Doe"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-[#111111]">Email</label>
          <input 
            type="email" 
            id="email" 
            required
            className="w-full bg-transparent border-b border-black/20 py-3 text-[#111111] focus:outline-none focus:border-[#FF4D00] transition-colors placeholder:text-black/20 rounded-none"
            placeholder="jane@example.com"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="message" className="text-xs font-bold uppercase tracking-widest text-[#111111]">Message</label>
          <textarea 
            id="message" 
            required
            rows={4}
            className="w-full bg-transparent border-b border-black/20 py-3 text-[#111111] focus:outline-none focus:border-[#FF4D00] transition-colors placeholder:text-black/20 rounded-none resize-none"
            placeholder="How can we help?"
          />
        </div>

        <button 
          type="submit"
          className="bg-[#111111] text-white py-4 text-xs font-bold tracking-widest uppercase hover:bg-[#FF4D00] transition-colors mt-4"
        >
          Send Message
        </button>
      </motion.form>
    </div>
  );
}
