"use client";

import { motion } from "framer-motion";
import { Plus, Heart, PackageOpen } from "lucide-react";
import { useCart, ALL_PRODUCTS } from "../CartContext";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function StarterProductsPage({ initialProducts }: { initialProducts?: any[] }) {
  const { addToCart, searchQuery, currencySymbol, toggleWishlist, isInWishlist, basePath } = useCart();
  const [activeCategory, setActiveCategory] = useState("All");
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

  const productSource = (initialProducts || ALL_PRODUCTS).map(p => ({
    id: p.product_id || p.id,
    name: p.product_name || p.name,
    price: Number(p.base_price || p.price),
    image: p.product_images?.[0]?.image_url || p.three_d_model_url || p.image || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=2000&auto=format&fit=crop",
    category: p.categories?.category_name || p.category || "Uncategorized"
  }));

  const filteredProducts = productSource.filter(p => {
    const matchesCategory = activeCategory === "All" || p.category === activeCategory;
    const matchesSearch = searchQuery.trim() === "" || 
                          p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const tTitle = customData?.formData?.shopTitle || "Collection";
  const tDescription = customData?.formData?.shopDescription || "Explore our full range of minimalist essentials. Carefully designed for longevity and timeless style.";
  const rawCategories = customData?.formData?.shopCategories || "All, Tops, Bottoms, Accessories, Bags, Shoes";
  const tCategories = rawCategories.split(",").map((c: string) => c.trim()).filter(Boolean);

  return (
    <div className="px-6 py-16 md:py-24 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 border-b border-black/5 pb-8">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-heading text-4xl md:text-5xl tracking-tighter text-[#111111] mb-4"
          >
            {tTitle}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-black/50 text-sm max-w-md"
          >
            {tDescription}
          </motion.p>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-2 md:gap-4"
        >
          {tCategories.map((cat: string) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full transition-all ${
                activeCategory === cat 
                  ? "bg-[#111111] text-white" 
                  : "bg-black/5 text-[#111111] hover:bg-black/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>
      </div>

      {initialProducts && initialProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-[#F8F7F5] rounded-xl border border-black/5">
          <PackageOpen className="w-16 h-16 text-black/20 mb-4" />
          <p className="text-xl font-medium text-black/60">Your catalog is empty.</p>
          <p className="text-sm text-black/40 mt-2">Products you add will appear here.</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-[#F8F7F5] rounded-xl border border-black/5">
          <p className="text-lg font-medium text-black/60">No products match your search.</p>
          <button onClick={() => setActiveCategory("All")} className="mt-4 text-xs font-bold uppercase tracking-widest text-[#111111] hover:text-[#FF4D00]">Clear Filters</button>
        </div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16"
        >
          {filteredProducts.map((product, i) => (
            <motion.div 
              layout
              key={product.id} 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            >
              <Link href={`${basePath}/products/${product.id}`} className="group flex flex-col">
                <div className="aspect-[3/4] bg-[#F8F7F5] mb-6 relative overflow-hidden rounded-sm">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="absolute inset-0 w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-700 ease-[0.16,1,0.3,1]"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
                  
                  {/* Add to cart overlay button */}
                  <div className="absolute bottom-4 left-4 right-4 flex gap-2 translate-y-[150%] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addToCart(product as any);
                      }}
                      className="flex-1 bg-white/90 backdrop-blur-sm text-[#111111] py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#FF4D00] hover:text-white transition-colors"
                    >
                      Add to Cart <Plus className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleWishlist(product as any);
                      }}
                      className="w-12 flex items-center justify-center bg-white/90 backdrop-blur-sm text-[#111111] hover:bg-[#FF4D00] hover:text-white transition-colors"
                    >
                      <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-sm text-[#111111] mb-1">{product.name}</h3>
                    <p className="text-xs text-black/50 font-medium">{product.category}</p>
                  </div>
                  <p className="text-sm font-medium text-[#111111]">{currencySymbol}{product.price.toFixed(2)}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
