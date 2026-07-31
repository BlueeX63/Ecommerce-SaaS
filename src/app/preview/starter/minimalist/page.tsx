"use client";

import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useCart } from "./CartContext";

const FEATURED_PRODUCTS = [
  { id: "1", name: "The Perfect Tee", price: 35.00, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=2000&auto=format&fit=crop", category: "Tops" },
  { id: "2", name: "Everyday Denim", price: 98.00, image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=2000&auto=format&fit=crop", category: "Bottoms" },
  { id: "3", name: "Minimalist Watch", price: 145.00, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=2000&auto=format&fit=crop", category: "Accessories" },
  { id: "4", name: "Leather Tote", price: 210.00, image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=2000&auto=format&fit=crop", category: "Bags" }
];

export default function StarterTemplateHome() {
  const { addToCart, currencySymbol } = useCart();
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

  const tHeroTitle = customData?.formData?.heroTitle || "Simplicity is the ultimate sophistication.";
  const tTagline = customData?.formData?.tagline || "Curated everyday essentials built to last. No logos, no fuss, just quality materials and timeless design.";
  const tCta = customData?.formData?.primaryCta || "Shop Collection";
  const tAboutTitle = customData?.formData?.aboutTitle || "Built for everyday life.";
  const tAboutDescription = customData?.formData?.aboutDescription || "We believe in buying less but better. Our products are designed in-house and manufactured using sustainable practices to ensure they stand the test of time. No fast fashion, just enduring style.";

  return (
    <>
      {/* Hero Section */}
      <section className="px-6 py-24 md:py-40 max-w-7xl mx-auto flex flex-col items-center text-center relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10"
        >
          <h1 className="font-heading text-5xl md:text-[80px] lg:text-[100px] mb-8 max-w-4xl leading-[0.9] tracking-tighter uppercase text-[#111111]">
            {tHeroTitle}
          </h1>
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg md:text-xl text-black/60 mb-12 max-w-xl font-medium leading-relaxed relative z-10"
        >
          {tTagline}
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10"
        >
          <Link 
            href="/preview/starter/minimalist/products"
            className="bg-[#111111] text-white px-10 py-5 rounded-full text-xs font-bold tracking-widest uppercase hover:bg-[#FF4D00] hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 flex items-center gap-3 group"
          >
            {tCta} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </section>

      {/* Featured Products */}
      <section className="px-6 py-24 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-16 border-b border-black/5 pb-6">
            <h2 className="font-heading text-4xl tracking-tighter text-[#111111]">New Arrivals</h2>
            <Link href="/preview/starter/minimalist/products" className="text-xs font-bold uppercase tracking-widest text-[#111111] hover:text-[#FF4D00] transition-colors">
              View all
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
            {FEATURED_PRODUCTS.map((product, i) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link href={`/preview/starter/minimalist/products/${product.id}`} className="group flex flex-col">
                  <div className="aspect-[3/4] bg-[#F8F7F5] mb-6 relative overflow-hidden rounded-sm">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-700 ease-[0.16,1,0.3,1]"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
                    
                    {/* Add to cart overlay button */}
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm text-[#111111] py-3 text-xs font-bold uppercase tracking-widest translate-y-[150%] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2 hover:bg-[#FF4D00] hover:text-white"
                    >
                      Add to Cart <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-sm text-[#111111] mb-1 group-hover:text-[#FF4D00] transition-colors">{product.name}</h3>
                      <p className="text-xs text-black/50 font-medium">{product.category}</p>
                    </div>
                    <p className="text-sm font-medium text-[#111111]">{currencySymbol}{product.price.toFixed(2)}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Prop */}
      <section className="px-6 py-32 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="font-heading text-4xl md:text-6xl mb-8 tracking-tighter text-[#111111]">{tAboutTitle}</h2>
          <p className="text-lg md:text-xl text-black/60 leading-relaxed max-w-2xl mx-auto">
            {tAboutDescription}
          </p>
        </motion.div>
      </section>
    </>
  );
}
