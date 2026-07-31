"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Heart, ChevronDown, Filter } from "lucide-react";
import { QUANTUM_PRODUCTS, useQuantum } from "../QuantumContext";

export default function QuantumProductsPage() {
  const { addToCart, wishlist, toggleWishlist } = useQuantum();
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("featured");
  const [isSortOpen, setIsSortOpen] = useState(false);

  const categories = ["All", ...Array.from(new Set(QUANTUM_PRODUCTS.map(p => p.category)))];

  const filteredProducts = useMemo(() => {
    let result = [...QUANTUM_PRODUCTS];
    
    if (activeCategory !== "All") {
      result = result.filter(p => p.category === activeCategory);
    }
    
    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        result.sort((a, b) => (a.isNew === b.isNew ? 0 : a.isNew ? -1 : 1));
        break;
      default:
        break;
    }
    
    return result;
  }, [activeCategory, sortBy]);

  return (
    <div className="min-h-screen bg-[#F9F9FB] pt-32 pb-24 px-6 md:px-12">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-playfair text-5xl md:text-7xl font-bold text-[#121212] mb-4"
            >
              The Collection
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-inter text-gray-500 max-w-md"
            >
              Explore our complete range of conceptual artifacts designed for the modern living space.
            </motion.p>
          </div>

          <div className="flex items-center gap-6 w-full md:w-auto">
            {/* Custom Sort Dropdown */}
            <div className="relative z-40 w-full md:w-48">
              <button 
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="w-full flex items-center justify-between px-6 py-3 bg-white border border-gray-200 rounded-full font-inter text-sm font-medium hover:border-gray-300 transition-colors"
              >
                <span>
                  {sortBy === "featured" && "Featured"}
                  {sortBy === "price-low" && "Price: Low to High"}
                  {sortBy === "price-high" && "Price: High to Low"}
                  {sortBy === "newest" && "Newest Arrivals"}
                </span>
                <motion.div animate={{ rotate: isSortOpen ? 180 : 0 }}>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {isSortOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white/80 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-xl overflow-hidden"
                  >
                    {[
                      { id: "featured", label: "Featured" },
                      { id: "newest", label: "Newest Arrivals" },
                      { id: "price-low", label: "Price: Low to High" },
                      { id: "price-high", label: "Price: High to Low" }
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setSortBy(option.id);
                          setIsSortOpen(false);
                        }}
                        className={`w-full text-left px-6 py-3 font-inter text-sm transition-colors ${sortBy === option.id ? 'bg-[#111111]/10 text-[#111111] font-bold' : 'hover:bg-gray-50 text-gray-600'}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar Filters */}
          <div className="w-full lg:w-64 shrink-0">
            <div className="sticky top-32">
              <h3 className="font-playfair font-bold text-lg mb-6 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Categories
              </h3>
              <div className="flex flex-col gap-2">
                {categories.map((category, idx) => (
                  <motion.button
                    key={category}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => setActiveCategory(category)}
                    className={`text-left px-4 py-2 rounded-xl font-inter transition-all relative overflow-hidden group ${
                      activeCategory === category 
                        ? 'text-white' 
                        : 'text-gray-500 hover:text-[#121212]'
                    }`}
                  >
                    {activeCategory === category && (
                      <motion.div 
                        layoutId="activeCategory" 
                        className="absolute inset-0 bg-[#121212] rounded-xl -z-10" 
                      />
                    )}
                    <span className="relative z-10">{category}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
            >
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => {
                  const isWishlisted = wishlist.some(item => item.id === product.id);
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                      key={product.id}
                      className="group flex flex-col"
                    >
                      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-gray-100 mb-6">
                        <Link href={`/preview/growth/quantum/products/${product.id}`} className="block w-full h-full">
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:blur-sm"
                          />
                          {/* Dark Glass Hover Overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />
                        </Link>
                        
                        {/* Wishlist Button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            toggleWishlist(product);
                          }}
                          className={`absolute top-4 right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                            isWishlisted 
                              ? 'bg-[#FF4500] text-white shadow-lg shadow-[#FF4500]/30 scale-100' 
                              : 'bg-white/80 backdrop-blur-md text-gray-400 hover:text-red-500 scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100'
                          }`}
                        >
                          <motion.div whileTap={{ scale: 0.5 }}>
                            <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                          </motion.div>
                        </button>
                        
                        {/* Add to Cart Hover Button */}
                        <div className="absolute inset-x-4 bottom-4 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out z-20">
                          <button
                            onClick={() => addToCart(product)}
                            className="w-full py-4 bg-white/90 backdrop-blur-lg text-[#121212] font-bold font-inter uppercase tracking-wider text-xs rounded-xl hover:bg-[#111111] hover:text-white transition-colors"
                          >
                            Quick Add - ${product.price.toFixed(2)}
                          </button>
                        </div>
                      </div>

                      <div className="px-2">
                        <div className="text-xs uppercase tracking-widest text-[#111111] font-bold mb-2">
                          {product.category}
                        </div>
                        <Link href={`/preview/growth/quantum/products/${product.id}`}>
                          <h3 className="font-playfair text-xl font-bold text-[#121212] group-hover:text-[#111111] transition-colors mb-2">
                            {product.name}
                          </h3>
                        </Link>
                        <div className="font-inter text-gray-500 font-medium">
                          ${product.price.toFixed(2)}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
            
            {filteredProducts.length === 0 && (
              <div className="py-32 text-center text-gray-400 font-inter text-lg">
                No artifacts found in this category.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
