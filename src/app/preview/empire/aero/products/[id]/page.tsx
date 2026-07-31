"use client";

import React, { useState } from "react";
import { Outfit, Syne } from "next/font/google";
import { useAero } from "../../AeroContext";
import { ArrowRight, ChevronDown, Check, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const outfit = Outfit({ subsets: ["latin"] });
const syne = Syne({ subsets: ["latin"] });

const RatingDots = ({ rating }: { rating: number }) => (
  <div className="flex gap-1.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <div 
        key={star} 
        className={`w-1.5 h-1.5 rounded-full ${star <= rating ? 'bg-[#050505]' : 'border border-[#050505]/30 bg-transparent'}`}
      />
    ))}
  </div>
);

const ReviewItem = ({ name, date, rating, comment }: any) => (
  <div className="pb-8 border-b border-[#050505]/5 last:border-0">
    <div className="flex items-center justify-between mb-4">
      <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
        <span className={`font-bold text-xs uppercase tracking-wider ${syne.className}`}>{name}</span>
        <span className={`text-[#050505]/40 text-xs ${outfit.className}`}>{date}</span>
      </div>
      <RatingDots rating={rating} />
    </div>
    <p className={`text-sm font-light leading-relaxed text-[#050505]/70 ${outfit.className}`}>
      {comment}
    </p>
  </div>
);

export default function ProductDetailsPage() {
  const { addToCart, setIsCartOpen, toggleWishlist, isInWishlist, reviews, addReview } = useAero();
  const [selectedSize, setSelectedSize] = useState("42");
  const [selectedColor, setSelectedColor] = useState("Blanc");
  const [isAdded, setIsAdded] = useState(false);

  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  
  const pathname = usePathname();
  const id = pathname?.split('/').pop();

  const PRODUCTS = [
    {
      id: "aero-one-noir",
      name: "AERO ONE",
      edition: "Noir",
      price: 850,
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1600",
    },
    {
      id: "aero-one-blanc",
      name: "AERO ONE",
      edition: "Blanc",
      price: 850,
      image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=1200",
    },
    {
      id: "aero-x-graphite",
      name: "AERO X",
      edition: "Graphite",
      price: 1200,
      image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&q=80&w=1200",
    },
    {
      id: "aero-v2-stealth",
      name: "AERO V2",
      edition: "Stealth",
      price: 950,
      image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=1600",
    }
  ];

  const foundProduct = PRODUCTS.find(p => p.id === id) || PRODUCTS[0];

  const product = {
    id: foundProduct.id,
    name: `${foundProduct.name} ${foundProduct.edition}`,
    price: foundProduct.price,
    desc: "Engineered with aerospace-grade materials and an adaptive cushioning system. Unparalleled comfort meets monolithic design in our most advanced silhouette. The culmination of 3 years of aerodynamic research and structural perfection.",
  };

  const colors = [
    { name: "Blanc", hex: "#f5f5f5" },
    { name: "Noir", hex: "#111111" },
    { name: "Slate", hex: "#4a5568" },
  ];

  const sizes = ['40', '41', '42', '43', '44', '45', '46', '47'];

  const handleAddToCart = () => {
    addToCart({
      id: `${product.id}-${selectedColor.toLowerCase()}`,
      name: `${product.name} : ${selectedColor.toUpperCase()}`,
      price: product.price,
      quantity: 1,
      category: "Shoes",
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
    <div className="min-h-screen bg-white text-[#050505]">
      
      <div className="flex flex-col lg:flex-row w-full max-w-[2000px] mx-auto">
        
        {/* LEFT: Cover Image */}
        <div className="w-full lg:w-[55%] flex flex-col relative z-10 bg-[#fafafa]">
          <div className="w-full h-[60vh] lg:h-screen sticky top-0 overflow-hidden flex items-center justify-center">
            <motion.img
              src={foundProduct.image}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover object-center origin-center"
            />
            <div className="absolute inset-0 bg-black/5 pointer-events-none" />
          </div>
        </div>

        {/* RIGHT: Sticky Product Details */}
        <div className="w-full lg:w-[45%] relative z-20 bg-white">
          <div data-lenis-prevent className="lg:sticky lg:top-0 lg:h-screen overflow-y-auto scrollbar-hide px-8 md:px-16 lg:px-24 py-24 lg:py-32 flex flex-col">
            
            {/* Title & Price */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-12"
            >
              <h1 className={`text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-[0.85] mb-6 ${syne.className}`}>
                {product.name}
              </h1>
              <p className={`text-xl md:text-2xl font-light text-[#050505]/70 ${outfit.className}`}>
                €{product.price}
              </p>
            </motion.div>

            {/* Description */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className={`text-[#050505]/60 leading-relaxed font-light text-sm md:text-base mb-16 max-w-lg ${outfit.className}`}
            >
              {product.desc}
            </motion.p>

            {/* Color Selector */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mb-10"
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`text-[10px] font-bold uppercase tracking-[0.2em] text-[#050505]/40 ${syne.className}`}>Color</span>
                <span className={`text-xs font-medium ${outfit.className}`}>{selectedColor}</span>
              </div>
              <div className="flex gap-4">
                {colors.map(color => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className="relative w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  >
                    <span 
                      className="w-10 h-10 rounded-full border border-black/10 shadow-inner" 
                      style={{ backgroundColor: color.hex }}
                    />
                    {selectedColor === color.name && (
                      <motion.div 
                        layoutId="color-ring"
                        className="absolute inset-0 rounded-full border border-[#050505]"
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Size Selector */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mb-16"
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`text-[10px] font-bold uppercase tracking-[0.2em] text-[#050505]/40 ${syne.className}`}>Size (EU)</span>
                <button className={`text-[10px] uppercase tracking-wider text-[#050505]/40 hover:text-[#050505] transition-colors underline underline-offset-4 ${syne.className}`}>
                  Size Guide
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2 md:gap-3 max-w-lg">
                {sizes.map(size => (
                  <button 
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`py-3 md:py-4 text-sm md:text-base font-light border transition-all duration-300 ${
                      selectedSize === size 
                        ? 'border-[#050505] bg-[#050505] text-white' 
                        : 'border-[#050505]/10 text-[#050505] hover:border-[#050505]/40 hover:bg-[#fafafa]'
                    } ${outfit.className}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Add to Cart Button */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mb-24 max-w-lg flex items-center gap-4"
            >
              <motion.button
                onClick={handleAddToCart}
                whileHover="hover"
                disabled={isAdded}
                className="relative flex-1 overflow-hidden bg-[#050505] text-white py-5 md:py-6 rounded-full flex justify-center items-center group cursor-pointer disabled:opacity-80"
              >
                <motion.div 
                  variants={{
                    hover: { y: "0%" },
                    initial: { y: "100%" }
                  }}
                  initial="initial"
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 bg-white"
                />
                <span className={`relative z-10 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mix-blend-difference text-white flex items-center gap-3 ${syne.className}`}>
                  {isAdded ? (
                    <>
                      <Check className="w-4 h-4" /> Added to Selection
                    </>
                  ) : (
                    "Add to Selection"
                  )}
                </span>
              </motion.button>
              
              <button 
                onClick={() => toggleWishlist({ ...foundProduct, category: "Shoes" })}
                className="w-[60px] h-[60px] shrink-0 border border-black/10 rounded-full flex items-center justify-center hover:bg-black/5 hover:border-black/30 transition-all duration-300 group"
              >
                <Heart className={`w-5 h-5 transition-colors duration-300 ${isInWishlist(foundProduct.id) ? 'fill-black text-black' : 'text-black/60 group-hover:text-black'}`} />
              </button>
            </motion.div>

            {/* Accordions / Extra Info */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="border-t border-[#050505]/10 pt-16 space-y-16 max-w-xl pb-32"
            >
              {/* Details Section */}
              <div className="group cursor-default">
                <h3 className={`text-xs font-bold uppercase tracking-[0.2em] mb-6 flex items-center justify-between ${syne.className}`}>
                  Details & Materials
                </h3>
                <ul className={`space-y-4 text-sm font-light text-[#050505]/60 leading-relaxed ${outfit.className}`}>
                  <li className="flex gap-4 border-b border-[#050505]/5 pb-4"><span className="w-24 font-medium text-[#050505]">Upper</span> Hand-milled aeroknit fabric for seamless breathability.</li>
                  <li className="flex gap-4 border-b border-[#050505]/5 pb-4"><span className="w-24 font-medium text-[#050505]">Sole</span> Graviton-injected foam with dynamic energy return.</li>
                  <li className="flex gap-4 border-b border-[#050505]/5 pb-4"><span className="w-24 font-medium text-[#050505]">Lining</span> Thermal microfleece adapting to body temperature.</li>
                  <li className="flex gap-4 pb-4"><span className="w-24 font-medium text-[#050505]">Origin</span> Designed and prototyped in Paris. Assembled in Italy.</li>
                </ul>
              </div>
              
              {/* Reviews Section */}
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h3 className={`text-xs font-bold uppercase tracking-[0.2em] ${syne.className}`}>
                    Client Reviews
                  </h3>
                  <div className="flex items-center gap-3">
                    {productReviews.length > 0 && <RatingDots rating={Math.round(productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length)} />}
                    <span className={`text-xs text-[#050505]/40 ${outfit.className}`}>({productReviews.length})</span>
                  </div>
                </div>
                
                <div className="space-y-8">
                  {productReviews.length === 0 ? (
                    <p className={`text-sm font-light text-[#050505]/50 ${outfit.className}`}>No reviews yet. Be the first to share your experience.</p>
                  ) : (
                    productReviews.map((review) => (
                      <ReviewItem 
                        key={review.id}
                        name={review.userName}
                        date={review.date}
                        rating={review.rating}
                        comment={review.comment}
                      />
                    ))
                  )}
                </div>

                <div className="mt-16 bg-[#fafafa] p-8 rounded-2xl border border-black/5">
                  <h4 className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-6 ${syne.className}`}>Write a Review</h4>
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <input 
                      type="text" 
                      placeholder="Your Name" 
                      required
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      className={`w-full bg-white border border-black/5 px-4 py-3 text-sm focus:outline-none focus:border-black/20 transition-colors ${outfit.className}`} 
                    />
                    <textarea 
                      placeholder="Share your experience..." 
                      rows={3} 
                      required
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className={`w-full bg-white border border-black/5 px-4 py-3 text-sm focus:outline-none focus:border-black/20 transition-colors resize-none ${outfit.className}`} 
                    />
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] uppercase tracking-widest text-black/40 font-bold ${syne.className}`}>Rating</span>
                        <div className="flex gap-1.5 cursor-pointer">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button 
                              key={star} 
                              type="button"
                              onClick={() => setReviewRating(star)}
                              className={`w-2 h-2 rounded-full border border-black/30 transition-colors ${star <= reviewRating ? 'bg-black' : 'hover:bg-black/50'}`} 
                            />
                          ))}
                        </div>
                      </div>
                      <button type="submit" className={`text-[10px] bg-black text-white px-6 py-3 rounded-full uppercase tracking-widest font-bold hover:bg-black/80 transition-colors ${syne.className}`}>
                        Submit
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>

          </div>
        </div>

      </div>
      
      {/* Similar Products */}
      <div className="w-full bg-[#fafafa] py-24 md:py-32">
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24">
          <h2 className={`text-2xl md:text-3xl font-bold tracking-tighter uppercase text-black mb-12 ${syne.className}`}>
            Similar Objects
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-10">
            {PRODUCTS.filter(p => p.id !== id).slice(0, 3).map((product, i) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                className="group relative flex flex-col"
              >
                <Link href={`/preview/empire/aero/products/${product.id}`} className="block relative w-full aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-[#EAE9E6] mb-6">
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-700 z-10 pointer-events-none" />
                  <img 
                    src={product.image}
                    alt={`${product.name} ${product.edition}`}
                    className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000"
                  />
                  <div className="absolute top-6 left-6 z-20 flex items-center gap-3 bg-white/40 backdrop-blur-md px-4 py-2 rounded-full border border-black/5 opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <span className={`text-[9px] font-bold uppercase tracking-[0.2em] text-black ${outfit.className}`}>
                      {product.edition}
                    </span>
                  </div>
                </Link>
                <div className="flex flex-col gap-1 px-2">
                  <h3 className={`text-lg font-bold tracking-tighter uppercase text-black ${syne.className}`}>
                    {product.name}
                  </h3>
                  <span className={`text-base font-medium text-black/60 ${outfit.className}`}>
                    €{product.price}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
