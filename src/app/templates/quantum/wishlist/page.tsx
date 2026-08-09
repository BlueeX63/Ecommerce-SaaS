"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Heart, ShoppingBag, X } from "lucide-react";
import { useQuantum } from "../QuantumContext";

export default function QuantumWishlistPage() {
  const { wishlist, toggleWishlist, addToCart } = useQuantum();

  return (
    <div className="min-h-screen bg-[#F9F9FB] pt-32 pb-24 px-6 md:px-12">
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 flex items-end justify-between border-b border-gray-200 pb-8"
        >
          <div>
            <h1 className="font-playfair text-4xl md:text-6xl font-bold text-[#121212] mb-4">Saved Artifacts</h1>
            <p className="font-inter text-gray-500">
              {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} in your personal gallery.
            </p>
          </div>
          <Heart className="w-12 h-12 text-[#FF4500]/20 hidden md:block" />
        </motion.div>

        {wishlist.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-8">
              <Heart className="w-10 h-10 text-gray-400 stroke-[1.5]" />
            </div>
            <h2 className="font-playfair text-2xl font-bold text-[#121212] mb-4">Your gallery is empty</h2>
            <p className="font-inter text-gray-500 max-w-md mb-8">
              Explore our collection of conceptual art and homeware to find pieces that resonate with your space.
            </p>
            <Link href="/templates/quantum/products">
              <button className="px-8 py-4 bg-[#121212] text-white rounded-full font-bold font-inter uppercase tracking-widest text-sm hover:bg-[#111111] transition-colors shadow-xl">
                Discover Collection
              </button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {wishlist.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                  transition={{ duration: 0.4 }}
                  className="group relative bg-white rounded-3xl p-4 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col"
                >
                  <button
                    onClick={() => toggleWishlist(item)}
                    className="absolute top-8 right-8 z-20 w-8 h-8 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <Link href={`/templates/quantum/products/${item.id}`} className="block relative aspect-square rounded-2xl overflow-hidden bg-gray-100 mb-6">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </Link>

                  <div className="flex-1 flex flex-col">
                    <div className="text-xs uppercase tracking-widest text-[#111111] font-bold mb-2">
                      {item.category}
                    </div>
                    <Link href={`/templates/quantum/products/${item.id}`}>
                      <h3 className="font-playfair text-xl font-bold text-[#121212] group-hover:text-[#111111] transition-colors mb-2">
                        {item.name}
                      </h3>
                    </Link>
                    <div className="font-inter text-gray-500 font-medium mb-6">
                      ${item.price.toFixed(2)}
                    </div>
                    
                    <div className="mt-auto">
                      <button
                        onClick={() => addToCart(item)}
                        className="w-full py-3 bg-gray-50 hover:bg-[#111111] hover:text-white text-[#121212] rounded-xl font-bold font-inter uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-2 group/btn"
                      >
                        <ShoppingBag className="w-4 h-4 group-hover/btn:-translate-y-0.5 transition-transform" />
                        Move to Cart
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
