"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, Filter, X, Zap, ChevronDown, Heart } from "lucide-react";
import { VELOCITY_PRODUCTS, useVelocity } from "../VelocityContext";

// Reusing the 3D card from home page
function ProductCard3D({ product }: { product: any }) {
  const { toggleWishlist, wishlist } = useVelocity();
  const isWishlisted = wishlist.some((item: any) => item.id === product.id);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateXValue = ((y - centerY) / centerY) * -15;
    const rotateYValue = ((x - centerX) / centerX) * 15;
    
    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div className="relative perspective-1000">
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={{ rotateX, rotateY }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative aspect-[3/4] rounded-sm border border-[#00f0ff]/20 bg-[#050505] overflow-visible group"
      >
        <Link href={`/preview/growth/velocity/products/${product.id}`} className="absolute inset-0 z-10" />
        <div 
          className="absolute inset-0 bg-[#00f0ff] opacity-0 group-hover:opacity-10 transition-opacity duration-300 blur-xl"
          style={{ transform: "translateZ(-20px)" }}
        />
        
        <div className="absolute inset-0 overflow-hidden" style={{ transform: "translateZ(0px)" }}>
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 mix-blend-lighten"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent opacity-90" />
        </div>

        <div 
          className="absolute bottom-6 left-6 right-6"
          style={{ transform: "translateZ(30px)" }}
        >
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[#00f0ff] text-[9px] font-bold uppercase tracking-[0.3em] mb-2 font-mono">{product.category}</p>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-tight font-orbitron">{product.name}</h3>
            </div>
          </div>
        </div>

        <div 
          className="absolute top-6 right-6"
          style={{ transform: "translateZ(40px)" }}
        >
          <span className="text-[#ff003c] font-black text-lg font-orbitron">${product.price}</span>
        </div>

        {product.isNew && (
          <div 
            className="absolute -top-3 -left-3 bg-[#00f0ff] text-black text-[10px] font-black uppercase tracking-widest px-4 py-2 shadow-[0_0_15px_rgba(0,240,255,0.5)]"
            style={{ transform: "translateZ(50px)" }}
          >
            V.2
          </div>
        )}
        {/* Wishlist Button */}
        <div 
          className="absolute top-4 left-4 z-20"
          style={{ transform: "translateZ(50px)" }}
        >
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(product);
            }}
            className="p-3 bg-[#0a0a0a] border border-[#ff003c]/50 text-[#ff003c] hover:bg-[#ff003c] hover:text-white transition-colors group/wishlist"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        </div>

      </motion.div>
    </div>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedWearType, setSelectedWearType] = useState<string>("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>("recommended");
  const [isSortOpen, setIsSortOpen] = useState(false);

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setSelectedCategory(cat);
    else setSelectedCategory("All");

    const wt = searchParams.get('wearType');
    if (wt) setSelectedWearType(wt);
    else setSelectedWearType("All");
  }, [searchParams]);

  const categories = ["All", ...Array.from(new Set(VELOCITY_PRODUCTS.map(p => p.category)))];
  const wearTypes = ["All", "top", "bottom", "accessory", "footwear", "tech"];

  const filteredProducts = useMemo(() => {
    let result = [...VELOCITY_PRODUCTS];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }

    if (selectedCategory !== "All") {
      result = result.filter(p => p.category === selectedCategory);
    }

    if (selectedWearType !== "All") {
      result = result.filter(p => p.wearType === selectedWearType);
    }

    if (sortBy === "price_low") result.sort((a, b) => a.price - b.price);
    else if (sortBy === "price_high") result.sort((a, b) => b.price - a.price);
    else if (sortBy === "name") result.sort((a, b) => a.name.localeCompare(b.name));

    return result;
  }, [searchQuery, selectedCategory, selectedWearType, sortBy]);

  return (
    <div className="flex flex-col w-full bg-[#050505] text-[#ededed] pt-32 min-h-screen relative overflow-hidden">
      
      {/* Cyber Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />
      
      {/* Header */}
      <section className="px-6 md:px-12 max-w-7xl mx-auto w-full mb-16 relative z-30">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", damping: 20 }}
          >
            <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter text-[#00f0ff] font-orbitron drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]">
              Catalog
            </h1>
            <p className="text-white/50 text-xs uppercase tracking-[0.3em] mt-2 font-space">Browse Collection</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className="flex items-center gap-4 w-full md:w-auto"
          >
            <div className="relative flex-1 md:w-64 group">
              <div className="absolute inset-0 bg-[#00f0ff] blur-md opacity-0 group-focus-within:opacity-20 transition-opacity duration-300" />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00f0ff]" />
              <input 
                type="text" 
                placeholder="Search Products..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="relative w-full bg-[#0a0a0a] border border-[#00f0ff]/30 rounded-none pl-12 pr-4 py-3 text-xs uppercase tracking-widest text-[#00f0ff] focus:outline-none focus:border-[#00f0ff] transition-colors placeholder:text-[#00f0ff]/30 font-space"
              />
            </div>
            
            <div className="relative hidden md:block w-56 z-50">
              <button 
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="w-full bg-[#0a0a0a] border border-[#00f0ff]/30 text-xs uppercase tracking-widest text-[#00f0ff] p-3 font-space flex items-center justify-between hover:border-[#00f0ff] transition-colors"
              >
                <span className="truncate">
                  {sortBy === 'recommended' ? 'Recommended' : 
                   sortBy === 'price_low' ? 'Price: Low to High' : 
                   sortBy === 'price_high' ? 'Price: High to Low' : 
                   'Name: A-Z'}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {isSortOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a] border border-[#00f0ff]/30 shadow-[0_10px_30px_rgba(0,240,255,0.1)] overflow-hidden"
                  >
                    {[
                      { id: 'recommended', label: 'Recommended' },
                      { id: 'price_low', label: 'Price: Low to High' },
                      { id: 'price_high', label: 'Price: High to Low' },
                      { id: 'name', label: 'Name: A-Z' }
                    ].map(option => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setSortBy(option.id);
                          setIsSortOpen(false);
                        }}
                        className={`w-full text-left p-3 text-xs uppercase tracking-widest font-space transition-colors hover:bg-[#00f0ff]/10 hover:text-[#00f0ff] ${sortBy === option.id ? 'text-[#00f0ff] bg-[#00f0ff]/5' : 'text-white/70'}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-3 border transition-colors flex items-center justify-center relative overflow-hidden group ${isFilterOpen ? 'border-[#ff003c]' : 'border-[#00f0ff]/30 hover:border-[#00f0ff]'}`}
            >
              {isFilterOpen && <div className="absolute inset-0 bg-[#ff003c]/20 blur-md" />}
              <Filter className={`w-5 h-5 relative z-10 ${isFilterOpen ? 'text-[#ff003c]' : 'text-[#00f0ff]'}`} />
            </button>
          </motion.div>
        </div>
      </section>

      <div className="px-6 md:px-12 max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-12 pb-32 relative z-10">
        
        {/* Desktop Filters */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div 
              initial={{ width: 0, opacity: 0, marginRight: 0 }}
              animate={{ width: "250px", opacity: 1, marginRight: "3rem" }}
              exit={{ width: 0, opacity: 0, marginRight: 0 }}
              className="hidden lg:block shrink-0 overflow-hidden"
            >
              <div className="w-[250px] space-y-12 pr-6 border-r border-[#00f0ff]/20 h-full sticky top-32">
                
                <div className="relative">
                  <div className="absolute -left-3 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#00f0ff] to-transparent" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00f0ff] mb-6 font-orbitron flex items-center gap-2">
                    <Zap className="w-3 h-3" /> Category
                  </h3>
                  <ul className="space-y-4 text-xs font-space tracking-widest uppercase">
                    {categories.map(cat => (
                      <li key={cat}>
                        <button 
                          onClick={() => setSelectedCategory(cat)}
                          className={`hover:text-[#00f0ff] transition-colors text-left flex items-center gap-3 ${selectedCategory === cat ? 'text-white font-bold' : 'text-white/40'}`}
                        >
                          <span className={`w-1 h-1 rounded-full ${selectedCategory === cat ? 'bg-[#00f0ff] shadow-[0_0_5px_#00f0ff]' : 'bg-transparent'}`} />
                          {cat}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="relative">
                  <div className="absolute -left-3 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#ff003c] to-transparent" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ff003c] mb-6 font-orbitron flex items-center gap-2">
                    <Zap className="w-3 h-3" /> Type
                  </h3>
                  <ul className="space-y-4 text-xs font-space tracking-widest uppercase">
                    {wearTypes.map(type => (
                      <li key={type}>
                        <button 
                          onClick={() => setSelectedWearType(type)}
                          className={`hover:text-[#ff003c] transition-colors text-left flex items-center gap-3 ${selectedWearType === type ? 'text-white font-bold' : 'text-white/40'}`}
                        >
                          <span className={`w-1 h-1 rounded-full ${selectedWearType === type ? 'bg-[#ff003c] shadow-[0_0_5px_#ff003c]' : 'bg-transparent'}`} />
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

        {/* Mobile Filters */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="lg:hidden fixed inset-x-0 bottom-0 top-24 bg-[#050505]/95 backdrop-blur-xl z-40 p-6 overflow-y-auto border-t border-[#00f0ff]/30 shadow-[0_-10px_40px_rgba(0,240,255,0.1)]"
            >
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-black uppercase tracking-widest font-orbitron text-[#00f0ff]">Filters</h2>
                <button onClick={() => setIsFilterOpen(false)} className="text-[#ff003c] p-2 bg-[#ff003c]/10 rounded-sm">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-12">
                <div className="relative">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00f0ff] mb-6 font-orbitron flex items-center gap-2">
                    Category
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs font-space tracking-widest uppercase">
                    {categories.map(cat => (
                      <button 
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`p-3 border text-center transition-colors ${selectedCategory === cat ? 'border-[#00f0ff] bg-[#00f0ff]/10 text-white' : 'border-white/10 text-white/40'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product Grid */}
        <div className="flex-1">
          {filteredProducts.length === 0 ? (
            <div className="py-32 text-center border border-[#ff003c]/30 bg-[#ff003c]/5">
              <Zap className="w-12 h-12 text-[#ff003c] mx-auto mb-6 opacity-50" />
              <h3 className="text-xl font-black uppercase tracking-widest mb-4 font-orbitron text-[#ff003c]">No Products Found</h3>
              <p className="text-white/50 text-xs font-space tracking-widest uppercase mb-8">Please try different filters.</p>
              <button 
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                  setSelectedWearType("All");
                }}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-white bg-[#ff003c] px-6 py-3 hover:bg-white hover:text-black transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 gap-y-16">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product, index) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                    transition={{ type: "spring", damping: 20, delay: index * 0.05 }}
                    key={product.id}
                  >
                    <ProductCard3D product={product} />
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

export default function VelocityProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
      <ProductsContent />
    </Suspense>
  );
}
