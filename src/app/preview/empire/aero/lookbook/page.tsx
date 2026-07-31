"use client";

import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useMotionTemplate, animate, useInView, useMotionValueEvent } from 'framer-motion';
import { Inter, Space_Grotesk } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] });

const LOOKS = [
  {
    id: "01",
    title: "NEO TOKYO",
    subtitle: "URBAN EXPLORATION",
    desc: "A brutalist approach to modern streetwear. High contrast, sharp edges, and uncompromised form.",
    img: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=1600",
  },
  {
    id: "02",
    title: "BLANC",
    subtitle: "PURE AESTHETIC",
    desc: "Stripping away the unnecessary to reveal the raw beauty of structural design.",
    img: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=1600",
  },
  {
    id: "03",
    title: "VOID",
    subtitle: "DEEP SPACE",
    desc: "Embracing the darkness. Monolithic silhouettes designed for the shadows.",
    img: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&q=80&w=1600",
  },
  {
    id: "04",
    title: "KINETIC",
    subtitle: "MOVEMENT",
    desc: "Engineered for speed. Dynamic lines and lightweight materials for the avant-garde athlete.",
    img: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=1600",
  },
  {
    id: "05",
    title: "ORIGIN",
    subtitle: "THE BLUEPRINT",
    desc: "Where it all started. The signature Aero aesthetic that redefined the industry.",
    img: "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?auto=format&fit=crop&q=80&w=1600",
  }
];

const LookCard = ({ look, i, mouseX, mouseY }: { look: any, i: number, mouseX: any, mouseY: any }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  
  // Track scroll using an absolute marker instead of the sticky card
  // This allows us to perfectly scale out the card as the NEXT card scrolls over it
  const { scrollYProgress } = useScroll({
    target: markerRef,
    offset: ["start start", "end start"]
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.85]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.2]);
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "5%"]);

  // We need global scroll to compute absolute positions
  const { scrollY } = useScroll();

  const [markerDocY, setMarkerDocY] = useState(0);
  const [windowHeight, setWindowHeight] = useState(1000);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (markerRef.current) {
      setMarkerDocY(markerRef.current.getBoundingClientRect().top + window.scrollY);
    }
    setWindowHeight(window.innerHeight);
    
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // documentMouseY = scrollY + viewport mouseY
  const documentMouseY = useTransform(
    [mouseY, scrollY],
    ([mY, sY]) => (mY as number) + (sY as number)
  );

  // Check if the cursor is physically over THIS card's original document bounds
  useMotionValueEvent(documentMouseY, "change", (latest) => {
    if (markerDocY > 0) {
      const isOver = latest >= markerDocY && latest < markerDocY + windowHeight;
      setIsHovered(isOver);
    }
  });

  // Calculate where the cursor is relative to THIS card as it slides up
  const localY = useTransform(
    [mouseY, scrollY],
    ([mY, sY]) => {
      // The card's top edge in the viewport
      const cardViewportY = Math.max(0, markerDocY - (sY as number));
      return (mY as number) - cardViewportY;
    }
  );

  const maskSize = useMotionValue(0);

  useEffect(() => {
    if (isHovered) {
      // Pop open the spotlight
      animate(maskSize, typeof window !== 'undefined' && window.innerWidth < 768 ? 250 : 400, { type: "spring", stiffness: 60, damping: 20 });
    } else {
      animate(maskSize, 0, { type: "spring", stiffness: 60, damping: 20 });
    }
  }, [isHovered, maskSize]);

  // Use localY for perfect alignment even while the card is scrolling!
  const clipPath = useMotionTemplate`circle(${maskSize}px at ${mouseX}px ${localY}px)`;

  return (
    <>
      {/* Invisible marker scrolling normally in the flow to track real position */}
      <div ref={markerRef} className="absolute w-full h-screen pointer-events-none" style={{ top: `${i * 100}vh`, zIndex: -1 }} />

      <div 
        className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden bg-[#050505]"
        style={{ zIndex: i }}
      >
        <motion.div 
          ref={cardRef}
          style={{ scale, opacity, y }}
          className="relative w-full h-full origin-top"
        >
        {/* Base Layer: Grayscale & Dimmed */}
        <div className="absolute inset-0 w-full h-full bg-[#050505]">
          <img src={look.img} alt={look.title} className="w-full h-full object-cover grayscale opacity-25" />
        </div>

        {/* Base Typography (Always visible, muted) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <h2 className={`text-[15vw] md:text-[18vw] font-bold uppercase tracking-tighter leading-none text-white/5 ${spaceGrotesk.className}`}>
            {look.title}
          </h2>
        </div>

        {/* Mask Reveal Layer: Full Color, Scaled, Vivid Typography */}
        <motion.div 
          className="absolute inset-0 w-full h-full z-20 pointer-events-none"
          style={{ clipPath }}
        >
          <img src={look.img} alt={look.title} className="w-full h-full object-cover scale-110" />
          
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20">
            <h2 className={`text-[15vw] md:text-[18vw] font-bold uppercase tracking-tighter leading-none text-white ${spaceGrotesk.className}`}>
              {look.title}
            </h2>
          </div>
        </motion.div>

        {/* Foreground Content */}
        <div className="absolute bottom-12 left-6 md:bottom-24 md:left-24 max-w-md pointer-events-none z-30">
          <div className="overflow-hidden mb-4">
            <motion.span 
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: false, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className={`block text-[10px] md:text-xs uppercase tracking-[0.4em] text-white font-bold bg-white/10 backdrop-blur-md px-4 py-2 inline-block rounded-full border border-white/10 ${inter.className}`}
            >
              LOOK // {look.id}
            </motion.span>
          </div>
          <div className="overflow-hidden mb-2">
            <motion.h3
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: false, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className={`text-2xl md:text-3xl font-bold uppercase tracking-tighter text-white ${spaceGrotesk.className}`}
            >
              {look.subtitle}
            </motion.h3>
          </div>
          <div className="overflow-hidden">
            <motion.p
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: false, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className={`text-xs md:text-sm text-white/70 font-medium leading-relaxed max-w-xs ${inter.className}`}
            >
              {look.desc}
            </motion.p>
          </div>
        </div>

        {/* Discover Button */}
        <div className="absolute bottom-12 right-6 md:bottom-24 md:right-24 z-30">
           <motion.a 
             href="/preview/empire/aero/products"
             initial={{ scale: 0, opacity: 0 }}
             whileInView={{ scale: 1, opacity: 1 }}
             viewport={{ once: false }}
             transition={{ duration: 0.6, delay: 0.5, type: "spring" }}
             className="w-16 h-16 md:w-24 md:h-24 rounded-full border border-white/30 flex items-center justify-center group/btn hover:bg-white hover:text-black transition-colors duration-500 cursor-pointer pointer-events-auto backdrop-blur-sm bg-black/20"
           >
             <span className={`text-[9px] md:text-xs font-bold uppercase tracking-widest ${inter.className}`}>Shop</span>
           </motion.a>
        </div>

      </motion.div>
    </div>
    </>
  );
};

export default function AeroLookbookPage() {
  const globalMouseX = useMotionValue(typeof window !== 'undefined' ? window.innerWidth / 2 : 500);
  const globalMouseY = useMotionValue(typeof window !== 'undefined' ? window.innerHeight / 2 : 500);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      globalMouseX.set(e.clientX);
      globalMouseY.set(e.clientY);
    };

    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, [globalMouseX, globalMouseY]);

  return (
    <div className="bg-[#050505] text-white selection:bg-white selection:text-black">
      {/* Intro Section */}
      <section className="h-[80vh] flex flex-col items-center justify-center relative overflow-hidden pt-32">
        <motion.h1 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className={`text-6xl md:text-[140px] font-bold tracking-tighter uppercase text-white ${spaceGrotesk.className}`}
        >
          Lookbook
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className={`text-sm md:text-base mt-8 text-white/60 max-w-xl text-center ${inter.className}`}
        >
          A visual exploration of form and environment. Scroll to explore the archive. Hover to reveal the hidden dimension.
        </motion.p>
      </section>

      {/* Stacking Cards */}
      <div className="relative pb-[10vh]">
        {LOOKS.map((look, i) => (
          <LookCard key={look.id} look={look} i={i} mouseX={globalMouseX} mouseY={globalMouseY} />
        ))}
      </div>

      {/* Outro Section */}
      <section className="h-screen bg-white text-black flex items-center justify-center relative overflow-hidden z-50">
        <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/7/76/1k_Dissolve_Noise_Texture.png')] opacity-[0.04] bg-repeat mix-blend-multiply pointer-events-none" />
        <div className="text-center z-10 flex flex-col items-center gap-8">
          <h2 className={`text-6xl md:text-[120px] font-bold tracking-tighter uppercase leading-[0.8] ${spaceGrotesk.className}`}>
            End of<br/>
            <span className="italic font-light text-black/40">Archive.</span>
          </h2>
          <a href="/preview/empire/aero/products" className={`group relative inline-flex px-8 py-4 items-center justify-center gap-4 text-xs font-bold uppercase tracking-[0.3em] overflow-hidden mt-8 border border-black rounded-full cursor-pointer ${inter.className}`}>
            <span className="relative z-10 group-hover:text-white transition-colors duration-500">Shop Collection</span>
            <div className="absolute inset-0 h-full w-full bg-black translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-0 rounded-full" />
          </a>
        </div>
      </section>
    </div>
  );
}
