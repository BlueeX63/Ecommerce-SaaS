"use client";

import Link from "next/link";
import { ArrowUpRight, Zap, Palette, Code2, User, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { TransitionLink } from "@/components/TransitionLink";
import { useRouter } from "next/navigation";

const templates = [
  { id: "starter-minimalist", name: "Minimalist", category: "Fashion", img: "/screenshots/starter_minimalist.png", delay: 0.1, href: "/preview/starter/minimalist" },
  { id: "starter-essence", name: "Essence", category: "Clean Skincare", img: "/screenshots/starter_essence.png", delay: 0.2, href: "/preview/starter/essence" },
  { id: "starter-origin", name: "Origin", category: "Soft Ceramics", img: "/screenshots/starter_origin.png", delay: 0.3, href: "/preview/starter/origin" },
  { id: "starter-canvas", name: "Canvas", category: "Editorial Furniture", img: "/screenshots/starter_canvas.png", delay: 0.4, href: "/preview/starter/canvas" },
  { id: "growth-nexus-pro", name: "Nexus Pro", category: "Tech & Gadgets", img: "/screenshots/growth_nexus_pro.png", delay: 0.1, href: "/preview/growth/nexus-pro" },
  { id: "growth-velocity", name: "Velocity", category: "Dark Cyberpunk", img: "/screenshots/growth_velocity.png", delay: 0.2, href: "/preview/growth/velocity" },
  { id: "growth-quantum", name: "Quantum", category: "Animated", img: "/screenshots/growth_quantum.png", delay: 0.3, href: "/preview/growth/quantum" },
  { id: "growth-horizon", name: "Horizon", category: "Digital", img: "/screenshots/growth_horizon.png", delay: 0.4, href: "/preview/growth/horizon" }
];

export default function TemplatesPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  const [hasPlan, setHasPlan] = useState(false);

  useEffect(() => {
    setHasPlan(localStorage.getItem('has_empire_plan') === 'true');
  }, []);

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
      <section className="relative min-h-[70vh] pt-40 pb-20 px-8 max-w-[1600px] mx-auto flex items-end bg-[#F8F7F5] overflow-hidden">
        {/* Background Blur Elements */}
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-black/[0.04] to-transparent blur-3xl pointer-events-none" />
        <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#FF4D00]/[0.08] to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-20 w-full flex flex-col md:flex-row justify-between items-end gap-12">
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-black/10 bg-white/50 backdrop-blur-md mb-8"
            >
              <div className="w-2 h-2 rounded-full bg-[#FF4D00] animate-pulse" />
              <span className="text-xs font-accent uppercase tracking-widest font-bold text-primary">The Architecture</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="font-heading text-6xl md:text-[90px] lg:text-[120px] leading-[0.9] tracking-tighter text-[#111111] uppercase max-w-4xl"
            >
              Mold The <br /> Web.
            </motion.h1>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex-shrink-0 max-w-sm pb-4"
          >
            <p className="text-[#111111] text-lg font-medium leading-relaxed">
              Stop settling for generic layouts. Deploy award-winning, WebGL-ready storefront templates that command absolute authority.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Grid Showcase Section */}
      <div className="w-full bg-[#F8F7F5] relative z-20 pb-32">
        <section className="px-4 md:px-8 max-w-[1400px] mx-auto relative z-10 pt-16">
          <div className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <h2 className="font-heading text-4xl md:text-5xl tracking-tighter text-primary uppercase">The Vault</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
            {templates.map((tpl) => (
              <div 
                key={tpl.id} 
                onClick={() => {
                  if (hasPlan) {
                    setSelectedTemplate(tpl.id);
                  } else {
                    window.open(tpl.href || "#", "_blank");
                  }
                }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.8, delay: tpl.delay, ease: [0.16, 1, 0.3, 1] }}
                  className="group flex flex-col gap-6 cursor-pointer relative"
                >
                
                {/* Image Container with Browser Frame */}
                <div className={`relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#EAE8E4] border shadow-sm transition-all duration-500 ${selectedTemplate === tpl.id ? 'border-[#FF4D00] shadow-[0_10px_40px_rgba(255,77,0,0.2)] ring-4 ring-[#FF4D00]/20' : 'border-black/5 group-hover:shadow-2xl'}`}>
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
              </div>
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

      {/* Floating Action Bar */}
      <AnimatePresence>
        {selectedTemplate && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between gap-6 px-6 py-4 bg-white/90 backdrop-blur-xl border border-black/10 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.1)]"
          >
            <div className="flex flex-col">
              <span className="text-xs font-accent uppercase tracking-widest text-black/50">Selected Template</span>
              <span className="font-heading font-medium text-lg text-black whitespace-nowrap">{templates.find(t => t.id === selectedTemplate)?.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  const href = templates.find(t => t.id === selectedTemplate)?.href;
                  if (href) window.open(href, '_blank');
                }}
                className="hidden sm:flex items-center justify-center px-6 py-3 rounded-full border border-black/10 bg-white text-black hover:bg-black/5 transition-all duration-300 whitespace-nowrap"
              >
                <span className="font-accent font-bold uppercase tracking-widest text-xs">Preview</span>
              </button>
              <button 
                onClick={() => router.push(`/customize/${selectedTemplate}`)}
                className="flex items-center justify-center gap-3 px-6 sm:px-8 py-3 rounded-full bg-[#FF4D00] text-white overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,77,0,0.3)] hover:scale-[1.02] active:scale-[0.98] group whitespace-nowrap"
              >
                <span className="font-accent font-bold uppercase tracking-widest text-xs">Proceed</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
