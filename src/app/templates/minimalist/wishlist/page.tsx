"use client";

import { motion } from "framer-motion";
import { Plus, Heart } from "lucide-react";
import { useCart } from "../CartContext";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function StarterWishlistPage() {
  const { wishlist, addToCart, currencySymbol, toggleWishlist, basePath } = useCart();
  

  return (
    <div className="px-6 py-16 md:py-24 max-w-7xl mx-auto w-full min-h-[60vh]">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 border-b border-black/5 pb-8">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-heading text-4xl md:text-5xl tracking-tighter text-[#111111] mb-4"
          >
            Wishlist
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-black/50 text-sm max-w-md"
          >
            Your curated collection of minimalist essentials.
          </motion.p>
        </div>
      </div>

      {wishlist.length > 0 ? (
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16"
        >
          {wishlist.map((product, i) => (
            <motion.div 
              layout
              key={product.id} 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            >
              <Link href={`${basePath}/products/${product.id}`} className="group flex flex-col">
                <div className="aspect-[3/4] bg-[#F8F7F5] mb-6 relative overflow-hidden rounded-sm">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="absolute inset-0 w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-700 ease-[0.16,1,0.3,1]"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
                  
                  {/* Add to cart overlay button */}
                  <div className="absolute bottom-4 left-4 right-4 flex gap-2 translate-y-[150%] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className="flex-1 bg-white/90 backdrop-blur-sm text-[#111111] py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#FF4D00] hover:text-white transition-colors"
                    >
                      Add to Cart <Plus className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleWishlist(product);
                      }}
                      className="w-12 flex items-center justify-center bg-white/90 backdrop-blur-sm text-[#111111] hover:bg-[#FF4D00] hover:text-white transition-colors"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-sm text-[#111111] mb-1">{product.name}</h3>
                    <p className="text-xs text-black/50 font-medium">{product.category}</p>
                  </div>
                  <p className="text-sm font-medium text-[#111111]">{currencySymbol}{product.price.toFixed(2)}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="font-heading text-2xl text-[#111111] mb-4">Your wishlist is empty</h2>
          <p className="text-black/50 mb-8">Save items you love and they will appear here.</p>
          <Link 
            href={`${basePath}/products`}
            className="inline-block bg-[#111111] text-white px-8 py-4 text-xs font-bold tracking-widest uppercase hover:bg-[#FF4D00] transition-colors"
          >
            Shop Collection
          </Link>
        </div>
      )}
    </div>
  );
}
