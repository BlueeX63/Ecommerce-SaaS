"use client";

import { useParams, useRouter } from "next/navigation";
import { ALL_PRODUCTS, useCart } from "../../CartContext";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Plus, Minus, Heart } from "lucide-react";
import { useState } from "react";

export default function EssenceProductDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { addToCart, toggleWishlist, isInWishlist, reviews, addReview } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  
  const product = ALL_PRODUCTS.find(p => p.id === id);

  if (!product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#F3EDE2]">
        <h1 className="font-serif text-3xl mb-4 text-[#4A3F35]">Product not found</h1>
        <Link href="/templates/essence/products" className="text-xs uppercase tracking-[0.2em] border-b border-[#4A3F35] pb-1 text-[#4A3F35] hover:text-[#A69684] hover:border-[#A69684] transition-colors">
          Return to Shop
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    // Add multiple times based on quantity for simplicity in this demo,
    // though the CartContext addToCart currently adds 1 at a time.
    // Let's just add it once for the demo, or modify CartContext.
    // For now, loop to add the correct quantity
    for(let i=0; i<quantity; i++) {
      addToCart(product);
    }
  };

  const productReviews = reviews.filter(r => r.productId === product.id);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewName && reviewComment) {
      addReview(product.id, reviewRating, reviewComment, reviewName);
      setReviewName("");
      setReviewComment("");
      setReviewRating(5);
    }
  };

  return (
    <div className="w-full bg-[#F3EDE2] min-h-screen">
      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row">
        
        {/* Left Content - Sticky Image */}
        <div className="w-full md:w-1/2 md:sticky md:top-24 h-[50vh] md:h-[calc(100vh-6rem)] p-6 md:p-12 pb-0 md:pb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full relative overflow-hidden bg-[#E3D8C8]"
          >
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>

        {/* Right Content - Scrollable Details */}
        <div className="w-full md:w-1/2 p-6 md:p-16 lg:p-24 flex flex-col justify-center min-h-[50vh] md:min-h-[calc(100vh-6rem)]">
          <Link href="/templates/essence/products" className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#4A3F35]/50 hover:text-[#4A3F35] transition-colors mb-12 w-fit">
            <ArrowLeft className="w-3 h-3" /> Back to Collection
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#A69684] mb-4">
              {product.category}
            </div>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#4A3F35] leading-tight mb-6">
              {product.name}
            </h1>
            <div className="text-2xl text-[#4A3F35]/80 font-serif italic mb-10">
              ${product.price.toFixed(2)}
            </div>

            <div className="h-px w-full bg-[#4A3F35]/10 mb-10" />

            <p className="text-[#4A3F35]/70 text-sm leading-relaxed mb-12 max-w-md">
              Designed with a profound appreciation for natural materials and minimalist forms, this piece brings a sense of grounded tranquility to any space. Hand-finished by master artisans to ensure each item is unique.
            </p>

            <div className="flex flex-col xl:flex-row gap-4 mb-16">
              <div className="flex gap-4 w-full xl:w-auto shrink-0">
                {/* Quantity Selector */}
                <div className="flex items-center justify-between border border-[#4A3F35]/20 px-4 py-3 flex-1 xl:w-32 shrink-0">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="text-[#4A3F35]/50 hover:text-[#4A3F35] transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-medium text-[#4A3F35]">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="text-[#4A3F35]/50 hover:text-[#4A3F35] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Wishlist Button */}
                <button 
                  onClick={() => toggleWishlist(product)}
                  className="shrink-0 flex justify-center items-center px-6 border border-[#4A3F35]/20 text-[#4A3F35] hover:bg-[#4A3F35] hover:text-[#F3EDE2] transition-colors"
                >
                  <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Add to Cart Button */}
              <button 
                onClick={handleAddToCart}
                className="w-full flex-grow bg-[#4A3F35] text-[#F3EDE2] py-4 text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#332B25] transition-colors whitespace-nowrap"
              >
                Add to Cart
              </button>
            </div>

            {/* Accordions (Dummy) */}
            <div className="border-t border-[#4A3F35]/10">
              <div className="py-6 border-b border-[#4A3F35]/10 flex justify-between items-center cursor-pointer group">
                <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#4A3F35]">Details & Materials</span>
                <Plus className="w-4 h-4 text-[#4A3F35]/50 group-hover:text-[#4A3F35] transition-colors" />
              </div>
              <div className="py-6 border-b border-[#4A3F35]/10 flex justify-between items-center cursor-pointer group">
                <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#4A3F35]">Shipping & Returns</span>
                <Plus className="w-4 h-4 text-[#4A3F35]/50 group-hover:text-[#4A3F35] transition-colors" />
              </div>
              <div className="py-6 border-b border-[#4A3F35]/10 flex justify-between items-center cursor-pointer group">
                <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#4A3F35]">Care Instructions</span>
                <Plus className="w-4 h-4 text-[#4A3F35]/50 group-hover:text-[#4A3F35] transition-colors" />
              </div>
            </div>

            {/* Reviews Section */}
            <div className="mt-24">
              <h2 className="font-serif text-3xl text-[#4A3F35] mb-10">Client Experiences</h2>
              
              {productReviews.length === 0 ? (
                <p className="text-[#4A3F35]/70 italic font-serif mb-12">No experiences shared yet. Be the first to reflect on this piece.</p>
              ) : (
                <div className="space-y-12 mb-16">
                  {productReviews.map(review => (
                    <div key={review.id} className="border-b border-[#4A3F35]/10 pb-8">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#4A3F35]">{review.userName}</span>
                        <span className="text-xs text-[#4A3F35]/50">{review.date}</span>
                      </div>
                      <div className="flex gap-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-[#A69684]' : 'fill-transparent'} stroke-[#A69684]`} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-[#4A3F35]/80 font-serif leading-relaxed">"{review.comment}"</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-[#E3D8C8]/30 p-8">
                <h3 className="font-serif text-2xl text-[#4A3F35] mb-8">Share Your Experience</h3>
                <form onSubmit={handleReviewSubmit} className="space-y-6">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#4A3F35]/70 mb-2">Name</label>
                    <input 
                      type="text" 
                      required 
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      className="w-full bg-transparent border-b border-[#4A3F35]/20 py-3 text-sm focus:outline-none focus:border-[#4A3F35] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#4A3F35]/70 mb-2">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="text-[#A69684]"
                        >
                          <svg className={`w-6 h-6 ${star <= reviewRating ? 'fill-[#A69684]' : 'fill-transparent'} stroke-[#A69684]`} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#4A3F35]/70 mb-2">Thoughts</label>
                    <textarea 
                      required 
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={4}
                      className="w-full bg-transparent border border-[#4A3F35]/20 p-4 text-sm focus:outline-none focus:border-[#4A3F35] transition-colors resize-none"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-[#4A3F35] text-[#F3EDE2] py-4 text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#332B25] transition-colors"
                  >
                    Submit
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
