"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Heart, Star, ShoppingBag, ArrowLeft, ArrowRight, Share2, Plus, Minus, Check } from "lucide-react";
import { NEXUS_PRODUCTS, useShop } from "../../ShopContext";

export default function NexusProProductDetailPage() {
  const { id } = useParams();
  const { addToCart, toggleWishlist, isInWishlist , currencySymbol } = useShop();
  const basePath = '/templates/nexus-pro';
  
  const product = NEXUS_PRODUCTS.find(p => p.id === id);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ author: '', rating: 5, content: '' });
  const [localReviews, setLocalReviews] = useState(product?.reviews || []);

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

  const nextImage = () => {
    setDirection(1);
    setCurrentImageIndex((prev) => (prev === product!.images!.length - 1 ? 0 : prev + 1));
  };

  const prevImage = () => {
    setDirection(-1);
    setCurrentImageIndex((prev) => (prev === 0 ? product!.images!.length - 1 : prev - 1));
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.author || !reviewForm.content) return;
    
    const newReview = {
      id: `r_${Date.now()}`,
      author: reviewForm.author,
      rating: reviewForm.rating,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      content: reviewForm.content
    };
    
    setLocalReviews([newReview, ...localReviews]);
    setIsReviewFormOpen(false);
    setReviewForm({ author: '', rating: 5, content: '' });
  };

  const similarProducts = useMemo(() => {
    if (!product) return [];
    return NEXUS_PRODUCTS.filter(p => p.category === product.category && p.id !== product.id).slice(0, 3);
  }, [product]);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
        <div className="text-center">
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">Product Not Found</h1>
          <Link href="/templates/nexus-pro/products" className="text-[#d4af37] text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">
            Return to Archive
          </Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="flex flex-col w-full bg-[#0a0a0a] text-[#ededed] pt-32 pb-32">
      
      <div className="px-6 md:px-12 max-w-7xl mx-auto w-full mb-8">
        <Link href="/templates/nexus-pro/products" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Collection
        </Link>
      </div>

      <section className="px-6 md:px-12 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 mb-32">
        
        {/* Images */}
        <div className="lg:col-span-7 flex flex-col gap-8 relative">
          {(product.images && product.images.length > 2) ? (
            <div className="relative w-full aspect-[3/4] md:aspect-square lg:aspect-[4/5] rounded-xl overflow-hidden bg-white/5">
              <AnimatePresence initial={false} custom={direction}>
                <motion.img 
                  key={currentImageIndex}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 }
                  }}
                  src={product.images[currentImageIndex]} 
                  alt={`${product.name} ${currentImageIndex + 1}`} 
                  className="absolute inset-0 w-full h-full object-cover" 
                />
              </AnimatePresence>
              <button 
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/80 transition-colors z-10 flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/80 transition-colors z-10 flex items-center justify-center"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="w-full aspect-[3/4] md:aspect-square lg:aspect-[4/5] rounded-xl overflow-hidden bg-white/5"
              >
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              </motion.div>
              {product.hoverImage && (
                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="w-full aspect-[3/4] md:aspect-square lg:aspect-[4/5] rounded-xl overflow-hidden bg-white/5"
                >
                  <img src={product.hoverImage} alt={`${product.name} detail`} className="w-full h-full object-cover" />
                </motion.div>
              )}
            </>
          )}
        </div>

        {/* Info */}
        <div className="lg:col-span-5 relative">
          <div className="sticky top-32">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[#d4af37] text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block">{product.brand}</span>
                  <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-tight">{product.name}</h1>
                </div>
                <button onClick={() => toggleWishlist(product)} className="text-white/50 hover:text-red-500 transition-colors p-2">
                  <Heart className={`w-6 h-6 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-8">
                <span className="text-3xl font-bold">{currencySymbol}{product.price.toFixed(2)}</span>
                <div className="flex items-center gap-1 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                  <Star className="w-3 h-3 text-[#d4af37] fill-[#d4af37]" />
                  <span className="text-xs font-bold">{product.rating}</span>
                  <span className="text-xs text-white/50 ml-1">({localReviews.length} Reviews)</span>
                </div>
              </div>

              <div className="h-px w-full bg-white/10 mb-8" />

              <p className="text-white/70 leading-relaxed font-light mb-12">
                {product.description}
              </p>

              <div className="space-y-6 mb-12">
                <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest text-white/50">
                  <span>Quantity</span>
                </div>
                <div className="flex items-center justify-between border border-white/20 p-2 rounded-full w-48">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-lg">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handleAddToCart}
                  className={`flex-1 py-5 rounded-full font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all duration-300 ${isAdded ? 'bg-green-500 text-black' : 'bg-white text-black hover:bg-[#d4af37] hover:text-white'}`}
                >
                  {isAdded ? (
                    <><Check className="w-5 h-5" /> Added</>
                  ) : (
                    <><ShoppingBag className="w-5 h-5" /> Add to Cart</>
                  )}
                </button>
              </div>

              <div className="mt-12 space-y-4 text-xs font-bold uppercase tracking-widest text-white/50">
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#d4af37]" /> Free global shipping on orders over $200
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#d4af37]" /> 30-day return policy
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="px-6 md:px-12 max-w-7xl mx-auto w-full border-t border-white/10 pt-32 mb-32">
        <div className="flex justify-between items-end mb-16 border-b border-white/10 pb-8">
          <div>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">Reviews</h2>
            <div className="flex items-center gap-2 mt-4 text-[#d4af37]">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm font-bold text-white">{product.rating} Average</span>
            </div>
          </div>
          <button 
            onClick={() => setIsReviewFormOpen(!isReviewFormOpen)}
            className="hidden md:block px-8 py-3 border border-white/20 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
          >
            {isReviewFormOpen ? 'Cancel' : 'Write a Review'}
          </button>
        </div>

        {isReviewFormOpen && (
          <>
            <p className="text-sm text-black/70 mb-4">
              To ensure the authenticity of our reviews, you can only review products you have purchased and received.
            </p>
            <Link 
              href={`${basePath}/orders`}
              className="inline-block bg-[#111111] text-white py-4 px-6 text-xs font-bold tracking-widest uppercase hover:bg-[#FF4D00] transition-colors"
            >
              Go to Orders
            </Link>
          </>
        )}

        {localReviews.length === 0 ? (
          <div className="text-center py-16 text-white/50 text-sm">
            No reviews yet. Be the first to review this product.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {localReviews.map(review => (
              <motion.div 
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white/5 p-8 rounded-xl"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="font-bold text-lg mb-1">{review.author}</h4>
                    <p className="text-[10px] uppercase tracking-widest text-white/50">{review.date}</p>
                  </div>
                  <div className="flex text-[#d4af37]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-white/20'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-white/70 leading-relaxed font-light text-sm">"{review.content}"</p>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <section className="px-6 md:px-12 max-w-7xl mx-auto w-full border-t border-white/10 pt-32">
          <div className="flex justify-between items-end mb-16 border-b border-white/10 pb-8">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">Similar Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {similarProducts.map((product, index) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="group cursor-pointer flex flex-col"
              >
                <Link href={`/templates/nexus-pro/products/${product.id}`}>
                  <div className="relative aspect-[3/4] overflow-hidden rounded-lg mb-6 bg-white/5">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                  </div>
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold mb-1 group-hover:text-[#d4af37] transition-colors">{product.name}</h3>
                      <p className="text-xs text-white/50">{product.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{currencySymbol}{product.price.toFixed(2)}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
