"use client";

import { motion } from "framer-motion";
import { Plus, Star, ArrowLeft, Heart } from "lucide-react";
import { useCart, ALL_PRODUCTS } from "../../CartContext";
import Link from "next/link";
import { notFound, usePathname } from "next/navigation";
import { useState, use } from "react";

export default function ProductDetailsPage({ params, initialProduct }: { params: Promise<{ id: string }>, initialProduct?: any }) {
  const unwrappedParams = use(params);
  const { addToCart, currencySymbol, toggleWishlist, isInWishlist, reviews, addReview, basePath } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  

  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const product = initialProduct ? {
    id: initialProduct.product_id,
    name: initialProduct.product_name,
    price: initialProduct.base_price,
    image: initialProduct.product_images?.[0]?.image_url || initialProduct.three_d_model_url || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=2000&auto=format&fit=crop",
    category: initialProduct.categories?.category_name || "Uncategorized",
    description: initialProduct.description,
  } : ALL_PRODUCTS.find((p) => p.id === unwrappedParams.id);

  if (!product) {
    notFound();
  }

  const productReviews = reviews.filter(r => r.productId === product.id);
  const averageRating = productReviews.length > 0 
    ? productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length 
    : 5;

  // Get similar products (same category, excluding current)
  const similarProducts = ALL_PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id
  ).slice(0, 4);

  const handleAddToCart = () => {
    setIsAdding(true);
    addToCart(product);
    setTimeout(() => setIsAdding(false), 500);
  };

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
    <div className="px-6 py-12 md:py-20 max-w-7xl mx-auto w-full">
      {/* Back to Shop */}
      <Link 
        href={`${basePath}/products`} 
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black/50 hover:text-[#111111] transition-colors mb-12"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Collection
      </Link>

      {/* Product Hero */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 mb-32">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="aspect-[3/4] bg-[#F8F7F5] relative overflow-hidden rounded-sm"
        >
          <img 
            src={product.image} 
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover mix-blend-multiply"
          />
        </motion.div>

        <div className="flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <p className="text-xs font-bold tracking-widest uppercase text-black/50 mb-4">
              {product.category}
            </p>
            <h1 className="font-heading text-4xl lg:text-6xl tracking-tighter text-[#111111] mb-6">
              {product.name}
            </h1>
            <p className="text-2xl font-medium text-[#111111] mb-8">
              {currencySymbol}{product.price.toFixed(2)}
            </p>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-8">
              <div className="flex text-[#111111]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.round(averageRating) ? 'fill-current' : 'fill-transparent'} stroke-current stroke-[1.5px]`} />
                ))}
              </div>
              <span className="text-sm font-medium text-black/60">({productReviews.length} Reviews)</span>
            </div>

            <p className="text-black/70 leading-relaxed mb-12 max-w-md text-sm md:text-base">
              The quintessential {product.name.toLowerCase()}, designed with longevity and absolute comfort in mind. Woven from premium, sustainably sourced materials, it features a tailored fit that drapes perfectly and feels incredibly soft against the skin. An essential building block for any minimalist wardrobe.
            </p>

            <div className="flex gap-4 max-w-md">
              <button 
                onClick={handleAddToCart}
                disabled={isAdding}
                className={`flex-1 bg-[#111111] text-white py-5 text-xs font-bold tracking-widest uppercase hover:bg-[#FF4D00] transition-colors flex items-center justify-center gap-3 ${isAdding ? 'scale-95 opacity-80' : 'scale-100'}`}
                style={{ transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
              >
                {isAdding ? 'Adding...' : 'Add to Cart'} <Plus className="w-4 h-4" />
              </button>
              
              <button 
                onClick={() => toggleWishlist(product)}
                className="w-16 shrink-0 flex justify-center items-center border-2 border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white transition-colors"
              >
                <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
              </button>
            </div>
            
            <div className="mt-8 flex flex-col gap-4 text-xs font-medium text-black/50 tracking-wide uppercase">
              <p>Free global shipping on orders over {currencySymbol}100.</p>
              <p>30-day effortless returns.</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mb-32">
        <div className="flex items-end justify-between border-b border-black/10 pb-6 mb-12">
          <h2 className="font-heading text-3xl tracking-tighter text-[#111111]">
            Customer Reviews
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-7">
            {productReviews.length === 0 ? (
              <p className="text-sm text-black/50 font-medium">No reviews yet. Be the first to review this product.</p>
            ) : (
              <div className="space-y-10">
                {productReviews.map(review => (
                  <div key={review.id} className="pb-10 border-b border-black/5 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-4">
                      <p className="font-bold text-sm text-[#111111] uppercase tracking-widest">{review.userName}</p>
                      <p className="text-xs text-black/40 font-medium">{review.date}</p>
                    </div>
                    <div className="flex text-[#111111] mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'fill-transparent'} stroke-current`} />
                      ))}
                    </div>
                    <p className="text-sm text-black/70 leading-relaxed">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="lg:col-span-5">
            <div className="bg-[#F8F7F5] p-8 rounded-sm">
              <h3 className="font-heading text-2xl tracking-tighter text-[#111111] mb-6">Write a Review</h3>
              <p className="text-sm text-black/70 mb-4">
                To ensure the authenticity of our reviews, you can only review products you have purchased and received.
              </p>
              <Link 
                href={`${basePath}/orders`}
                className="inline-block bg-[#111111] text-white py-4 px-6 text-xs font-bold tracking-widest uppercase hover:bg-[#FF4D00] transition-colors"
              >
                Go to Orders
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-end justify-between border-b border-black/10 pb-6 mb-12">
            <h2 className="font-heading text-3xl tracking-tighter text-[#111111]">
              You might also like
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {similarProducts.map((simProduct, i) => (
              <Link href={`${basePath}/products/${simProduct.id}`} key={simProduct.id} className="group flex flex-col">
                <div className="aspect-[3/4] bg-[#F8F7F5] mb-4 relative overflow-hidden rounded-sm">
                  <img 
                    src={simProduct.image} 
                    alt={simProduct.name}
                    className="absolute inset-0 w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-700 ease-[0.16,1,0.3,1]"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-sm text-[#111111] mb-1 group-hover:text-[#FF4D00] transition-colors">{simProduct.name}</h3>
                    <p className="text-xs text-black/50 font-medium">{simProduct.category}</p>
                  </div>
                  <p className="text-sm font-medium text-[#111111]">{currencySymbol}{simProduct.price.toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
