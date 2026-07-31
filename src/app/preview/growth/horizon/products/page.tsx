"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { HORIZON_PRODUCTS, useHorizon } from "../HorizonContext";
import { Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import { useState, useMemo } from "react";

export default function HorizonProducts() {
  const { addToCart } = useHorizon();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("featured");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const sortOptions = [
    { value: "featured", label: "Featured" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "name-asc", label: "Alphabetical" }
  ];

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set(HORIZON_PRODUCTS.map(p => p.category));
    return ["All", ...Array.from(cats)];
  }, []);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = HORIZON_PRODUCTS;

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory !== "All") {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      return 0; // "featured" (default order)
    });

    return result;
  }, [searchQuery, selectedCategory, sortBy]);

  return (
    <div className="bg-[#FAFAFA] min-h-screen text-[#111] pt-40 pb-32">
      {/* Header */}
      <section className="px-6 md:px-12 max-w-[1600px] mx-auto mb-20">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="text-center flex flex-col items-center"
        >
          <span className="font-outfit text-[10px] uppercase tracking-[0.4em] text-black/40 mb-8 block font-medium">
            The Archive
          </span>
          <h1 className="font-cormorant text-6xl md:text-[8rem] font-light tracking-tight leading-none mb-12">
            Digital <span className="italic font-medium">Vault</span>.
          </h1>
          <p className="font-outfit text-sm font-light text-black/50 max-w-lg leading-relaxed mb-16">
            A meticulously curated selection of premium digital assets. Designed for agencies and creators who demand uncompromising aesthetic quality.
          </p>
        </motion.div>
      </section>

      {/* Toolbar (Search, Filter, Sort) */}
      <section className="px-6 md:px-12 max-w-[1600px] mx-auto mb-20 relative z-30">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-y border-black/5 py-6">
          
          <div className="flex-1 w-full max-w-md flex items-center pointer-events-auto">
            <Search className="w-4 h-4 text-black/40 mr-4" strokeWidth={1.5} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search the archive..." 
              className="w-full bg-transparent text-sm font-outfit font-light placeholder:text-black/30 focus:outline-none transition-colors"
              style={{ cursor: "none" }}
            />
          </div>

          <div className="flex items-center gap-8 w-full md:w-auto pointer-events-auto">
            {/* Filter Toggle */}
            <div className="relative">
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-2 font-outfit text-[10px] uppercase tracking-[0.2em] font-medium text-black/60 hover:text-black transition-colors"
                style={{ cursor: "none" }}
              >
                <SlidersHorizontal className="w-3 h-3" /> Filter
              </button>
              
              <AnimatePresence>
                {isFilterOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-4 w-48 bg-white border border-black/5 shadow-[0_20px_40px_rgba(0,0,0,0.05)] p-4 flex flex-col gap-3 z-50"
                  >
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => { setSelectedCategory(cat); setIsFilterOpen(false); }}
                        className={`text-left font-outfit text-[10px] uppercase tracking-[0.2em] transition-colors ${selectedCategory === cat ? 'text-black font-medium' : 'text-black/40 hover:text-black'}`}
                        style={{ cursor: "none" }}
                      >
                        {cat}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-3">
              <span className="font-outfit text-[10px] uppercase tracking-[0.2em] text-black/40">Sort:</span>
              <div className="relative">
                <button 
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className="flex items-center gap-2 appearance-none bg-transparent font-outfit text-[10px] uppercase tracking-[0.2em] font-medium text-black focus:outline-none cursor-none"
                >
                  {sortOptions.find(opt => opt.value === sortBy)?.label || "Sort By"}
                  <ChevronDown className="w-3 h-3 text-black/50" />
                </button>
                <AnimatePresence>
                  {isSortOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full right-0 mt-4 w-48 bg-white border border-black/5 shadow-[0_20px_40px_rgba(0,0,0,0.05)] p-4 flex flex-col gap-3 z-50"
                    >
                      {sortOptions.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => { setSortBy(opt.value); setIsSortOpen(false); }}
                          className={`text-left font-outfit text-[10px] uppercase tracking-[0.2em] transition-colors ${sortBy === opt.value ? 'text-black font-medium' : 'text-black/40 hover:text-black'}`}
                          style={{ cursor: "none" }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="px-6 md:px-12 max-w-[1600px] mx-auto min-h-[50vh]">
        <AnimatePresence mode="wait">
          {filteredProducts.length === 0 ? (
             <motion.div 
               key="empty"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="flex flex-col items-center justify-center py-32 text-center"
             >
               <Search className="w-8 h-8 text-black/10 mb-6" strokeWidth={1} />
               <p className="font-cormorant text-3xl font-light text-black/40 italic mb-2">No assets found.</p>
               <p className="font-outfit font-light text-sm text-black/30">Adjust your search or filter criteria.</p>
             </motion.div>
          ) : (
            <motion.div 
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-24"
            >
              {filteredProducts.map((product, idx) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="group flex flex-col pointer-events-auto"
                >
                  <Link href={`/preview/growth/horizon/products/${product.id}`} className="block relative overflow-hidden mb-8" style={{ cursor: "none" }}>
                    <div className="relative aspect-[4/5] bg-[#F5F5F5] overflow-hidden">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
                      />
                      {product.isNew && (
                        <div className="absolute top-6 left-6 z-20 text-white bg-black/90 backdrop-blur px-4 py-2 text-[9px] uppercase tracking-[0.3em] font-outfit font-medium">
                          New Release
                        </div>
                      )}
                    </div>
                  </Link>
                  
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-cormorant text-3xl font-medium text-[#111] group-hover:opacity-70 transition-opacity duration-500">
                          {product.name}
                        </h3>
                      </div>
                      <p className="font-outfit text-[10px] font-medium text-black/40 tracking-[0.2em] uppercase mb-6">{product.category}</p>
                    </div>
                    <div className="flex justify-between items-center pt-6 border-t border-black/5">
                      <span className="font-outfit font-medium text-[#111]">${product.price.toFixed(2)}</span>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          addToCart(product);
                        }}
                        style={{ cursor: "none" }}
                        className="text-[10px] font-medium uppercase tracking-[0.2em] font-outfit text-black/50 hover:text-black transition-colors pointer-events-auto"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
