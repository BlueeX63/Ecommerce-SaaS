"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ALL_PRODUCTS, useCart } from "../CartContext";
import { useMemo, useState } from "react";
import { ProductToolbar, ResultsNote, useProductBrowser, LIGHT_TOOLBAR, DARK_TOOLBAR, type ToolbarTheme } from "@/components/storefront/ProductToolbar";
import { Heart } from "lucide-react";
import { useCustomization } from "@/hooks/useCustomization";

export default function ({ initialProducts, initialCustomData }: any) {
  const { basePath, currencySymbol  } = useCart();
  const { addToCart, searchQuery, toggleWishlist, isInWishlist } = useCart();
  const [activeCategory, setActiveCategory] = useState<string>("All");
  
  const source = useMemo(() => initialProducts || ALL_PRODUCTS, [initialProducts]);
  const browser = useProductBrowser(source, { query: searchQuery, category: activeCategory });
  const filteredProducts = browser.results;
  const toolbarTheme: ToolbarTheme = {
    text: "text-[#4A3F35]",
    muted: "text-[#4A3F35]/60",
    border: "border-[#4A3F35]/25",
    panel: "bg-[#F3EDE2] border-[#4A3F35]/15 shadow-xl text-[#4A3F35]",
    primary: "bg-[#4A3F35] text-[#F3EDE2]",
    input: "bg-white/70 border-[#4A3F35]/25 text-[#4A3F35] placeholder:text-[#4A3F35]/35",
    radius: "rounded-none",
  };
  const customData = useCustomization(initialCustomData);
  
  const shopTitle = customData?.formData?.shopTitle || "The Collection";
  const rawCategories = customData?.formData?.shopCategories || "All, Ceramics, Textiles, Glassware, Furniture";
  const tCategories = rawCategories.split(",").map((c: string) => c.trim()).filter(Boolean);

  return (
    <div className="w-full bg-[#F3EDE2] min-h-screen pt-12 pb-32 px-6 md:px-12">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Page Header */}
        <div className="mb-20 text-center flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#A69684] mb-6"
          >
            Collection
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-serif text-4xl md:text-6xl text-[#4A3F35]"
          >
            {shopTitle}
          </motion.h1>
          {searchQuery && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 text-sm text-[#4A3F35]/60 italic font-serif"
            >
              Showing results for "{searchQuery}"
            </motion.div>
          )}
        </div>

        {/* Filters & Sorting */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 border-b border-[#4A3F35]/10 pb-6 gap-6">
          <div className="flex flex-wrap gap-8 text-[10px] uppercase tracking-[0.2em] font-medium">
            {tCategories.map((cat: string) => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)} 
                className={`${activeCategory === cat ? "text-[#4A3F35] border-b border-[#4A3F35] pb-1" : "text-[#4A3F35]/60 hover:text-[#4A3F35] transition-colors"}`}
              >
                {cat}
              </button>
            ))}
          </div>
          <ProductToolbar browser={browser} theme={toolbarTheme} symbol={currencySymbol} />
        </div>

        <div className="-mt-6 mb-10">
          <ResultsNote browser={browser} total={source.length} theme={toolbarTheme} />
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
            {filteredProducts.map((product: any, idx: number) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: idx * 0.05 }}
                className="group cursor-pointer"
              >
                <Link href={`${basePath}/products/${product.id}`}>
                  <div className="relative aspect-[3/4] mb-6 overflow-hidden bg-[#E3D8C8]">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
                    {product.stockStatus === "out_of_stock" && <span className="absolute left-3 top-3 z-10 bg-black/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white">Sold out</span>}
                    
                    {/* Hover Add to Cart Button */}
                    <div className="absolute bottom-0 left-0 w-full p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.16,1,0.3,1] flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          addToCart(product);
                        }}
                        disabled={product.stockStatus === "out_of_stock"}
                        className="flex-1 py-4 disabled:cursor-not-allowed disabled:opacity-50 bg-[#F3EDE2]/90 backdrop-blur-md text-[#4A3F35] text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#4A3F35] hover:text-[#F3EDE2] transition-colors"
                      >
                        Add to Cart
                      </button>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          toggleWishlist(product);
                        }}
                        className="w-12 flex items-center justify-center bg-[#F3EDE2]/90 backdrop-blur-md text-[#4A3F35] hover:bg-[#4A3F35] hover:text-[#F3EDE2] transition-colors"
                      >
                        <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                </Link>
                <div className="flex flex-col gap-1 text-center">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[#A69684]">{product.category}</div>
                  <h3 className="font-serif text-lg text-[#4A3F35]">{product.name}</h3>
                  <div className="text-sm text-[#4A3F35]/70">{currencySymbol}{product.price.toFixed(2)}</div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-32 text-center">
            <h2 className="font-serif text-2xl text-[#4A3F35] mb-4">No products found.</h2>
            <p className="text-[#4A3F35]/60">Check the spelling, or try a broader search or fewer filters.</p>
            <button onClick={() => { setActiveCategory("All"); browser.reset(); }} className="mt-6 border-b border-[#4A3F35] pb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#4A3F35]">Clear filters</button>
          </div>
        )}
      </div>
    </div>
  );
}
