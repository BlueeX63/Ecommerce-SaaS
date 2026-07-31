"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { QUANTUM_PRODUCTS, useQuantum } from "./QuantumContext";

// Component for a magnetic button effect
function MagneticButton({ children, className, onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent<HTMLButtonElement>) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current!.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.1, y: middleY * 0.1 });
  };

  const reset = () => setPosition({ x: 0, y: 0 });

  const { x, y } = position;
  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x, y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}

// Split text for word-by-word animation
const AnimatedText = ({ text, className }: { text: string, className?: string }) => {
  const words = text.split(" ");
  return (
    <div className={`overflow-hidden flex flex-wrap ${className}`}>
      {words.map((word, index) => (
        <motion.span
          key={index}
          className="inline-block mr-[0.25em]"
          variants={{
            hidden: { y: "120%", opacity: 0, rotateZ: 5 },
            visible: { y: 0, opacity: 1, rotateZ: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
          }}
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
};

export default function QuantumHome() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useQuantum();
  const { scrollYProgress } = useScroll({ target: containerRef });
  
  // Smooth scroll progress
  const smoothProgress = useSpring(scrollYProgress, { damping: 20, stiffness: 100, mass: 0.2 });
  
  // Parallax transforms
  const yHeroText = useTransform(smoothProgress, [0, 1], [0, 400]);
  const yHeroImage = useTransform(smoothProgress, [0, 1], [0, 150]);
  const opacityHero = useTransform(smoothProgress, [0, 0.2], [1, 0]);

  return (
    <div ref={containerRef} className="bg-[#F9F9FB] min-h-[300vh]">
      {/* Scroll Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-[#111111] origin-left z-[100]"
        style={{ scaleX: smoothProgress }}
      />

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden px-6 pt-20">
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-30 pointer-events-none">
          <motion.div 
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-[800px] h-[800px] bg-gradient-to-tr from-gray-300 via-gray-200 to-gray-100 rounded-full blur-3xl mix-blend-multiply"
          />
        </div>

        <motion.div 
          style={{ y: yHeroText, opacity: opacityHero }}
          className="relative z-10 w-full max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-12"
        >
          <div className="w-full md:w-1/2 flex flex-col items-start z-20">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.05, delayChildren: 0.2 } } }}
            >
              <div className="text-sm font-bold uppercase tracking-[0.3em] text-[#111111] mb-6 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Welcome to Quantum
              </div>
              
              <h1 className="font-playfair text-6xl md:text-8xl lg:text-[120px] leading-[0.9] font-bold text-[#121212] mb-8 tracking-tighter">
                <AnimatedText text="Future" />
                <AnimatedText text="Living" className="text-[#111111] italic pr-4" />
                <AnimatedText text="Objects." />
              </h1>
              
              <motion.p 
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 1, delay: 0.8, ease: "easeOut" } }
                }}
                className="font-inter text-gray-500 max-w-md text-lg leading-relaxed mb-10"
              >
                Discover our curated collection of avant-garde conceptual art and functional masterpieces that transcend ordinary space.
              </motion.p>
              
              <motion.div
                variants={{
                  hidden: { opacity: 0, scale: 0.8 },
                  visible: { opacity: 1, scale: 1, transition: { duration: 0.8, delay: 1, type: "spring" } }
                }}
              >
                <Link href="/preview/growth/quantum/products">
                  <MagneticButton className="group relative overflow-hidden rounded-full bg-[#121212] px-8 py-4 text-white transition-all hover:bg-[#111111] hover:shadow-[0_0_40px_rgba(17,17,17,0.3)]">
                    <span className="relative z-10 flex items-center gap-2 font-bold uppercase tracking-wider text-sm font-inter">
                      Explore Collection <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </MagneticButton>
                </Link>
              </motion.div>
            </motion.div>
          </div>

          <motion.div 
            style={{ y: yHeroImage }}
            initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full md:w-1/2 relative h-[50vh] md:h-[80vh] rounded-[2rem] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
            <img 
              src="https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2000&auto=format&fit=crop" 
              alt="Avant-garde interior"
              className="w-full h-full object-cover relative z-10"
            />
            {/* Glass overlay card */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 1.2 }}
              className="absolute bottom-8 left-8 right-8 md:right-auto md:w-80 bg-white/30 backdrop-blur-md border border-white/40 p-6 rounded-2xl shadow-xl z-20"
            >
              <h3 className="font-playfair font-bold text-xl mb-1 text-[#121212]">Quantum Ethos</h3>
              <p className="font-inter text-sm text-[#121212]/80">Where form breaks boundaries and function becomes fluid.</p>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Marquee Divider */}
      <div className="w-full overflow-hidden bg-[#111111] py-4 transform -skew-y-2 relative z-20">
        <motion.div 
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="flex whitespace-nowrap"
        >
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center text-white font-playfair font-bold text-xl uppercase tracking-widest px-8">
              <span>Limitless Design</span>
              <span className="mx-8 opacity-50">•</span>
              <span>Conceptual Art</span>
              <span className="mx-8 opacity-50">•</span>
              <span>Avant-Garde</span>
              <span className="mx-8 opacity-50">•</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Featured Products */}
      <section className="py-32 px-6 max-w-[1600px] mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="text-sm font-bold uppercase tracking-[0.3em] text-[#111111] mb-4"
            >
              Curated Selection
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.1 }}
              className="font-playfair text-4xl md:text-6xl font-bold text-[#121212]"
            >
              Masterpieces.
            </motion.h2>
          </div>
          <Link href="/preview/growth/quantum/products">
            <MagneticButton className="px-6 py-3 border border-gray-200 rounded-full font-inter font-medium hover:bg-gray-50 transition-colors">
              View Entire Collection
            </MagneticButton>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
          {QUANTUM_PRODUCTS.slice(0, 4).map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: (idx % 2) * 0.2, ease: [0.16, 1, 0.3, 1] }}
              className={`group relative ${idx % 2 === 1 ? 'md:mt-32' : ''}`}
            >
              <Link href={`/preview/growth/quantum/products/${product.id}`} className="block">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-gray-100 mb-6">
                  {product.isNew && (
                    <div className="absolute top-6 left-6 z-20 bg-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm font-inter">
                      New
                    </div>
                  )}
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  {/* Liquid Hover Overlay */}
                  <div className="absolute inset-0 bg-[#111111]/0 group-hover:bg-[#111111]/20 backdrop-blur-[0px] group-hover:backdrop-blur-[2px] transition-all duration-700 pointer-events-none" />
                  
                  {/* Hover Add to Cart Button */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 z-30 scale-90 group-hover:scale-100">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        addToCart(product);
                      }}
                      className="bg-white text-[#121212] hover:bg-[#111111] hover:text-white px-6 py-3 rounded-full font-bold font-inter transition-colors shadow-xl"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </Link>
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-playfair text-2xl font-bold text-[#121212] group-hover:text-[#111111] transition-colors">
                    {product.name}
                  </h3>
                  <span className="font-inter font-medium text-lg">${product.price.toFixed(2)}</span>
                </div>
                <p className="font-inter text-gray-500">{product.category}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Concept Section */}
      <section className="py-32 bg-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-[600px] h-[600px] bg-gradient-to-bl from-gray-200 to-transparent blur-3xl opacity-50 -z-10" />
        <div className="max-w-[1600px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="aspect-square rounded-full overflow-hidden bg-gray-100 relative"
          >
            <img 
              src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2000&auto=format&fit=crop" 
              alt="Concept"
              className="w-full h-full object-cover"
            />
          </motion.div>
          
          <div className="max-w-xl">
            <motion.h2 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="font-playfair text-4xl md:text-6xl font-bold mb-8 leading-tight"
            >
              Redefining the <span className="text-[#111111] italic">boundaries</span> of design.
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="font-inter text-gray-500 text-lg leading-relaxed mb-10"
            >
              Our philosophy transcends traditional utility. We build artifacts that challenge perception, playing with light, gravity, and sound to create an immersive environmental experience.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <Link href="/preview/growth/quantum/about" className="inline-flex items-center gap-2 font-playfair font-bold uppercase tracking-wider text-sm border-b-2 border-[#121212] pb-1 hover:border-[#111111] hover:text-[#111111] transition-colors">
                Read our Manifesto <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
