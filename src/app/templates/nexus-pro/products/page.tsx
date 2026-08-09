"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, Filter, X, ArrowRight, Star, ChevronDown } from "lucide-react";
import { NEXUS_PRODUCTS, useShop } from "../ShopContext";
import { useCustomization } from "@/hooks/useCustomization";

const sortOptions = [
  { value: "relevancy", label: "Relevancy" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" }
];

function SortDropdown({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = sortOptions.find(o => o.value === value) || sortOptions[0];

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-transparent border-b border-white/20 pb-2 text-sm text-left flex justify-between items-center focus:outline-none focus:border-[#d4af37] transition-colors"
      >
        <span>{selectedOption.label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 w-full mt-2 bg-[#111] border border-white/10 rounded-lg overflow-hidden z-50 shadow-xl"
          >
            {sortOptions.map(option => (
              <button
                key={option.value}
                onClick={() => { onChange(option.value); setIsOpen(false); }}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors ${value === option.value ? 'text-[#d4af37] font-bold' : 'text-white/70'}`}
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const { addToCart, setIsCartOpen , currencySymbol } = useShop();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedBrand, setSelectedBrand] = useState<string>("All");
  const [selectedWearType, setSelectedWearType] = useState<string>("All");
  const [showNewOnly, setShowNewOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sortBy, setSortBy] = useState<"relevancy" | "price-asc" | "price-desc">("relevancy");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setSelectedCategory(cat);
    else setSelectedCategory("All");

    const wt = searchParams.get('wearType');
    if (wt) setSelectedWearType(wt);
    else setSelectedWearType("All");

    const isNew = searchParams.get('isNew');
    if (isNew === 'true') setShowNewOnly(true);
    else setShowNewOnly(false);
  }, [searchParams]);

  const customData = useCustomization();
  const shopTitle = customData?.formData?.shopTitle || "Archive.";
  const rawCategories = customData?.formData?.shopCategories;
  
  const categories = rawCategories
    ? rawCategories.split(",").map((c: string) => c.trim()).filter(Boolean)
    : ["All", ...Array.from(new Set(NEXUS_PRODUCTS.map(p => p.category)))];
  
  const brands = ["All", ...Array.from(new Set(NEXUS_PRODUCTS.map(p => p.brand)))];
  const wearTypes = ["All", "top", "bottom", "accessory", "footwear", "other"];

  const filteredProducts = useMemo(() => {
    let result = NEXUS_PRODUCTS;

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }

    // Category
    if (selectedCategory !== "All") {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Brand
    if (selectedBrand !== "All") {
      result = result.filter(p => p.brand === selectedBrand);
    }

    // Wear Type
    if (selectedWearType !== "All") {
      result = result.filter(p => p.wearType === selectedWearType);
    }

    // New Only
    if (showNewOnly) {
      result = result.filter(p => p.isNew);
    }

    // Price
    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Sort
    if (sortBy === "price-asc") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    return result;
  }, [searchQuery, selectedCategory, selectedBrand, selectedWearType, priceRange, sortBy]);

  return (
    <div className="flex flex-col w-full bg-[#0a0a0a] text-[#ededed] pt-32 min-h-screen">
      
      {/* Header */}
      <section className="px-6 md:px-12 max-w-7xl mx-auto w-full mb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.8] whitespace-pre-line">
              {shopTitle.replace(" ", "\n")}
            </h1>
            <p className="text-white/50 text-sm uppercase tracking-widest mt-6">Explore the full collection</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex items-center gap-4 w-full md:w-auto"
          >
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-full pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-[#d4af37] transition-colors"
              />
            </div>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-3 rounded-full border transition-colors flex items-center justify-center ${isFilterOpen ? 'bg-[#d4af37] text-black border-[#d4af37]' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
            >
              <Filter className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </section>

      <div className="px-6 md:px-12 max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-12 pb-32">
        
        {/* Filter Sidebar */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div 
              initial={{ width: 0, opacity: 0, marginRight: 0 }}
              animate={{ width: "250px", opacity: 1, marginRight: "3rem" }}
              exit={{ width: 0, opacity: 0, marginRight: 0 }}
              className="hidden lg:block shrink-0 overflow-hidden"
            >
              <div className="w-[250px] space-y-10 pr-6 border-r border-white/10 h-full sticky top-32">
                
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#d4af37] mb-4">Sort By</h3>
                  <SortDropdown 
                    value={sortBy} 
                    onChange={(val) => setSortBy(val as any)} 
                  />
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#d4af37] mb-4">Category</h3>
                  <ul className="space-y-3 text-sm text-white/60">
                    {categories.map((cat: any) => (
                      <li key={cat}>
                        <button 
                          onClick={() => setSelectedCategory(cat)}
                          className={`hover:text-white transition-colors text-left ${selectedCategory === cat ? 'text-[#d4af37] font-bold' : ''}`}
                        >
                          {cat}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#d4af37] mb-4">Brand</h3>
                  <ul className="space-y-3 text-sm text-white/60">
                    {brands.map(brand => (
                      <li key={brand}>
                        <button 
                          onClick={() => setSelectedBrand(brand)}
                          className={`hover:text-white transition-colors text-left ${selectedBrand === brand ? 'text-[#d4af37] font-bold' : ''}`}
                        >
                          {brand}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#d4af37] mb-4">Wear Type</h3>
                  <ul className="space-y-3 text-sm text-white/60">
                    {wearTypes.map(type => (
                      <li key={type}>
                        <button 
                          onClick={() => setSelectedWearType(type)}
                          className={`hover:text-white transition-colors text-left capitalize ${selectedWearType === type ? 'text-[#d4af37] font-bold' : ''}`}
                        >
                          {type}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Filter Overlay */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="lg:hidden fixed inset-x-0 bottom-0 top-24 bg-[#0a0a0a] z-40 p-6 overflow-y-auto border-t border-white/10"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black uppercase tracking-tighter">Filters</h2>
                <button onClick={() => setIsFilterOpen(false)} className="text-white/50 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-10">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#d4af37] mb-4">Sort By</h3>
                  <SortDropdown 
                    value={sortBy} 
                    onChange={(val) => setSortBy(val as any)} 
                  />
                </div>
                {/* Replicate filter logic for mobile here if needed, keeping simple for now */}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product Grid */}
        <div className="flex-1">
          {filteredProducts.length === 0 ? (
            <div className="py-32 text-center border-t border-white/10">
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">No results found</h3>
              <p className="text-white/50 text-sm">Try adjusting your filters or search query.</p>
              <button 
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                  setSelectedBrand("All");
                  setSelectedWearType("All");
                  setShowNewOnly(false);
                }}
                className="mt-8 text-xs font-bold uppercase tracking-widest text-[#d4af37] hover:text-white transition-colors"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 gap-y-16">
              <AnimatePresence>
                {filteredProducts.map((product, index) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    key={product.id}
                    className="group cursor-pointer flex flex-col"
                  >
                    <Link href={`/templates/nexus-pro/products/${product.id}`} className="block relative">
                      <div className="relative aspect-[3/4] overflow-hidden rounded-lg mb-6 bg-white/5">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="absolute inset-0 w-full h-full object-cover transition-all duration-[1.5s] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-110 group-hover:-rotate-1"
                        />
                        
                        {/* Dark Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-700 backdrop-blur-[2px]" />

                        {/* Add to Cart Button */}
                        <div className="absolute inset-x-0 bottom-0 p-6 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] flex justify-center">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              addToCart(product);
                              setIsCartOpen(true);
                            }}
                            className="relative overflow-hidden group/btn px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-full w-full shadow-2xl"
                          >
                            <span className="absolute inset-0 w-full h-full bg-[#d4af37] translate-y-[100%] group-hover/btn:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]" />
                            <span className="relative z-10 block transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover/btn:-translate-y-[200%]">
                              Add To Cart
                            </span>
                            <span className="absolute inset-0 z-10 flex items-center justify-center text-white transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] translate-y-[200%] group-hover/btn:translate-y-0">
                              Add To Cart
                            </span>
                          </button>
                        </div>

                        {product.isNew && (
                          <div className="absolute top-4 left-4 bg-[#d4af37] text-black text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full z-10">
                            New
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-start">
                        <div className="transition-transform duration-500 ease-out group-hover:translate-x-2">
                          <h3 className="text-xl font-bold mb-1 transition-colors duration-500 group-hover:text-[#d4af37]">{product.name}</h3>
                          <p className="text-sm text-white/50 transition-colors duration-500 group-hover:text-white/80">{product.category}</p>
                        </div>
                        <div className="text-right transition-transform duration-500 ease-out group-hover:-translate-x-2">
                          <p className="text-lg font-bold">{currencySymbol}{product.price.toFixed(2)}</p>
                          <div className="flex items-center justify-end gap-1 mt-1 text-[#d4af37]">
                            <Star className="w-3 h-3 fill-current" />
                            <span className="text-xs font-bold text-white">{product.rating}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading products...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
