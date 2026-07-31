"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useCart } from "../CartContext";
import { Heart } from "lucide-react";

export default function EssenceWishlistPage() {
  const { wishlist, toggleWishlist, addToCart } = useCart();
  
  return (
    <div className="w-full bg-[#F3EDE2] min-h-screen pt-12 pb-32 px-6 md:px-12">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Page Header */}
        <div className="mb-20 text-center flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#A69684] mb-6"
          >
            Saved Items
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-serif text-4xl md:text-6xl text-[#4A3F35]"
          >
            Wishlist
          </motion.h1>
        </div>

        {/* Product Grid */}
        {wishlist.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
            {wishlist.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: idx * 0.05 }}
                className="group cursor-pointer"
              >
                <Link href={`/preview/starter/essence/products/${product.id}`}>
                  <div className="relative aspect-[3/4] mb-6 overflow-hidden bg-[#E3D8C8]">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
                    
                    {/* Hover Add to Cart Button */}
                    <div className="absolute bottom-0 left-0 w-full p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.16,1,0.3,1] flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          addToCart(product);
                        }}
                        className="flex-1 py-4 bg-[#F3EDE2]/90 backdrop-blur-md text-[#4A3F35] text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#4A3F35] hover:text-[#F3EDE2] transition-colors"
                      >
                        Add to Cart
                      </button>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          toggleWishlist(product);
                        }}
                        className="w-12 flex items-center justify-center bg-[#F3EDE2]/90 backdrop-blur-md text-[#4A3F35] hover:bg-[#4A3F35] hover:text-[#F3EDE2] transition-colors"
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  </div>
                </Link>
                <div className="flex flex-col gap-1 text-center">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[#A69684]">{product.category}</div>
                  <h3 className="font-serif text-lg text-[#4A3F35]">{product.name}</h3>
                  <div className="text-sm text-[#4A3F35]/70">${product.price.toFixed(2)}</div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-32 text-center">
            <h2 className="font-serif text-2xl text-[#4A3F35] mb-4">Your wishlist is empty</h2>
            <p className="text-[#4A3F35]/60 mb-8">Save items you love and they will appear here.</p>
            <Link 
              href="/preview/starter/essence/products"
              className="inline-block bg-[#4A3F35] text-[#F3EDE2] px-10 py-5 text-xs font-bold tracking-[0.2em] uppercase hover:bg-[#332B25] transition-colors"
            >
              Shop Collection
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
