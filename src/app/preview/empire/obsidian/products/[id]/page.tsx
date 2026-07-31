"use client";

import React, { useState } from "react";
import { Inter, Oswald } from "next/font/google";
import { useObsidian } from "../../ObsidianContext";
import { ArrowRight, ChevronDown, Check, ChevronLeft, ChevronRight, Heart, Hexagon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const inter = Inter({ subsets: ["latin"] });
const oswald = Oswald({ subsets: ["latin"] });

const RatingDots = ({ rating }: { rating: number }) => (
  <div className="flex gap-1.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <div 
        key={star} 
        className={`w-1.5 h-1.5 rounded-none ${star <= rating ? 'bg-white' : 'border border-white/30 bg-transparent'}`}
      />
    ))}
  </div>
);

const ReviewItem = ({ name, date, rating, comment }: any) => (
  <div className="pb-8 border-b border-white/10 last:border-0">
    <div className="flex items-center justify-between mb-4">
      <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
        <span className={`font-bold text-xs uppercase tracking-[0.2em] text-white ${oswald.className}`}>{name}</span>
        <span className={`text-white/40 text-[10px] uppercase tracking-widest ${inter.className}`}>{date}</span>
      </div>
      <RatingDots rating={rating} />
    </div>
    <p className={`text-sm font-medium leading-loose text-white/60 ${inter.className}`}>
      {comment}
    </p>
  </div>
);

export default function ObsidianProductDetailsPage() {
  const { addToCart, setIsCartOpen, toggleWishlist, isInWishlist, reviews, addReview } = useObsidian();
  const [selectedSize, setSelectedSize] = useState("42");
  const [selectedColor, setSelectedColor] = useState("V1");
  const [isAdded, setIsAdded] = useState(false);
  
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  
  const pathname = usePathname();
  const id = pathname?.split('/').pop();

  const PRODUCTS = [
    {
      id: "obsidian-prime",
      name: "PRIME",
      edition: "V1",
      price: 950,
      image: "https://images.unsplash.com/photo-1614729939124-03290b040973?q=80&w=1600&auto=format&fit=crop", // Space/nebula abstract
    },
    {
      id: "obsidian-core",
      name: "CORE",
      edition: "V2",
      price: 850,
      image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1200&auto=format&fit=crop", // Tech abstract
    },
    {
      id: "obsidian-apex",
      name: "APEX",
      edition: "V3",
      price: 1200,
      image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=1200&auto=format&fit=crop", // Abstract geometry
    }
  ];

  const foundProduct = PRODUCTS.find(p => p.id === id) || PRODUCTS[0];

  const product = {
    id: foundProduct.id,
    name: `OBSIDIAN ${foundProduct.name}`,
    price: foundProduct.price,
    desc: "Precision engineering for extreme conditions. Forged with synthetic carbon matrix and advanced impact dispersion protocols. Built for absolute performance and zero compromise.",
  };

  const colors = [
    { name: "V1", hex: "#000000" },
    { name: "V2", hex: "#333333" },
    { name: "V3", hex: "#666666" },
  ];

  const sizes = ['40', '41', '42', '43', '44', '45', '46', '47'];

  const handleAddToCart = () => {
    addToCart({
      id: `${product.id}-${selectedColor.toLowerCase()}`,
      name: `${product.name} // ${selectedColor.toUpperCase()}`,
      price: product.price,
      quantity: 1,
      category: "Performance",
      size: selectedSize,
      color: selectedColor,
      image: foundProduct.image
    });
    
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      setIsCartOpen(true);
    }, 1500);
  };

  const productReviews = reviews.filter(r => r.productId === foundProduct.id);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewName && reviewComment) {
      addReview(foundProduct.id, reviewRating, reviewComment, reviewName);
      setReviewName("");
      setReviewComment("");
      setReviewRating(5);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      
      <div className="flex flex-col lg:flex-row w-full max-w-[2000px] mx-auto">
        
        {/* LEFT: Cover Image */}
        <div className="w-full lg:w-[50%] flex flex-col relative z-10 bg-[#0a0a0a] border-r border-white/5">
          <div className="w-full h-[60vh] lg:h-screen sticky top-0 overflow-hidden flex items-center justify-center">
            <motion.img
              src={foundProduct.image}
              initial={{ scale: 1.1, filter: "grayscale(100%) contrast(150%) brightness(50%)" }}
              animate={{ scale: 1, filter: "grayscale(80%) contrast(120%) brightness(80%)" }}
              transition={{ duration: 1.5, ease: [0.76, 0, 0.24, 1] }}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover object-center origin-center mix-blend-screen"
            />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-80 pointer-events-none" />
            
            <div className="absolute bottom-12 left-12 flex items-center gap-4 text-white z-20">
               <span className={`flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] ${oswald.className}`}>
                 <Hexagon className="w-3 h-3 fill-white" /> CLASS_A
               </span>
            </div>
          </div>
        </div>

        {/* RIGHT: Sticky Product Details */}
        <div className="w-full lg:w-[50%] relative z-20 bg-[#050505]">
          <div data-lenis-prevent className="lg:sticky lg:top-0 lg:h-screen overflow-y-auto scrollbar-hide px-8 md:px-16 lg:px-24 py-24 lg:py-32 flex flex-col">
            
            {/* Title & Price */}
            <motion.div 
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.76, 0, 0.24, 1] }}
              className="mb-12"
            >
              <h1 className={`text-5xl md:text-6xl lg:text-8xl font-bold uppercase tracking-widest leading-[0.85] mb-6 ${oswald.className}`}>
                {foundProduct.name}
              </h1>
              <p className={`text-2xl font-bold tracking-widest text-white/80 ${oswald.className}`}>
                ${product.price}.00
              </p>
            </motion.div>

            <div className="w-full h-[1px] bg-white/10 mb-12" />

            <p className={`text-sm text-white/60 leading-loose font-medium mb-12 max-w-xl uppercase tracking-widest ${inter.className}`}>
              {product.desc}
            </p>

            <div className="space-y-12 mb-16">
              
              {/* Color Selection */}
              <div>
                <div className="flex justify-between items-end mb-6">
                  <span className={`text-[10px] uppercase tracking-[0.3em] font-bold text-white/40 ${inter.className}`}>
                    VARIANT // SPEC
                  </span>
                  <span className={`text-xs font-bold tracking-widest uppercase ${oswald.className}`}>
                    {selectedColor}
                  </span>
                </div>
                <div className="flex gap-4">
                  {colors.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setSelectedColor(c.name)}
                      className={`w-12 h-12 rounded-none border transition-all duration-300 ${
                        selectedColor === c.name
                          ? "border-white shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-110"
                          : "border-white/10 hover:border-white/30"
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <span className={`text-[10px] uppercase tracking-[0.3em] font-bold text-white/40 ${inter.className}`}>
                    CONTAINMENT FIELD
                  </span>
                  <button className={`text-[10px] uppercase tracking-[0.2em] font-bold text-white/30 hover:text-white transition-colors underline ${inter.className}`}>
                    FIELD CALIBRATION
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`py-4 text-xs font-bold rounded-none border transition-all duration-300 ${
                        selectedSize === size
                          ? "bg-white text-black border-transparent shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                          : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:border-white/20"
                      } ${oswald.className} tracking-widest`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Actions */}
            <div className="flex flex-col gap-4 mb-16">
              <button
                onClick={handleAddToCart}
                disabled={isAdded}
                className={`w-full py-6 bg-white text-black text-xs font-bold uppercase tracking-[0.3em] transition-all duration-500 flex items-center justify-center gap-4 group overflow-hidden relative pointer-events-auto rounded-none ${inter.className}`}
              >
                <AnimatePresence mode="wait">
                  {isAdded ? (
                    <motion.span
                      key="added"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      className="relative z-10 flex items-center gap-3"
                    >
                      ACQUIRED <Check className="w-4 h-4" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="add"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      className="relative z-10 flex items-center gap-4 group-hover:text-white transition-colors duration-500"
                    >
                      ACQUIRE <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-500" />
                    </motion.span>
                  )}
                </AnimatePresence>
                <div className="absolute inset-0 bg-[#333] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] z-0" />
              </button>

              <button 
                onClick={() => toggleWishlist({ ...foundProduct, category: "Performance" })}
                className={`w-full py-5 bg-transparent border border-white/20 text-white text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-white/5 transition-colors flex items-center justify-center gap-3 ${inter.className}`}
              >
                {isInWishlist(product.id) ? (
                  <>REMOVE FROM ARCHIVE <Heart className="w-4 h-4 fill-white" /></>
                ) : (
                  <>SAVE TO ARCHIVE <Heart className="w-4 h-4" /></>
                )}
              </button>
            </div>

            {/* Accordion Info */}
            <div className="space-y-6 pt-12 border-t border-white/10">
              <div className="group cursor-pointer">
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-sm font-bold uppercase tracking-widest ${oswald.className}`}>SPECIFICATIONS</span>
                  <ChevronDown className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                </div>
                <p className={`text-[11px] text-white/50 leading-loose uppercase tracking-widest ${inter.className}`}>
                  Core: Synthetic Quantum Matrix<br/>
                  Shell: High-Transmission Refractive Field<br/>
                  Stabilizer: Icosahedron Containment Protocol<br/>
                  Origin: Forged in Deep Space Station Alpha
                </p>
              </div>
            </div>
            
            {/* Reviews */}
            <div className="mt-24 border-t border-white/10 pt-16">
              <div className="flex items-center justify-between mb-12">
                <h3 className={`text-2xl font-bold uppercase tracking-widest ${oswald.className}`}>SYSTEM LOGS</h3>
                <div className="flex items-center gap-3">
                  {productReviews.length > 0 && <RatingDots rating={Math.round(productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length)} />}
                  <span className={`text-[10px] uppercase tracking-widest text-white/40 ${inter.className}`}>({productReviews.length} LOGS)</span>
                </div>
              </div>
              
              <div className="space-y-8 mb-16">
                {productReviews.length === 0 ? (
                  <p className={`text-sm text-white/40 uppercase tracking-widest ${inter.className}`}>NO LOGS FOUND IN ARCHIVE.</p>
                ) : (
                  productReviews.map(review => (
                    <ReviewItem 
                      key={review.id}
                      name={`OP_${review.userName}`} 
                      date={review.date} 
                      rating={review.rating} 
                      comment={review.comment} 
                    />
                  ))
                )}
              </div>

              {/* Write a Review */}
              <div className="bg-white/5 border border-white/10 p-8">
                <h4 className={`text-[12px] font-bold uppercase tracking-widest mb-8 ${oswald.className}`}>SUBMIT LOG</h4>
                <form onSubmit={handleReviewSubmit} className="space-y-6">
                  <div>
                    <label className={`block text-[10px] uppercase tracking-[0.2em] font-bold text-white/50 mb-3 ${inter.className}`}>IDENTIFIER</label>
                    <input 
                      type="text" 
                      required 
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      className={`w-full bg-transparent border-b border-white/20 py-3 text-sm focus:outline-none focus:border-white transition-colors ${inter.className} text-white font-medium uppercase tracking-widest`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[10px] uppercase tracking-[0.2em] font-bold text-white/50 mb-3 ${inter.className}`}>METRIC RATING</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setReviewRating(val)}
                        >
                          <div className={`w-3 h-3 rounded-none ${val <= reviewRating ? 'bg-white' : 'border border-white/30 bg-transparent'} transition-colors hover:bg-white/50`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={`block text-[10px] uppercase tracking-[0.2em] font-bold text-white/50 mb-3 ${inter.className}`}>DATA STREAM</label>
                    <textarea 
                      required 
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={4}
                      className={`w-full bg-black/50 border border-white/10 p-4 text-sm focus:outline-none focus:border-white/50 transition-colors resize-none ${inter.className} text-white font-light tracking-wide`}
                    />
                  </div>
                  <button 
                    type="submit"
                    className={`w-full bg-white text-black py-5 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-white/90 transition-colors flex items-center justify-center gap-3 group ${inter.className}`}
                  >
                    TRANSMIT <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
