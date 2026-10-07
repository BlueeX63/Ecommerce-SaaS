"use client";

import Link from "next/link";
import { ArrowRight, User, Globe, Zap, Palette, ShieldCheck, Code2, LayoutTemplate, BarChart3, LogOut } from "lucide-react";
import { PricingCards } from "@/components/pricing/PricingCards";
import { TransitionLink } from "@/components/TransitionLink";
import { motion, useMotionValue, useSpring, useMotionTemplate, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { NameSetupModal } from "@/components/dashboard/NameSetupModal";
import { Settings, CreditCard } from "lucide-react";
import { ProfileDropdown } from "@/components/ProfileDropdown";

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

export default function LandingPageClient({ initialIsLoggedIn, initialHasStore, user, needsNameSetup }: { initialIsLoggedIn: boolean, initialHasStore?: boolean, user?: any, needsNameSetup?: boolean }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNavHidden, setIsNavHidden] = useState(false);
  const lastScrollY = useRef(0);

  // Auto-hiding nav: slides up out of view once the page scrolls down past a small threshold, and comes
  // straight back as soon as the user scrolls up - so it never blocks the page, but is never more than a
  // scroll-up away.
  useEffect(() => {
    const SHOW_NEAR_TOP = 80;
    const handleScroll = () => {
      const y = window.scrollY;
      if (y < SHOW_NEAR_TOP) {
        setIsNavHidden(false);
      } else if (y > lastScrollY.current) {
        setIsNavHidden(true);
      } else if (y < lastScrollY.current) {
        setIsNavHidden(false);
      }
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST' });
    setIsLoggedIn(false);
    setIsDropdownOpen(false);
    window.location.reload();
  };

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    const lenis = (window as any).lenis;
    if (element) {
      if (lenis) {
        lenis.scrollTo(element, { duration: 2 });
      } else {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (id === 'home') {
      if (lenis) {
        lenis.scrollTo(0, { duration: 2 });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  return (
    <main className="min-h-screen bg-[#F8F7F5] font-body relative w-full overflow-x-hidden">

      {/* Navigation - a floating pill, fixed to the top and centered, with its own solid dark background so
          it stays legible over anything behind it. The primary CTA lives inside it as a bright chip at the
          end, the way the reference does with its contact pill. */}
      <motion.nav
        animate={{ y: isNavHidden ? -120 : 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 28, mass: 0.9 }}
        className="fixed top-5 md:top-6 inset-x-0 z-50 px-4 flex justify-end md:justify-center"
      >
        {/* Desktop: the floating pill */}
        <div className="hidden md:flex items-center gap-1 bg-primary rounded-full pl-2 pr-2 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.25)] max-w-full">
          {/* Mark */}
          <a
            href="#home"
            onClick={(e) => scrollTo(e, 'home')}
            className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-accent flex items-center justify-center shrink-0 cursor-pointer"
          >
            <span className="font-heading font-black text-white text-sm">M</span>
          </a>

          <div className="flex items-center text-xs font-bold uppercase tracking-wider">
            <a href="#features" onClick={(e) => scrollTo(e, 'features')} className="px-3.5 py-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
              Arsenal
            </a>
            <a href="#benefits" onClick={(e) => scrollTo(e, 'benefits')} className="px-3.5 py-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
              Benefits
            </a>
            <TransitionLink href="/templates" className="px-3.5 py-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
              Templates
            </TransitionLink>
            <a href="#about" onClick={(e) => scrollTo(e, 'about')} className="px-3.5 py-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
              Mission
            </a>
            <a href="#pricing" onClick={(e) => scrollTo(e, 'pricing')} className="px-3.5 py-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
              Pricing
            </a>
            <Link href="/dashboard" className="px-3.5 py-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
              Dashboard
            </Link>
          </div>

          {/* Right end: account avatar when signed in, otherwise the Start Building chip */}
          {isLoggedIn ? (
            <div className="relative ml-1">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center cursor-pointer hover:bg-white/15 transition-colors"
              >
                <span className="text-sm font-bold text-accent">
                  {user ? `${user.first_name?.[0] || ''}${user.last_name !== '-' ? user.last_name?.[0] || '' : ''}`.toUpperCase() : 'U'}
                </span>
              </button>
              <ProfileDropdown isOpen={isDropdownOpen} setIsOpen={setIsDropdownOpen} user={user} logout={handleLogout} />
            </div>
          ) : (
            <TransitionLink
              href="/signup"
              className="ml-1 flex items-center gap-1.5 bg-white text-primary rounded-full pl-4 pr-3 py-2 text-xs font-bold uppercase tracking-wider hover:bg-white/90 transition-colors cursor-pointer"
            >
              Start Building <ArrowRight className="w-3.5 h-3.5" />
            </TransitionLink>
          )}
        </div>

        {/* Mobile: no bar, just the trigger itself */}
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-primary focus:outline-none" aria-label="Toggle menu">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
            )}
          </svg>
        </button>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed inset-0 z-40 bg-[#F8F7F5] pt-24 px-6 pb-10 flex flex-col md:hidden"
        >
          <div className="flex flex-col gap-6 text-2xl font-heading text-primary">
            <a href="#home" onClick={(e) => scrollTo(e, 'home')}>Home</a>
            <a href="#features" onClick={(e) => scrollTo(e, 'features')}>Arsenal</a>
            <a href="#benefits" onClick={(e) => scrollTo(e, 'benefits')}>Benefits</a>
            <TransitionLink href="/templates">Templates</TransitionLink>
            <a href="#about" onClick={(e) => scrollTo(e, 'about')}>Mission</a>
            <a href="#pricing" onClick={(e) => scrollTo(e, 'pricing')}>Pricing</a>
            <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
          </div>

          {/* Account access - this is the only place it's reachable on mobile now that the nav is just the
              hamburger. */}
          <div className="mt-auto pt-8 border-t border-black/10">
            {isLoggedIn ? (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="text-sm font-bold uppercase tracking-wider text-secondary"
              >
                Log Out
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold uppercase tracking-wider text-secondary">
                  Log In
                </Link>
                <TransitionLink
                  href="/signup"
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-white rounded-full py-3.5 text-sm font-bold uppercase tracking-wider"
                >
                  Start Building <ArrowRight className="w-4 h-4" />
                </TransitionLink>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#F8F7F5] pt-24 md:pt-10 px-8 pb-10 md:pb-16">
        <div className="max-w-[1600px] mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="font-bold uppercase text-[13px] md:text-sm tracking-[0.1em] leading-[1.3] text-[#111111]"
          >
            Commerce<br />Built To<br />Outlast.
          </motion.p>
          <span className="inline-block w-10 h-[2px] bg-accent mt-3" />
        </div>

        {/* Giant wordmark with the model photo overlapping it, like the reference. The photo is landscape
            (the walking pose is wider than it is tall), so on a narrow phone it can't fill the same tall box
            by height alone without cropping - below md it fills the box by cropping in slightly (object-cover)
            so the figure stays large enough to cross the text, the way it does on desktop; at md+ there's
            enough width that filling by height (object-contain) never needs to crop anything. */}
        <div className="relative mx-auto max-w-[1600px] px-2 h-[66vh] md:h-screen flex items-center justify-center mt-2">
          <motion.h1
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-x-0 top-[34%] md:top-1/2 -translate-y-1/2 text-center font-heading font-extrabold uppercase leading-none select-none pointer-events-none z-0 tracking-[0.02em]"
            style={{ fontSize: "clamp(3.4rem, 15.5vw, 13.5rem)" }}
          >
            <span className="text-[#111111]">Mono</span>
            <span className="text-accent">lith</span>
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full h-full flex items-end justify-center"
          >
            <img
              src="/hero-model-cutout.png"
              alt="A model walking, styled editorially - standing in for every brand built on Monolith"
              className="w-full h-full object-cover object-[center_12%] md:h-[104%] md:w-auto md:object-contain md:object-bottom"
              style={{
                WebkitMaskImage: "linear-gradient(to bottom, black 86%, transparent 98%)",
                maskImage: "linear-gradient(to bottom, black 86%, transparent 98%)",
              }}
            />
          </motion.div>
        </div>
      </section>

      {/* Standard Card Features Section */}
      <NormalCardFeaturesSection />

      {/* Clean Bento Box Benefits Section */}
      <div className="w-full bg-[#F8F7F5] relative z-20 pb-32">
        <section id="benefits" className="py-32 px-8 bg-[#050505] text-white relative z-30 rounded-[40px] shadow-[0_-20px_80px_rgba(0,0,0,0.1)] max-w-[1500px] mx-auto border border-white/10 overflow-hidden">

          {/* Subtle glow inside the dark container */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#FF4D00]/10 blur-[120px] rounded-full pointer-events-none" />

          {/* Intro */}
          <div className="max-w-[1200px] mx-auto mb-20 text-center relative z-10">
            <h2 className="font-heading text-5xl md:text-7xl mb-6 tracking-tight">
              Built for <span className="text-[#FF4D00]">Absolute</span> Scale.
            </h2>
            <p className="text-white/50 text-xl font-medium max-w-2xl mx-auto">
              Stop settling for generic templates. We provide the infrastructure and design system to run an Awwwards-level empire.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[400px] relative z-10">

            {/* Card 1: Speed (Large horizontal) */}
            <div className="md:col-span-2 bg-[#111] rounded-3xl border border-white/10 p-10 flex flex-col justify-between group hover:border-white/30 transition-all duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-accent/20 transition-all duration-500" />
              <div className="relative z-10 w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500">
                <Zap className="w-8 h-8 text-accent" />
              </div>
              <div className="relative z-10">
                <h3 className="font-heading text-4xl mb-3 tracking-tight">Edge Native Architecture.</h3>
                <p className="text-white/60 font-medium text-lg leading-relaxed max-w-md">Built on global edge infrastructure. Sub-second load times anywhere on Earth. Because slow stores don&apos;t convert.</p>
              </div>
            </div>

            {/* Card 2: Security (Small vertical) */}
            <div className="md:col-span-1 bg-[#111] rounded-3xl border border-white/10 p-10 flex flex-col justify-between group hover:border-white/30 transition-all duration-500">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="font-heading text-3xl mb-3 tracking-tight">Bank-Grade Fortress.</h3>
                <p className="text-white/60 font-medium text-lg leading-relaxed">PCI compliant checkouts and automated DDOS mitigation. Total data isolation.</p>
              </div>
            </div>

            {/* Card 3: Aesthetics (Small vertical) */}
            <div className="md:col-span-1 bg-[#111] rounded-3xl border border-white/10 p-10 flex flex-col justify-between group hover:border-white/30 transition-all duration-500">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500">
                <Palette className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="font-heading text-3xl mb-3 tracking-tight">Award-Winning WebGL.</h3>
                <p className="text-white/60 font-medium text-lg leading-relaxed">Raw WebGL and Framer Motion templates to command premium brand authority.</p>
              </div>
            </div>

            {/* Card 4: Pricing (Large horizontal) */}
            <div className="md:col-span-2 bg-[#111] rounded-3xl border border-[#FF4D00]/20 p-10 flex flex-col md:flex-row justify-between items-start md:items-end group hover:border-[#FF4D00]/40 transition-all duration-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-50" />
              <div className="relative z-10 max-w-lg mb-8 md:mb-0">
                <div className="inline-block px-3 py-1 bg-accent/20 text-accent font-accent uppercase tracking-widest text-xs font-bold rounded-full mb-6 border border-accent/30">
                  The Unfair Advantage
                </div>
                <h3 className="font-heading text-4xl mb-3 tracking-tight">A Fraction of the Cost.</h3>
                <p className="text-white/60 font-medium text-lg leading-relaxed">Competitors charge thousands per month and take a cut of your revenue. We give you full access to an enterprise tech stack for a flat, radically lower rate.</p>
              </div>
              <div className="relative z-10 w-16 h-16 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-500">
                <ArrowRight className="w-6 h-6" />
              </div>
            </div>

          </div>
        </section>
      </div>
      {/* Spotlight About Us Section */}
      <SpotlightAboutSection />


      {/* Minimalist Pricing Section */}
      <section id="pricing" className="py-32 bg-[#F8F7F5] relative z-10 overflow-hidden border-t border-black/10">
        <div className="max-w-[1500px] mx-auto px-8 relative block">
          {/* Cards Wrapper */}
          <div className="w-full">
            <PricingCards />
          </div>
        </div>
      </section>
      {/* Awwwards Contact Section */}
      <section id="contact" className="py-32 bg-[#F8F7F5] relative z-10 overflow-hidden border-t border-black/10">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="bg-[#050505] rounded-[40px] p-12 md:p-20 lg:p-24 flex flex-col lg:flex-row gap-20 relative overflow-hidden shadow-2xl border border-white/10">
            {/* Background Texture */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#FF4D00]/10 blur-[120px] rounded-full pointer-events-none translate-x-1/3 -translate-y-1/3" />

            {/* Left Column: Huge Typography */}
            <div className="flex-1 relative z-10">
              <span className="font-accent tracking-[0.4em] uppercase text-xs font-bold text-[#FF4D00] mb-8 block">
                Initiate
              </span>
              <h2 className="font-heading text-6xl md:text-[90px] xl:text-[110px] tracking-tighter uppercase leading-[0.85] text-white mb-12">
                Let's Talk <br /> <span className="text-[#FF4D00]">Scale.</span>
              </h2>
              <p className="text-white/50 text-lg md:text-xl font-medium max-w-md leading-relaxed">
                Leave the generic platforms behind. Tell us about your vision, and we'll architect the infrastructure to match.
              </p>

              <div className="mt-16 md:mt-24">
                <p className="font-accent text-xs uppercase tracking-[0.2em] text-white/30 font-bold mb-4">Direct Line</p>
                <a href="mailto:hello@monolith.com" className="text-2xl md:text-3xl font-heading text-white hover:text-[#FF4D00] transition-colors tracking-tight">
                  hello@monolith.com
                </a>
              </div>
            </div>

            {/* Right Column: Brutalist Form */}
            <div className="flex-1 relative z-10 w-full max-w-xl lg:ml-auto flex flex-col justify-center pt-8 lg:pt-0">
              <form className="flex flex-col gap-12 md:gap-16">
                <div className="relative group">
                  <input type="text" id="name" required className="w-full bg-transparent border-b border-white/20 pb-4 text-white text-xl md:text-2xl font-medium focus:outline-none focus:border-white transition-colors peer placeholder-transparent" placeholder="Name" />
                  <label htmlFor="name" className="absolute left-0 top-0 text-white/40 text-xl md:text-2xl font-medium transition-all peer-focus:-translate-y-8 peer-focus:text-xs peer-focus:text-[#FF4D00] peer-focus:font-accent peer-focus:tracking-[0.2em] peer-focus:uppercase peer-valid:-translate-y-8 peer-valid:text-xs peer-valid:text-white/40 peer-valid:font-accent peer-valid:tracking-[0.2em] peer-valid:uppercase cursor-text">
                    Your Name
                  </label>
                </div>

                <div className="relative group">
                  <input type="email" id="email" required className="w-full bg-transparent border-b border-white/20 pb-4 text-white text-xl md:text-2xl font-medium focus:outline-none focus:border-white transition-colors peer placeholder-transparent" placeholder="Email" />
                  <label htmlFor="email" className="absolute left-0 top-0 text-white/40 text-xl md:text-2xl font-medium transition-all peer-focus:-translate-y-8 peer-focus:text-xs peer-focus:text-[#FF4D00] peer-focus:font-accent peer-focus:tracking-[0.2em] peer-focus:uppercase peer-valid:-translate-y-8 peer-valid:text-xs peer-valid:text-white/40 peer-valid:font-accent peer-valid:tracking-[0.2em] peer-valid:uppercase cursor-text">
                    Email Address
                  </label>
                </div>

                <div className="relative group">
                  <textarea id="message" required rows={2} className="w-full bg-transparent border-b border-white/20 pb-4 text-white text-xl md:text-2xl font-medium focus:outline-none focus:border-white transition-colors peer placeholder-transparent resize-none" placeholder="Message"></textarea>
                  <label htmlFor="message" className="absolute left-0 top-0 text-white/40 text-xl md:text-2xl font-medium transition-all peer-focus:-translate-y-8 peer-focus:text-xs peer-focus:text-[#FF4D00] peer-focus:font-accent peer-focus:tracking-[0.2em] peer-focus:uppercase peer-valid:-translate-y-8 peer-valid:text-xs peer-valid:text-white/40 peer-valid:font-accent peer-valid:tracking-[0.2em] peer-valid:uppercase cursor-text">
                    Project Details
                  </label>
                </div>

                <div className="pt-4">
                  <button type="button" className="group relative inline-flex items-center justify-center gap-6 bg-white text-black px-8 py-5 rounded-full overflow-hidden transition-all active:scale-95 cursor-pointer">
                    {/* Sweep Animation Background */}
                    <div className="absolute inset-0 bg-[#FF4D00] translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-0" />
                    
                    <span className="relative z-10 font-bold tracking-[0.1em] uppercase text-xs font-accent group-hover:text-white transition-colors duration-500">Send Inquiry</span>
                    <div className="relative z-10 w-10 h-10 bg-black rounded-full flex items-center justify-center group-hover:bg-white group-hover:-rotate-45 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                      <ArrowRight className="w-4 h-4 text-white group-hover:text-[#FF4D00] transition-colors duration-500" />
                    </div>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

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
                <li><Link href="#features" className="hover:text-accent transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-accent transition-colors">Pricing</Link></li>
                <li><TransitionLink href="/templates" className="hover:text-accent transition-colors">Templates</TransitionLink></li>
              </ul>
            </div>

            <div>
              <h4 className="font-accent font-bold uppercase tracking-widest text-xs text-primary mb-6">Company</h4>
              <ul className="space-y-4 text-sm font-medium text-secondary">
                <li><Link href="#about" className="hover:text-accent transition-colors">About Us</Link></li>
                <li><Link href="#contact" className="hover:text-accent transition-colors">Contact</Link></li>
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

      {needsNameSetup && <NameSetupModal initialName={`${user?.first_name || ''} ${user?.last_name !== '-' ? user?.last_name : ''}`.trim()} />}
    </main>
  );
}

const NormalCardFeaturesSection = () => {
  const features = [
    {
      title: "Headless Core.",
      desc: "Decouple your frontend from your backend. Enjoy millisecond query times powered by our global edge caching infrastructure.",
      icon: <Code2 className="w-7 h-7 text-white/70" />
    },
    {
      title: "Visual Canvas.",
      desc: "Experience true WYSIWYG editing. Drag, drop, and publish raw React components flawlessly without engineering help.",
      icon: <LayoutTemplate className="w-7 h-7 text-white/70" />
    },
    {
      title: "Edge Analytics.",
      desc: "Privacy-first, cookieless analytics and conversion heatmaps processed directly at the edge with zero performance impact.",
      icon: <BarChart3 className="w-7 h-7 text-white/70" />
    }
  ];

  return (
    <section id="features" className="py-32 relative z-20 overflow-hidden bg-[#F8F7F5] border-t border-black/5">

      {/* A real material surface instead of a drawn pattern - brushed plaster, close in tone to the page
          background, multiplied in so it reads as texture rather than a photo sitting on top. Fades out
          toward the bottom edge so it never competes with the sections below. */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1666013942481-f2810d442e45?q=80&w=2400&auto=format&fit=crop"
          alt=""
          className="w-full h-full object-cover mix-blend-multiply opacity-80"
          style={{
            WebkitMaskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
            maskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
          }}
        />
      </div>

      <div className="max-w-[1400px] mx-auto px-8 relative z-10">

        {/* Header */}
        <div className="text-center max-w-4xl mx-auto mb-20 md:mb-24">
          <h2 className="font-heading font-extrabold text-6xl md:text-8xl tracking-tight uppercase leading-[0.9] text-primary mb-8">
            The <span className="text-accent">Arsenal.</span>
          </h2>
          <p className="text-lg md:text-xl text-secondary font-medium leading-relaxed max-w-2xl mx-auto">
            A comprehensive suite of enterprise-grade tools built into a relentlessly simple interface.
          </p>
        </div>

        {/* Cards Grid - matte black panels, staggered rather than aligned, each carrying its own oversized
            ghost index number bleeding off the top edge. No shadow anywhere: depth comes from the stagger,
            the hairline border and the accent rule that draws in on hover, not from blur. */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {features.map((feat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
              className={`group relative bg-primary border border-white/10 hover:border-white/25 rounded-[40px] p-10 md:p-12 overflow-hidden transition-colors duration-500 ${
                i === 1 ? "md:mt-12" : i === 2 ? "md:mt-6" : ""
              }`}
            >
              <div className="absolute top-0 left-0 h-[2px] bg-accent w-0 group-hover:w-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />
              <span className="absolute top-1 right-5 font-heading font-black text-white/[0.06] group-hover:text-white/[0.1] transition-colors duration-500 text-[7rem] md:text-[8rem] leading-none select-none pointer-events-none">
                0{i + 1}
              </span>

              <div className="relative z-10">
                <div className="w-14 h-14 border border-white/15 group-hover:border-accent flex items-center justify-center mb-10 transition-colors duration-500">
                  {feat.icon}
                </div>
                <h3 className="font-heading font-extrabold text-3xl md:text-4xl tracking-tight uppercase text-white mb-5">
                  {feat.title}
                </h3>
                <p className="text-white/50 font-medium text-lg leading-relaxed group-hover:text-white/70 transition-colors duration-300">
                  {feat.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

const SpotlightAboutSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Motion values for instant position updates
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring animated radius for smooth opening/closing
  const radius = useSpring(0, { stiffness: 100, damping: 20, mass: 0.5 });

  const clipPath = useMotionTemplate`circle(${radius}px at ${mouseX}px ${mouseY}px)`;

  const globalMousePos = useRef({ x: 0, y: 0 });
  const isHovered = useRef(false);

  useEffect(() => {
    const updateMousePosition = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = globalMousePos.current.x - rect.left;
      const y = globalMousePos.current.y - rect.top;

      mouseX.set(x);
      mouseY.set(y);

      // Check if mouse is inside the element visually
      const inside =
        globalMousePos.current.x >= rect.left &&
        globalMousePos.current.x <= rect.right &&
        globalMousePos.current.y >= rect.top &&
        globalMousePos.current.y <= rect.bottom;

      if (inside && !isHovered.current) {
        isHovered.current = true;
        radius.set(350);
      } else if (!inside && isHovered.current) {
        isHovered.current = false;
        radius.set(0);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      globalMousePos.current = { x: e.clientX, y: e.clientY };
      updateMousePosition();
    };

    const handleScroll = () => {
      updateMousePosition();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [mouseX, mouseY, radius]);

  return (
    <section
      id="about"
      ref={containerRef}
      className="relative w-full h-[100vh] bg-[#F8F7F5] overflow-hidden flex items-center justify-center cursor-default border-t border-black/10"
    >
      {/* Background (Default Light State) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 z-0">
        <span className="font-accent tracking-[0.4em] uppercase text-xs font-bold text-accent mb-6 block">Our Mission</span>
        <h2 className="font-heading text-6xl md:text-[140px] tracking-tighter uppercase leading-[0.85] text-primary">
          We Build <br /> Empires.
        </h2>
        <p className="mt-8 text-xl md:text-2xl font-medium text-secondary max-w-2xl leading-relaxed">
          Monolith was forged to give ambitious brands the architectural firepower of the world&apos;s most elite digital agencies. Hover anywhere to reveal the truth.
        </p>
      </div>

      {/* The Masked Spotlight Overlay (Dark Reveal) */}
      <motion.div
        className="absolute inset-0 z-10 pointer-events-none overflow-hidden"
        style={{ clipPath }}
      >
        {/* Dark Background inside the spotlight */}
        <div className="absolute inset-0 bg-[#050505]" />

        {/* Subtle texture inside the spotlight */}
        <div className="absolute inset-0 bg-[url('/hero-sculpture.png')] bg-cover bg-center opacity-20 mix-blend-screen" />

        {/* Revealed Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
          <span className="font-accent tracking-[0.4em] uppercase text-xs font-bold text-[#FF4D00] mb-6 block">The Manifesto</span>
          <h2 className="font-heading text-6xl md:text-[140px] tracking-tighter uppercase leading-[0.85] text-white">
            We Defy <br /> The Ordinary.
          </h2>
          <p className="mt-8 text-xl md:text-2xl font-medium text-white/80 max-w-2xl leading-relaxed">
            Stop settling for generic templates. We provide the headless infrastructure and design system to run a platform that can&apos;t be ignored.
          </p>
        </div>
      </motion.div>
    </section>
  );
};
