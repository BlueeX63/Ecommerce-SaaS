"use client";

import { useParams, useRouter } from "next/navigation";
import { ALL_PRODUCTS, useCart } from "../../CartContext";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Heart } from "lucide-react";
import { useState } from "react";

export default function OriginProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { addToCart, toggleWishlist, isInWishlist, reviews, addReview } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  
  const product = ALL_PRODUCTS.find(p => p.id === id);

  if (!product) {
    return (
      <div className="w-full bg-[#fdfbf7] min-h-[70vh] flex flex-col items-center justify-center">
        <h1 className="font-serif text-3xl text-[#402c21] font-bold mb-4">Product Not Found</h1>
        <Link href="/preview/starter/origin/products" className="text-sm font-bold uppercase tracking-widest text-[#a38c7f] border-b border-[#a38c7f] pb-1">
          Back to Shop
        </Link>
      </div>
    );
  }

  // Find related products
  const relatedProducts = ALL_PRODUCTS.filter(p => p.category === product.category && p.id !== product.id).slice(0, 3);

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
    <div className="w-full bg-[#fdfbf7] min-h-screen pt-12 pb-32">
      <div className="max-w-[1400px] mx-auto px-6">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-[#402c21]/50 mb-12">
          <button onClick={() => router.back()} className="flex items-center gap-1 hover:text-[#402c21] transition-colors">
            <ArrowLeft className="w-3 h-3" /> Back
          </button>
          <span>/</span>
          <Link href="/preview/starter/origin/products" className="hover:text-[#402c21] transition-colors">Shop</Link>
          <span>/</span>
          <span className="text-[#a38c7f]">{product.category}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          
          {/* Product Image */}
          <div className="relative aspect-square lg:aspect-[4/5] bg-[#efebe9] rounded-sm overflow-hidden animate-in fade-in duration-700">
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Product Details */}
          <div className="flex flex-col animate-in fade-in slide-in-from-bottom-5 duration-700 delay-150 lg:sticky lg:top-32">
            <div className="text-[10px] uppercase tracking-widest font-bold text-[#a38c7f] mb-4">{product.category}</div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#402c21] mb-4">{product.name}</h1>
            <div className="text-2xl font-bold text-[#402c21]/80 mb-8">${product.price.toFixed(2)}</div>
            
            <div className="prose prose-sm text-[#402c21]/80 font-medium mb-10 leading-relaxed">
              <p>
                Crafted with intention. This piece represents our commitment to quality materials and timeless design. Designed to age beautifully and serve you faithfully for years to come.
              </p>
              <ul className="list-disc pl-4 space-y-2 mt-4 text-[#402c21]/70">
                <li>Ethically sourced materials</li>
                <li>Hand-finished details</li>
                <li>Lifetime guarantee on craftsmanship</li>
              </ul>
            </div>

            <div className="flex flex-col xl:flex-row gap-4 mb-12">
              <div className="flex gap-4 w-full xl:w-auto shrink-0">
                <div className="flex items-center border-2 border-[#402c21] flex-1 xl:w-32 rounded-sm shrink-0">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 flex items-center justify-center text-[#402c21] hover:bg-[#efebe9] transition-colors font-bold"
                  >
                    -
                  </button>
                  <div className="flex-1 text-center font-bold text-[#402c21]">{quantity}</div>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-12 h-12 flex items-center justify-center text-[#402c21] hover:bg-[#efebe9] transition-colors font-bold"
                  >
                    +
                  </button>
                </div>
                
                <button 
                  onClick={() => toggleWishlist(product)}
                  className="w-12 h-12 shrink-0 flex items-center justify-center border-2 border-[#402c21] text-[#402c21] hover:bg-[#402c21] hover:text-[#fdfbf7] transition-colors rounded-sm"
                >
                  <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                </button>
              </div>
              
              <button 
                onClick={() => {
                  for (let i = 0; i < quantity; i++) {
                    addToCart(product);
                  }
                  setQuantity(1);
                }}
                className="w-full flex-1 bg-[#402c21] text-[#fdfbf7] h-12 flex items-center justify-center text-xs font-bold uppercase tracking-widest hover:bg-[#a38c7f] transition-colors rounded-sm whitespace-nowrap"
              >
                Add to Cart
              </button>
            </div>

            <div className="border-t border-[#402c21]/10 pt-8 mt-4">
              <div className="flex items-center justify-between py-4 border-b border-[#402c21]/10 cursor-pointer group">
                <h3 className="font-bold text-[#402c21] text-sm uppercase tracking-widest">Shipping & Returns</h3>
                <ChevronRight className="w-5 h-5 text-[#402c21]/50 group-hover:text-[#402c21] transition-colors" />
              </div>
              <div className="flex items-center justify-between py-4 border-b border-[#402c21]/10 cursor-pointer group">
                <h3 className="font-bold text-[#402c21] text-sm uppercase tracking-widest">Care Instructions</h3>
                <ChevronRight className="w-5 h-5 text-[#402c21]/50 group-hover:text-[#402c21] transition-colors" />
              </div>
            </div>

          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-32 pt-20 border-t border-[#402c21]/10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
            
            {/* Display Reviews */}
            <div>
              <h2 className="font-serif text-3xl font-bold text-[#402c21] mb-10">Kind Words</h2>
              
              {productReviews.length === 0 ? (
                <p className="text-[#402c21]/60 italic font-medium">Be the first to share your thoughts on this piece.</p>
              ) : (
                <div className="space-y-10">
                  {productReviews.map(review => (
                    <div key={review.id} className="border-b border-[#402c21]/10 pb-8 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-[#402c21] uppercase tracking-widest text-xs">{review.userName}</span>
                        <span className="text-xs text-[#402c21]/50">{review.date}</span>
                      </div>
                      <div className="flex gap-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Heart key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-[#a38c7f]' : 'fill-transparent'} text-[#a38c7f]`} />
                        ))}
                      </div>
                      <p className="text-sm text-[#402c21]/80 leading-relaxed font-medium">
                        "{review.comment}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Write a Review */}
            <div className="bg-[#efebe9] p-8 lg:p-12 rounded-sm">
              <h3 className="font-serif text-2xl font-bold text-[#402c21] mb-8">Share Your Thoughts</h3>
              <form onSubmit={handleReviewSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-[#402c21]/70 mb-2">Name</label>
                  <input 
                    type="text" 
                    required 
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    className="w-full bg-[#fdfbf7] border border-[#402c21]/20 p-3 text-sm focus:outline-none focus:border-[#402c21] transition-colors rounded-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-[#402c21]/70 mb-2">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setReviewRating(val)}
                        className="text-[#a38c7f]"
                      >
                        <Heart className={`w-5 h-5 ${val <= reviewRating ? 'fill-[#a38c7f]' : 'fill-transparent'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-[#402c21]/70 mb-2">Review</label>
                  <textarea 
                    required 
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={4}
                    className="w-full bg-[#fdfbf7] border border-[#402c21]/20 p-3 text-sm focus:outline-none focus:border-[#402c21] transition-colors resize-none rounded-sm"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-[#402c21] text-[#fdfbf7] h-12 flex items-center justify-center text-xs font-bold uppercase tracking-widest hover:bg-[#a38c7f] transition-colors rounded-sm"
                >
                  Post Review
                </button>
              </form>
            </div>

          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-32 pt-20 border-t border-[#402c21]/10">
            <h2 className="font-serif text-3xl font-bold text-[#402c21] mb-10">You may also like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedProducts.map(p => (
                <div key={p.id} className="group flex flex-col gap-4">
                  <Link href={`/preview/starter/origin/products/${p.id}`} className="block relative aspect-square overflow-hidden bg-[#e5e0dc] rounded-sm">
                    <img 
                      src={p.image} 
                      alt={p.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </Link>
                  <div className="flex flex-col">
                    <Link href={`/preview/starter/origin/products/${p.id}`}>
                      <h3 className="font-serif text-lg font-bold text-[#402c21] group-hover:text-[#a38c7f] transition-colors">{p.name}</h3>
                    </Link>
                    <div className="text-sm font-bold text-[#402c21]/70">${p.price.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
