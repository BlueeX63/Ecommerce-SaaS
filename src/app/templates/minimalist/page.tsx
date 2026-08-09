"use client";

import Link from "next/link";
import { ArrowRight, Plus, PackageOpen } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useCart, ALL_PRODUCTS } from "./CartContext";

export default function StarterTemplateHome({ initialCustomData, initialProducts }: { initialCustomData?: any, initialProducts?: any[] }) {
  const { items, addToCart, currencySymbol, toggleWishlist, isInWishlist, basePath } = useCart();
  const [customData, setCustomData] = useState<any>(initialCustomData || null);

  useEffect(() => {
    if (window.parent && window.parent !== window) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === "MONOLITH_CUSTOMIZATION") {
          setCustomData(event.data.data);
        }
      };
      window.addEventListener("message", handleMessage);
      window.parent.postMessage({ type: "MONOLITH_REQUEST_STATE" }, "*");
      return () => window.removeEventListener("message", handleMessage);
    }
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
            href={`${basePath}/products`}
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
            <h2 className="font-heading text-4xl tracking-tighter text-[#111111]">{customData?.formData?.featuredTitle || "New Arrivals"}</h2>
            <Link href={`${basePath}/products`} className="text-xs font-bold uppercase tracking-widest text-[#111111] hover:text-[#FF4D00] transition-colors">
              View all
            </Link>
          </div>

          {initialProducts && initialProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-[#F8F7F5] rounded-xl border border-black/5">
              <PackageOpen className="w-12 h-12 text-black/20 mb-4" />
              <p className="text-lg font-medium text-black/60">No products available yet.</p>
              <p className="text-sm text-black/40">Check back later for new arrivals.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
              {(initialProducts || ALL_PRODUCTS).slice(0, 4).map((product, i) => {
                const mappedProduct = {
                  id: product.product_id || product.id,
                  name: product.product_name || product.name,
                  price: product.base_price || product.price,
                  image: product.product_images?.[0]?.image_url || product.three_d_model_url || product.image || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=2000&auto=format&fit=crop",
                  category: product.categories?.category_name || product.category || "Uncategorized"
                };

                return (
                  <motion.div 
                    key={mappedProduct.id}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Link href={`${basePath}/products/${mappedProduct.id}`} className="group flex flex-col">
                      <div className="aspect-[3/4] bg-[#F8F7F5] mb-6 relative overflow-hidden rounded-sm">
                        <img 
                          src={mappedProduct.image} 
                          alt={mappedProduct.name}
                          className="absolute inset-0 w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-700 ease-[0.16,1,0.3,1]"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
                        
                        {/* Add to cart overlay button */}
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            addToCart(mappedProduct);
                          }}
                          className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm text-[#111111] py-3 text-xs font-bold uppercase tracking-widest translate-y-[150%] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2 hover:bg-[#FF4D00] hover:text-white"
                        >
                          Add to Cart <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-sm text-[#111111] mb-1 group-hover:text-[#FF4D00] transition-colors">{mappedProduct.name}</h3>
                          <p className="text-xs text-black/50 font-medium">{mappedProduct.category}</p>
                        </div>
                        <p className="text-sm font-medium text-[#111111]">{currencySymbol}{Number(mappedProduct.price).toFixed(2)}</p>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
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
