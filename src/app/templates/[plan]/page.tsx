"use client";

import Link from "next/link";
import { ArrowUpRight, Zap, Palette, Code2, User } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { TransitionLink } from "@/components/TransitionLink";

import { useParams } from "next/navigation";

const getDummyTemplates = (plan: string) => {
  if (plan === "empire") {
    return [
      { name: "Aero", category: "3D Monolithic", img: "/aero-ss.png", span: "col-span-1 md:col-span-2 row-span-2", delay: 0.1, href: "/preview/empire/aero" },
      { name: "Obsidian", category: "Neo-Brutalist", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2940&auto=format&fit=crop", span: "col-span-1 row-span-1", delay: 0.2, href: "/preview/empire/obsidian" },
      { name: "Chronos", category: "Interactive", img: "https://images.unsplash.com/photo-1618365908648-e71bd5716cba?q=80&w=2940&auto=format&fit=crop", span: "col-span-1 row-span-1", delay: 0.3 },
      { name: "Monolith Flagship", category: "Flagship", img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2940&auto=format&fit=crop", span: "col-span-1 md:col-span-3 row-span-2", delay: 0.4 }
    ];
  } else if (plan === "growth") {
    return [
      { name: "Nexus Pro", category: "Tech & Gadgets", img: "/screenshots/growth_nexus_pro.png", span: "col-span-1 md:col-span-2 row-span-2", delay: 0.1, href: "/preview/growth/nexus-pro" },
      { name: "Velocity", category: "Dark Cyberpunk", img: "/screenshots/growth_velocity.png", span: "col-span-1 row-span-1", delay: 0.2, href: "/preview/growth/velocity" },
      { name: "Quantum", category: "Animated", img: "/screenshots/growth_quantum.png", span: "col-span-1 row-span-1", delay: 0.3, href: "/preview/growth/quantum" },
      { name: "Horizon", category: "Digital", img: "/screenshots/growth_horizon.png", span: "col-span-1 md:col-span-3 row-span-2", delay: 0.4, href: "/preview/growth/horizon" }
    ];
  } else {
    return [
      { name: "Minimalist", category: "Fashion", img: "/screenshots/starter_minimalist.png", span: "col-span-1 md:col-span-2 row-span-2", delay: 0.1, href: "/preview/starter/minimalist" },
      { name: "Essence", category: "Clean Skincare", img: "/screenshots/starter_essence.png", span: "col-span-1 row-span-1", delay: 0.2, href: "/preview/starter/essence" },
      { name: "Origin", category: "Soft Ceramics", img: "/screenshots/starter_origin.png", span: "col-span-1 row-span-1", delay: 0.3, href: "/preview/starter/origin" },
      { name: "Canvas", category: "Editorial Furniture", img: "/screenshots/starter_canvas.png", span: "col-span-1 md:col-span-3 row-span-2", delay: 0.4, href: "/preview/starter/canvas" }
    ];
  }
};

export default function PlanTemplatesPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isLoggedIn } = useAuth();
  const params = useParams();
  const plan = (params?.plan as string) || "starter";
  const templates = getDummyTemplates(plan);
  const displayTitle = plan.charAt(0).toUpperCase() + plan.slice(1);

  return (
    <main className="min-h-screen bg-[#F8F7F5] font-body relative w-full selection:bg-[#FF4D00] selection:text-white">

      {/* Navigation */}
      <nav className="absolute top-0 left-0 w-full z-50 flex items-center justify-between px-6 md:px-8 py-6 max-w-[1600px] mx-auto">

        {/* Logo (Left on mobile, Right on desktop) */}
        <TransitionLink href="/" text="Monolith" className="flex items-center gap-3 cursor-pointer order-1 md:order-2 z-50">
          <motion.img
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            src="/logo.png"
            alt="Monolith Logo"
            className="w-8 h-8 md:w-10 md:h-10 object-contain mix-blend-multiply rounded-md"
          />
          <span className="font-heading text-xl md:text-2xl tracking-tighter uppercase text-primary pt-1">
            Monolith
          </span>
        </TransitionLink>

        {/* Links & Profile (Hidden on mobile, Left on desktop) */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-secondary order-2 md:order-1">
          {isLoggedIn && (
            <div className="flex items-center mr-2">
              <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-black/5 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                <User className="w-5 h-5 text-primary" />
              </div>
            </div>
          )}
          <TransitionLink href="/#home" text="Home" className="hover:text-primary transition-colors cursor-pointer">Home</TransitionLink>
          <TransitionLink href="/#features" text="Arsenal" className="hover:text-primary transition-colors cursor-pointer">Arsenal</TransitionLink>
          <TransitionLink href="/#benefits" text="Benefits" className="hover:text-primary transition-colors cursor-pointer">Benefits</TransitionLink>
          <TransitionLink href="/templates" text="Templates" className="text-primary font-bold hover:text-primary transition-colors cursor-pointer">Templates</TransitionLink>
          <TransitionLink href="/#about" text="Mission" className="hover:text-primary transition-colors cursor-pointer">Mission</TransitionLink>
          <TransitionLink href="/#pricing" text="Pricing" className="hover:text-primary transition-colors cursor-pointer">Pricing</TransitionLink>
        </div>

        {/* Mobile Menu Icon & Profile (Hidden on desktop) */}
        <div className="flex md:hidden items-center gap-3 order-2">
          {isLoggedIn && (
            <div className="w-9 h-9 rounded-full bg-white shadow-sm border border-black/5 flex items-center justify-center cursor-pointer active:scale-95 transition-transform">
              <User className="w-4 h-4 text-primary" />
            </div>
          )}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-primary focus:outline-none">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed inset-0 z-40 bg-[#F8F7F5] pt-24 px-6 flex flex-col md:hidden"
        >
          <div className="flex flex-col gap-6 text-2xl font-heading text-primary">
            <TransitionLink href="/#home" text="Home" onClick={() => setIsMobileMenuOpen(false)}>Home</TransitionLink>
            <TransitionLink href="/#features" text="Arsenal" onClick={() => setIsMobileMenuOpen(false)}>Arsenal</TransitionLink>
            <TransitionLink href="/#benefits" text="Benefits" onClick={() => setIsMobileMenuOpen(false)}>Benefits</TransitionLink>
            <TransitionLink href="/templates" text="Templates" onClick={() => setIsMobileMenuOpen(false)}>Templates</TransitionLink>
            <TransitionLink href="/#about" text="Mission" onClick={() => setIsMobileMenuOpen(false)}>Mission</TransitionLink>
            <TransitionLink href="/#pricing" text="Pricing" onClick={() => setIsMobileMenuOpen(false)}>Pricing</TransitionLink>
          </div>
        </motion.div>
      )}

      {/* Hero Section */}
      <section className="relative min-h-[90vh] md:min-h-screen pt-40 pb-20 px-8 flex items-center justify-center overflow-hidden bg-[#F8F7F5]">
        {/* Professional Background Image */}
        <div 
          className="absolute inset-0 z-0 opacity-20"
        >
          <img 
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2940&auto=format&fit=crop" 
            alt="Hero Background"
            className="w-full h-full object-cover grayscale mix-blend-multiply"
          />
        </div>
        
        {/* Soft Radial Gradient for lighting focus */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#F8F7F5_100%)] z-0 opacity-80" />
        
        <div className="relative z-20 w-full max-w-[1600px] mx-auto flex flex-col items-center justify-center text-center h-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full border border-black/10 bg-white/60 backdrop-blur-md mb-12 shadow-sm"
          >
            <div className="w-2 h-2 rounded-full bg-[#FF4D00] animate-pulse" />
            <span className="text-xs font-accent uppercase tracking-widest font-bold text-[#111111]">{displayTitle} Collection</span>
          </motion.div>

          <div className="relative w-full h-[35vh] md:h-[50vh] flex items-center justify-center mt-4">
            <motion.h1
              initial={{ opacity: 0, x: -100, rotate: -5 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-[2%] md:left-[10%] top-[5%] md:top-[15%] font-heading text-[22vw] md:text-[15vw] leading-[0.8] tracking-tighter text-[#111111] uppercase z-20 mix-blend-overlay drop-shadow-sm"
            >
              {displayTitle}
            </motion.h1>
            
            {/* The duplicated outlined text to create a cool 3D/glass effect */}
            <motion.h1
              initial={{ opacity: 0, x: -100, rotate: -5 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-[2%] md:left-[10%] top-[5%] md:top-[15%] font-heading text-[22vw] md:text-[15vw] leading-[0.8] tracking-tighter uppercase z-30"
              style={{
                WebkitTextStroke: "1px rgba(17, 17, 17, 0.2)",
                color: "transparent",
              }}
            >
              {displayTitle}
            </motion.h1>

            <motion.h1
              initial={{ opacity: 0, x: 100, rotate: 5 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-[2%] md:right-[10%] bottom-[5%] md:bottom-[15%] font-heading text-[22vw] md:text-[15vw] leading-[0.8] tracking-tighter uppercase z-40"
              style={{
                WebkitTextStroke: "2px #FF4D00",
                color: "transparent",
              }}
            >
              Vault.
            </motion.h1>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl mx-auto mt-20"
          >
            <p className="text-[#111111]/80 text-xl md:text-2xl font-medium leading-relaxed font-body">
              Experience the pinnacle of e-commerce architecture. <br className="hidden md:block" />
              Scroll to explore the curated {displayTitle.toLowerCase()} templates.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Grid Showcase Section */}
      <div className="w-full bg-[#F8F7F5] relative z-20 pb-32">
        <section className="px-4 md:px-8 max-w-[1400px] mx-auto relative z-10 pt-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
            {templates.map((tpl) => (
              <Link href={(tpl as any).href || "#"} key={tpl.name} passHref>
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.8, delay: tpl.delay, ease: [0.16, 1, 0.3, 1] }}
                  className="group flex flex-col gap-6 cursor-pointer relative"
                >
                
                {/* Image Container with Browser Frame */}
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#EAE8E4] border border-black/5 shadow-sm group-hover:shadow-2xl transition-shadow duration-500">
                  {/* Mac style dots */}
                  <div className="absolute top-0 left-0 w-full h-8 bg-black/[0.03] border-b border-black/5 flex items-center px-4 gap-1.5 z-20 backdrop-blur-sm">
                     <div className="w-2 h-2 rounded-full bg-black/15" />
                     <div className="w-2 h-2 rounded-full bg-black/15" />
                     <div className="w-2 h-2 rounded-full bg-black/15" />
                  </div>
                  {/* Image */}
                  <div className="absolute top-8 left-0 w-full h-[calc(100%-2rem)] overflow-hidden">
                    <img 
                      src={tpl.img} 
                      alt={tpl.name}
                      className="w-full h-full object-cover transition-transform duration-700 ease-[0.16,1,0.3,1] group-hover:scale-[1.03]"
                    />
                  </div>
                </div>

                {/* Info Container */}
                <div className="flex flex-col gap-2 px-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-heading text-3xl md:text-4xl tracking-tight text-[#111111] uppercase">
                      {tpl.name}
                    </h3>
                    <div className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center transition-colors duration-300">
                      <ArrowUpRight className="w-5 h-5 text-black/40 group-hover:text-black/80" />
                    </div>
                  </div>
                  <div className="text-xs md:text-sm font-medium text-black/50 uppercase tracking-widest font-accent">
                    {tpl.category}
                  </div>
                </div>
              </motion.div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-[#F8F7F5] border-t border-black/10 pt-24 pb-12 px-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-1 md:col-span-2">
              <Link href="#" className="font-heading text-4xl text-primary tracking-tighter uppercase block mb-6">
                Monolith.
              </Link>
              <p className="text-secondary font-medium max-w-sm leading-relaxed">
                Elevating ecommerce for the modern brand. Design, scale, and convert with confidence.
              </p>
            </div>

            <div>
              <h4 className="font-accent font-bold uppercase tracking-widest text-xs text-primary mb-6">Product</h4>
              <ul className="space-y-4 text-sm font-medium text-secondary">
                <li><TransitionLink href="/#features" className="hover:text-accent transition-colors">Features</TransitionLink></li>
                <li><TransitionLink href="/#pricing" className="hover:text-accent transition-colors">Pricing</TransitionLink></li>
                <li><TransitionLink href="/templates" className="hover:text-accent transition-colors">Templates</TransitionLink></li>
              </ul>
            </div>

            <div>
              <h4 className="font-accent font-bold uppercase tracking-widest text-xs text-primary mb-6">Company</h4>
              <ul className="space-y-4 text-sm font-medium text-secondary">
                <li><Link href="/#about" className="hover:text-accent transition-colors">About Us</Link></li>
                <li><Link href="/#contact" className="hover:text-accent transition-colors">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-black/5 text-xs font-medium text-secondary/60 font-accent uppercase tracking-wider">
            <p>&copy; 2026 Monolith Inc. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-primary transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
