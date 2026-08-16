"use client";

import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useRef } from "react";
import { Zap, Activity, Crosshair } from "lucide-react";
import Link from "next/link";
import { useCustomization } from "@/hooks/useCustomization";

export default function VelocityAboutPage() {
  const customData = useCustomization();
  
  const tTitle = customData?.formData?.aboutTitle || "Protocol // 01";
  const tContent1 = customData?.formData?.aboutText1 || "We are the architects of the future. We don't just design clothes; we engineer armor for the digital age.";
  const tContent2 = customData?.formData?.aboutText2 || "Every garment is a piece of hardware. We source advanced synthetics, utilize laser-cut precision, and engineer for maximum mobility in urban environments.";
  const tContent3 = customData?.formData?.aboutText3 || "We outfit the vanguard of the new world. Those who move fast, think critically, and demand gear that can keep pace with an accelerating reality.";
  const tImage = customData?.formData?.aboutHeroImage || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&auto=format&fit=crop";
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  
  const smoothProgress = useSpring(scrollYProgress, { damping: 20, stiffness: 100 });
  const yOffset = useTransform(smoothProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(smoothProgress, [0, 0.2], [1, 0]);

  const milestones = [
    { year: "2084", title: "Inception", desc: "The first prototype of the Aero-Dynamic jacket is forged in the underground labs of Neo-Tokyo." },
    { year: "2087", title: "Expansion", desc: "Velocity acquires Neurolink tech, integrating haptic feedback directly into everyday tactical wear." },
    { year: "2092", title: "Domination", desc: "The Grid becomes the global standard for high-performance cybernetic apparel." }
  ];

  return (
    <div className="bg-[#050505] min-h-screen text-white overflow-hidden relative" ref={containerRef}>
      
      {/* Dynamic Grid Background */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[linear-gradient(rgba(0,240,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden z-10">
        <motion.div 
          style={{ y: yOffset, opacity }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="w-[80vw] h-[80vw] md:w-[40vw] md:h-[40vw] border-[1px] border-[#ff003c]/20 rounded-full flex items-center justify-center animate-[spin_60s_linear_infinite]">
            <div className="w-[70%] h-[70%] border-[1px] border-[#00f0ff]/30 rounded-full border-dashed flex items-center justify-center animate-[spin_40s_linear_infinite_reverse]">
              <div className="w-[50%] h-[50%] border-[2px] border-[#00f0ff]/50 rounded-full" />
            </div>
          </div>
        </motion.div>

        <div className="text-center relative z-20 px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 15 }}
          >
            <Activity className="w-12 h-12 text-[#ff003c] mx-auto mb-6" />
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-[#00f0ff] font-orbitron drop-shadow-[0_0_20px_rgba(0,240,255,0.4)]">
              {tTitle}
            </h1>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-white/60 font-space tracking-[0.3em] uppercase text-sm mt-6 max-w-2xl mx-auto leading-relaxed"
          >
            {tContent1}
          </motion.p>
        </div>
      </section>

      {/* Narrative Section */}
      <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="space-y-8"
          >
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter font-orbitron">
              Beyond <br/><span className="text-[#ff003c]">Human Limits.</span>
            </h2>
            <p className="text-white/70 font-space leading-relaxed">
              {tContent2}
            </p>
            <p className="text-white/70 font-space leading-relaxed">
              {tContent3}
            </p>
            <div className="flex gap-4 pt-8 border-t border-white/10">
              <div className="text-[#00f0ff]">
                <p className="font-black text-3xl font-orbitron">100%</p>
                <p className="text-[10px] uppercase tracking-[0.2em] font-space text-white/50">Cybernetic Integration</p>
              </div>
              <div className="text-[#ff003c]">
                <p className="font-black text-3xl font-orbitron">0%</p>
                <p className="text-[10px] uppercase tracking-[0.2em] font-space text-white/50">Compromise</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative aspect-[4/5] bg-[#0a0a0a] border border-[#00f0ff]/30 p-2 overflow-hidden group"
          >
            <div className="absolute inset-0 bg-[#00f0ff] opacity-0 group-hover:opacity-20 transition-opacity duration-500 mix-blend-screen" />
            <img 
              src={tImage} 
              alt="Lab"
              className="w-full h-full object-cover grayscale mix-blend-luminosity group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000"
            />
            {/* HUD Overlay */}
            <div className="absolute top-4 left-4 text-[#00f0ff] text-[10px] font-mono tracking-widest pointer-events-none">
              <p>REC •</p>
              <p>SCANNING...</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-32 bg-[#00f0ff]/5 border-y border-[#00f0ff]/20 relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <h2 className="text-3xl font-black uppercase tracking-widest font-orbitron text-center mb-24 drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]">
            Timeline
          </h2>
          
          <div className="relative border-l-2 border-[#00f0ff]/30 pl-8 ml-4 md:ml-1/2 space-y-24">
            {milestones.map((ms, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: idx * 0.2 }}
                className="relative"
              >
                <div className="absolute -left-[41px] top-0 w-4 h-4 bg-[#050505] border-2 border-[#00f0ff] rounded-full shadow-[0_0_10px_#00f0ff]" />
                <h3 className="text-4xl font-black text-[#ff003c] font-orbitron mb-2">{ms.year}</h3>
                <h4 className="text-xl font-bold uppercase tracking-widest text-white mb-4">{ms.title}</h4>
                <p className="text-white/60 font-space leading-relaxed max-w-lg">{ms.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6 text-center relative z-10">
        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter font-orbitron mb-8">
          Join the <span className="text-[#00f0ff]">Resistance.</span>
        </h2>
        <Link href="/templates/velocity/products">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="border-2 border-[#00f0ff] bg-transparent text-[#00f0ff] font-black uppercase tracking-[0.2em] px-12 py-6 hover:bg-[#00f0ff] hover:text-black transition-colors shadow-[0_0_20px_rgba(0,240,255,0.2)] hover:shadow-[0_0_40px_rgba(0,240,255,0.6)] font-orbitron text-sm"
          >
            Shop Now
          </motion.button>
        </Link>
      </section>

    </div>
  );
}
