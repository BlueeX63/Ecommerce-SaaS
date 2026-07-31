"use client";

import { motion, AnimatePresence } from "framer-motion";
import { HORIZON_PRODUCTS, useHorizon, HorizonReview } from "../../HorizonContext";
import { ArrowLeft, ChevronLeft, ChevronRight, Heart, Maximize2, Star } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function HorizonProductDetail() {
  const params = useParams();
  const { addToCart, toggleWishlist, wishlist } = useHorizon();
  const id = params?.id as string;
  const product = HORIZON_PRODUCTS.find(p => p.id === id) || HORIZON_PRODUCTS[0];
  
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const gallery = product.gallery || [product.image];

  // Local state for reviews to simulate adding a review
  const [reviews, setReviews] = useState<HorizonReview[]>(product.reviews || []);
  const [newReviewText, setNewReviewText] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewName, setNewReviewName] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const isWishlisted = wishlist.some(item => item.id === product.id);

  const handleNextImage = () => {
    setDirection(1);
    setActiveImageIndex((prev) => (prev + 1) % gallery.length);
  };

  const handlePrevImage = () => {
    setDirection(-1);
    setActiveImageIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
  };

  const submitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewText.trim() || !newReviewName.trim()) return;

    setIsSubmittingReview(true);
    setTimeout(() => {
      const newReview: HorizonReview = {
        id: `rev-${Date.now()}`,
        author: newReviewName,
        rating: newReviewRating,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        text: newReviewText
      };
      setReviews(prev => [newReview, ...prev]);
      setNewReviewText("");
      setNewReviewName("");
      setNewReviewRating(5);
      setIsSubmittingReview(false);
    }, 1000);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen text-[#111] pt-32 pb-40">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12">
        
        <Link href="/preview/growth/horizon/products" className="group inline-flex items-center gap-4 pointer-events-auto mb-20" style={{ cursor: "none" }}>
          <ArrowLeft className="w-4 h-4 text-black/40 group-hover:text-black transition-all group-hover:-translate-x-2" strokeWidth={1.5} />
          <span className="font-outfit text-[10px] uppercase tracking-[0.3em] text-black/50 group-hover:text-black transition-colors duration-500 font-medium">
            Return to Archive
          </span>
        </Link>

        <div className="flex flex-col lg:flex-row gap-16 xl:gap-32 items-start">
          
          {/* Product Info - Sticky */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:w-5/12 flex flex-col justify-center lg:sticky lg:top-40 order-2 lg:order-1"
          >
            <div className="flex items-center gap-4 mb-8">
              <span className="font-outfit text-[10px] uppercase tracking-[0.4em] text-black/60 font-medium">
                {product.category}
              </span>
              <span className="w-1 h-1 rounded-full bg-black/20"></span>
              <span className="font-outfit text-[10px] text-black/40 tracking-[0.2em] font-medium uppercase">
                {product.format}
              </span>
            </div>

            <h1 className="font-cormorant text-6xl md:text-8xl font-light leading-[1.1] text-[#111] mb-10 tracking-tight">
              {product.name}
            </h1>

            <p className="font-outfit text-sm font-light leading-loose text-black/60 mb-16 max-w-md">
              {product.description}
            </p>

            <div className="grid grid-cols-2 gap-12 mb-20 border-y border-black/5 py-10 max-w-md">
               <div>
                  <h4 className="font-outfit text-[9px] uppercase tracking-[0.3em] text-black/40 mb-4 font-medium">Specification</h4>
                  <p className="font-outfit font-light text-sm text-[#111]">{product.format}</p>
               </div>
               <div>
                  <h4 className="font-outfit text-[9px] uppercase tracking-[0.3em] text-black/40 mb-4 font-medium">Archive Size</h4>
                  <p className="font-outfit font-light text-sm text-[#111]">{product.fileSize}</p>
               </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-8 max-w-md pointer-events-auto">
              <div className="font-outfit text-4xl font-light text-[#111]">
                ${product.price.toFixed(2)}
              </div>
              <div className="flex gap-4 w-full sm:w-auto flex-1">
                <button 
                  onClick={() => addToCart(product)}
                  style={{ cursor: "none" }}
                  className="flex-1 bg-black text-white py-5 px-8 font-outfit text-[10px] uppercase tracking-[0.3em] hover:bg-black/80 transition-colors duration-500 font-medium pointer-events-auto"
                >
                  Acquire Asset
                </button>
                <button 
                  onClick={() => toggleWishlist(product)}
                  style={{ cursor: "none" }}
                  className="w-16 flex-shrink-0 bg-black/5 text-black flex items-center justify-center hover:bg-black/10 transition-colors duration-500 group pointer-events-auto"
                >
                  <Heart className={`w-4 h-4 stroke-[1.5] ${isWishlisted ? 'fill-black text-black' : 'group-hover:text-black'}`} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Image Gallery & Reviews - Scrolls */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:w-7/12 relative flex flex-col gap-24 order-1 lg:order-2 w-full"
          >
            {/* Sliding Image Gallery */}
            <div className="relative aspect-[4/3] md:aspect-video lg:aspect-[4/3] w-full overflow-hidden bg-[#F5F5F5] group">
              {product.isNew && (
                <div className="absolute top-8 left-8 z-30 text-white bg-black/90 backdrop-blur px-5 py-3 text-[9px] uppercase tracking-[0.3em] font-outfit font-medium">
                  New Release
                </div>
              )}
              
              <AnimatePresence initial={false} custom={direction}>
                <motion.img
                  key={activeImageIndex}
                  src={gallery[activeImageIndex]}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 }
                  }}
                  className="absolute inset-0 w-full h-full object-cover opacity-95"
                />
              </AnimatePresence>
              
              {gallery.length > 1 && (
                <>
                  <button 
                    onClick={handlePrevImage}
                    className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/80 backdrop-blur flex items-center justify-center text-black opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto hover:bg-white hover:scale-105"
                    style={{ cursor: "none" }}
                  >
                    <ChevronLeft className="w-5 h-5 stroke-[1.5]" />
                  </button>
                  <button 
                    onClick={handleNextImage}
                    className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/80 backdrop-blur flex items-center justify-center text-black opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto hover:bg-white hover:scale-105"
                    style={{ cursor: "none" }}
                  >
                    <ChevronRight className="w-5 h-5 stroke-[1.5]" />
                  </button>
                  
                  {/* Indicators */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-3">
                    {gallery.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setDirection(idx > activeImageIndex ? 1 : -1);
                          setActiveImageIndex(idx);
                        }}
                        className={`h-1 transition-all duration-300 pointer-events-auto ${idx === activeImageIndex ? 'w-8 bg-black' : 'w-2 bg-black/30'}`}
                        style={{ cursor: "none" }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Reviews Section */}
            <div className="border-t border-black/5 pt-16 pointer-events-auto">
              <h2 className="font-cormorant text-4xl font-light text-[#111] mb-12">Client Feedback</h2>
              
              <div className="space-y-8 mb-16">
                {reviews.length === 0 ? (
                  <p className="font-outfit text-sm font-light text-black/50 italic">No feedback available for this asset yet.</p>
                ) : (
                  reviews.map(review => (
                    <div key={review.id} className="bg-white p-8 border border-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-outfit font-medium text-sm text-[#111]">{review.author}</h4>
                          <p className="font-outfit text-[10px] text-black/40 tracking-widest uppercase mt-1">{review.date}</p>
                        </div>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-[#F5D061] text-[#F5D061]' : 'text-black/10'}`} strokeWidth={1} />
                          ))}
                        </div>
                      </div>
                      <p className="font-outfit text-sm font-light leading-relaxed text-black/70">
                        "{review.text}"
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Review Form */}
              <div className="bg-[#F5F5F5] p-10">
                <h3 className="font-cormorant text-3xl font-light text-[#111] mb-8">Leave Feedback</h3>
                <form onSubmit={submitReview} className="space-y-8">
                  <div className="flex flex-col gap-2">
                    <label className="font-outfit text-[10px] uppercase tracking-[0.2em] text-black/60 font-medium">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(num => (
                        <button 
                          key={num}
                          type="button"
                          onClick={() => setNewReviewRating(num)}
                          className="p-1 hover:scale-110 transition-transform"
                          style={{ cursor: "none" }}
                        >
                          <Star className={`w-5 h-5 ${num <= newReviewRating ? 'fill-[#F5D061] text-[#F5D061]' : 'text-black/20'}`} strokeWidth={1} />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="relative group">
                      <input 
                        required 
                        type="text" 
                        value={newReviewName}
                        onChange={(e) => setNewReviewName(e.target.value)}
                        placeholder="Name"
                        className="w-full bg-transparent border-b border-black/10 pb-3 font-outfit font-light text-sm text-[#111] focus:outline-none focus:border-black transition-colors peer placeholder-transparent" 
                        style={{ cursor: "none" }}
                      />
                      <label className="absolute left-0 -top-5 text-[10px] uppercase tracking-[0.2em] font-outfit text-black/40 transition-all peer-placeholder-shown:top-0 peer-placeholder-shown:text-sm peer-focus:-top-5 peer-focus:text-[10px] peer-focus:text-black">
                        Your Name
                      </label>
                    </div>
                  </div>

                  <div className="relative group pt-4">
                    <textarea 
                      required 
                      rows={3}
                      value={newReviewText}
                      onChange={(e) => setNewReviewText(e.target.value)}
                      placeholder="Feedback"
                      className="w-full bg-transparent border-b border-black/10 pb-3 font-outfit font-light text-sm text-[#111] focus:outline-none focus:border-black transition-colors peer placeholder-transparent resize-none" 
                      style={{ cursor: "none" }}
                    />
                    <label className="absolute left-0 -top-5 text-[10px] uppercase tracking-[0.2em] font-outfit text-black/40 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:-top-5 peer-focus:text-[10px] peer-focus:text-black">
                      Your Feedback
                    </label>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmittingReview}
                    style={{ cursor: "none" }}
                    className="py-4 px-8 bg-black text-white text-[10px] uppercase tracking-[0.3em] font-outfit font-medium transition-all duration-300 hover:bg-black/80 disabled:opacity-50 mt-4 inline-block"
                  >
                    {isSubmittingReview ? "SUBMITTING..." : "SUBMIT FEEDBACK"}
                  </button>
                </form>
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
