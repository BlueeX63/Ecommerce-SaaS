"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ALL_PRODUCTS, useCart } from "../CartContext";
import { useState } from "react";
import { Heart } from "lucide-react";

export default function EssenceProductsPage() {
  const { addToCart, searchQuery, toggleWishlist, isInWishlist } = useCart();
  const [activeCategory, setActiveCategory] = useState<string>("All");
  
  const filteredProducts = ALL_PRODUCTS.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || product.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

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
            All Products
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

        {/* Filters & Sorting (Dummy) */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 border-b border-[#4A3F35]/10 pb-6 gap-6">
          <div className="flex gap-8 text-[10px] uppercase tracking-[0.2em] font-medium">
            <button 
              onClick={() => setActiveCategory("All")} 
              className={`${activeCategory === "All" ? "text-[#4A3F35] border-b border-[#4A3F35] pb-1" : "text-[#4A3F35]/60 hover:text-[#4A3F35] transition-colors"}`}
            >
              All
            </button>
            <button 
              onClick={() => setActiveCategory("Decor")}
              className={`${activeCategory === "Decor" ? "text-[#4A3F35] border-b border-[#4A3F35] pb-1" : "text-[#4A3F35]/60 hover:text-[#4A3F35] transition-colors"}`}
            >
              Decor
            </button>
            <button 
              onClick={() => setActiveCategory("Furniture")}
              className={`${activeCategory === "Furniture" ? "text-[#4A3F35] border-b border-[#4A3F35] pb-1" : "text-[#4A3F35]/60 hover:text-[#4A3F35] transition-colors"}`}
            >
              Furniture
            </button>
            <button 
              onClick={() => setActiveCategory("Textiles")}
              className={`${activeCategory === "Textiles" ? "text-[#4A3F35] border-b border-[#4A3F35] pb-1" : "text-[#4A3F35]/60 hover:text-[#4A3F35] transition-colors"}`}
            >
              Textiles
            </button>
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#4A3F35]/60 font-medium flex items-center gap-2">
            Sort by: <span className="text-[#4A3F35] cursor-pointer">Featured</span>
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
            {filteredProducts.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: idx * 0.05 }}
                className="group cursor-pointer"
              >
                <Link href={`/preview/starter/essence/products/${product.id}`}>
                  <div className="relative aspect-[3/4] mb-6 overflow-hidden bg-[#E3D8C8]">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
                    
                    {/* Hover Add to Cart Button */}
                    <div className="absolute bottom-0 left-0 w-full p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.16,1,0.3,1] flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          addToCart(product);
                        }}
                        className="flex-1 py-4 bg-[#F3EDE2]/90 backdrop-blur-md text-[#4A3F35] text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#4A3F35] hover:text-[#F3EDE2] transition-colors"
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
                  <div className="text-sm text-[#4A3F35]/70">${product.price.toFixed(2)}</div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-32 text-center">
            <h2 className="font-serif text-2xl text-[#4A3F35] mb-4">No products found.</h2>
            <p className="text-[#4A3F35]/60">Try adjusting your search query.</p>
          </div>
        )}
      </div>
    </div>
  );
}
