"use client";

import { motion } from "framer-motion";

import { useCustomization } from "@/hooks/useCustomization";

export default function EssenceContactPage() {
  const customData = useCustomization();
  
  const tPreTitle = customData?.formData?.contactPreTitle || "Get In Touch";
  const tTitle = customData?.formData?.contactTitle || "Contact Us";
  const tAddress = customData?.formData?.contactAddress || "123 Minimalist Avenue\nDesign District\nNew York, NY 10012";
  const tEmail = customData?.formData?.contactEmail || "hello@essencestudios.com";
  const tPhone = customData?.formData?.contactPhone || "+1 (555) 123-4567";
  const tHours = customData?.formData?.contactHours || "Monday — Friday\n9:00 AM — 6:00 PM EST";
  return (
    <div className="w-full bg-[#F3EDE2] min-h-screen pt-12 pb-32">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="mb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#A69684] mb-6"
          >
            {tPreTitle}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-serif text-4xl md:text-6xl text-[#4A3F35] leading-tight"
          >
            {tTitle}
          </motion.h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
          
          {/* Contact Details */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col gap-12"
          >
            <div>
              <h3 className="font-serif text-2xl text-[#4A3F35] mb-4">Studio</h3>
              <p className="text-sm text-[#4A3F35]/70 leading-relaxed font-serif italic">
                {tAddress.split('\\n').map((line: string, i: number) => (
                  <span key={i}>{line}<br/></span>
                ))}
              </p>
            </div>
            
            <div>
              <h3 className="font-serif text-2xl text-[#4A3F35] mb-4">Enquiries</h3>
              <p className="text-sm text-[#4A3F35]/70 leading-relaxed font-serif italic mb-2">
                {tEmail}
              </p>
              <p className="text-sm text-[#4A3F35]/70 leading-relaxed font-serif italic">
                {tPhone}
              </p>
            </div>
            
            <div>
              <h3 className="font-serif text-2xl text-[#4A3F35] mb-4">Hours</h3>
              <p className="text-sm text-[#4A3F35]/70 leading-relaxed font-serif italic">
                {tHours.split('\\n').map((line: string, i: number) => (
                  <span key={i}>{line}<br/></span>
                ))}
              </p>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <form className="flex flex-col gap-8" onSubmit={(e) => e.preventDefault()}>
              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#4A3F35]">Name</label>
                <input 
                  type="text" 
                  id="name" 
                  className="bg-transparent border-b border-[#4A3F35]/20 pb-2 text-sm focus:outline-none focus:border-[#4A3F35] text-[#4A3F35]"
                  placeholder="Your full name"
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#4A3F35]">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  className="bg-transparent border-b border-[#4A3F35]/20 pb-2 text-sm focus:outline-none focus:border-[#4A3F35] text-[#4A3F35]"
                  placeholder="Your email address"
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <label htmlFor="message" className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#4A3F35]">Message</label>
                <textarea 
                  id="message" 
                  rows={4}
                  className="bg-transparent border-b border-[#4A3F35]/20 pb-2 text-sm focus:outline-none focus:border-[#4A3F35] text-[#4A3F35] resize-none"
                  placeholder="How can we help you?"
                />
              </div>

              <button 
                type="submit"
                className="bg-[#4A3F35] text-[#F3EDE2] py-4 text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#332B25] transition-colors mt-4 w-full"
              >
                Send Message
              </button>
            </form>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
