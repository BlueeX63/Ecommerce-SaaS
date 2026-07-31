"use client";

import { useParams } from "next/navigation";
import { ALL_PRODUCTS, useCart } from "../../CartContext";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";

export default function CanvasProductDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const product = ALL_PRODUCTS.find((p) => p.id === id);
  const { addToCart, toggleWishlist, isInWishlist, reviews, addReview } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white px-6">
        <h1 className="font-serif text-6xl italic tracking-tighter mb-8">Not Found.</h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-12">The object you seek is unavailable.</p>
        <Link 
          href="/preview/starter/canvas/products"
          className="border border-white/20 px-8 py-4 text-[10px] uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-colors"
        >
          Return to Archive
        </Link>
      </div>
    );
  }

  const handleAdd = () => {
    setIsAdding(true);
    addToCart(product, 1);
    setTimeout(() => setIsAdding(false), 1000);
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
    <div className="flex flex-col lg:flex-row min-h-screen w-full bg-black text-white relative pt-24 lg:pt-0">
      
      {/* Left: Cinematic Image Viewer */}
      <div className="w-full lg:w-1/2 lg:h-screen lg:sticky top-0 border-b lg:border-b-0 lg:border-r border-white/10 relative overflow-hidden group">
        <Link 
          href="/preview/starter/canvas/products"
          className="absolute top-8 left-8 z-20 text-[10px] uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors mix-blend-difference"
        >
          [ Back ]
        </Link>
        
        <motion.img
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          src={product.image}
          alt={product.name}
          className="w-full h-[60vh] lg:h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-[2s] ease-out"
        />
      </div>

      {/* Right: Product Details */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 md:px-16 lg:px-24 py-24 min-h-screen">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-xl w-full mx-auto lg:mx-0"
        >
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-12 flex justify-between items-center border-b border-white/10 pb-4">
            <span>{product.category}</span>
            <span>ID: {product.id}</span>
          </div>
          
          <h1 className="font-serif text-5xl md:text-7xl tracking-tighter uppercase leading-[0.8] mb-12">
            {product.name}
          </h1>
          
          <div className="font-mono text-sm tracking-[0.1em] text-white/80 mb-16">
            ${product.price.toFixed(2)}
          </div>

          <div className="flex gap-8 mb-12 border-b border-white/10 pb-4">
            <button 
              onClick={() => setActiveTab("details")}
              className={`text-[10px] uppercase tracking-[0.2em] pb-4 relative transition-colors ${activeTab === "details" ? "text-white" : "text-white/30 hover:text-white/60"}`}
            >
              Details
              {activeTab === "details" && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-[1px] bg-white" />
              )}
            </button>
            <button 
              onClick={() => setActiveTab("shipping")}
              className={`text-[10px] uppercase tracking-[0.2em] pb-4 relative transition-colors ${activeTab === "shipping" ? "text-white" : "text-white/30 hover:text-white/60"}`}
            >
              Logistics
              {activeTab === "shipping" && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-[1px] bg-white" />
              )}
            </button>
          </div>
          
          <div className="text-[10px] uppercase tracking-[0.2em] leading-loose text-white/50 min-h-[120px] mb-16">
            <AnimatePresence mode="wait">
              {activeTab === "details" ? (
                <motion.div
                  key="details"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p>
                    A rigorous study in form and utility. Manufactured without compromise. The presence of this object commands the space it occupies. 
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="shipping"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p>
                    Global dispatch within 48 hours. Returns accepted within a 14-day window, provided the artifact remains untouched.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex gap-4 w-full">
            <button 
              onClick={handleAdd}
              disabled={isAdding}
              className={`flex-1 border py-6 text-[10px] uppercase tracking-[0.2em] transition-all duration-500 ${
                isAdding 
                  ? "bg-white text-black border-white" 
                  : "border-white/30 hover:border-white hover:bg-white hover:text-black"
              }`}
            >
              {isAdding ? "Acquired" : "Acquire Object"}
            </button>
            <button 
              onClick={() => toggleWishlist(product)}
              className="border border-white/30 w-[72px] flex items-center justify-center hover:border-white hover:bg-white hover:text-black transition-all duration-500"
            >
              <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Brutalist Reviews Section */}
          <div className="mt-32 border-t border-white/20 pt-16">
            <h2 className="font-serif text-4xl uppercase tracking-tighter mb-12">Critique & Discourse</h2>
            
            <div className="mb-16">
              {productReviews.length === 0 ? (
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono">No data submitted. Await input.</p>
              ) : (
                <div className="space-y-8">
                  {productReviews.map(review => (
                    <div key={review.id} className="border border-white/10 p-6 bg-white/5">
                      <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
                        <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-white/80">USR_{review.userName}</span>
                        <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-white/40">{review.date}</span>
                      </div>
                      <div className="flex gap-2 mb-6">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className={`w-3 h-3 border border-white ${i < review.rating ? 'bg-white' : 'bg-transparent'}`} />
                        ))}
                      </div>
                      <p className="text-xs uppercase tracking-[0.1em] font-mono text-white/70 leading-relaxed">
                         {review.comment}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border border-white/20 p-8">
              <h3 className="font-serif text-2xl uppercase tracking-tighter mb-8">Submit Data</h3>
              <form onSubmit={handleReviewSubmit} className="space-y-8">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-mono text-white/50 mb-4"> IDENTIFIER</label>
                  <input 
                    type="text" 
                    required 
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    className="w-full bg-transparent border border-white/20 p-4 text-xs font-mono focus:outline-none focus:border-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-mono text-white/50 mb-4"> METRIC</label>
                  <div className="flex gap-4">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setReviewRating(val)}
                        className={`w-8 h-8 border border-white transition-colors ${val <= reviewRating ? 'bg-white' : 'bg-transparent hover:bg-white/20'}`}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-mono text-white/50 mb-4"> LOG</label>
                  <textarea 
                    required 
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={4}
                    className="w-full bg-transparent border border-white/20 p-4 text-xs font-mono focus:outline-none focus:border-white transition-colors resize-none"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-white text-black py-6 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-black hover:text-white border border-white transition-colors"
                >
                  Execute Submission
                </button>
              </form>
            </div>
          </div>

        </motion.div>
      </div>
      
    </div>
  );
}
