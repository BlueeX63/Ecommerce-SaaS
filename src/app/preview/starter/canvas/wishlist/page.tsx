"use client";

import Link from "next/link";
import { useCart, ALL_PRODUCTS } from "../CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";

export default function CanvasWishlistPage() {
  const { wishlist, toggleWishlist } = useCart();
  
  return (
    <div className="flex flex-col w-full bg-black text-white min-h-screen pt-32">
      
      {/* Header */}
      <section className="px-6 md:px-12 w-full flex flex-col md:flex-row justify-between items-start md:items-end gap-8 pb-12 border-b border-white/20">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-8">
            [ Saved Objects ]
          </div>
          <h1 className="font-serif text-5xl md:text-8xl tracking-tighter uppercase leading-[0.8]">
            Wishlist.
          </h1>
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/50">
          {wishlist.length} Objects Saved
        </div>
      </section>

      {/* Product Grid */}
      <section className="w-full pb-32">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border-l border-white/10">
          <AnimatePresence mode="popLayout">
            {wishlist.map((product) => (
              <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                key={product.id}
                className="group border-r border-b border-white/10"
              >
                <Link 
                  href={`/preview/starter/canvas/products/${product.id}`}
                  className="block relative overflow-hidden"
                >
                  <div className="aspect-[3/4] overflow-hidden relative">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-[1.5s] ease-out"
                    />
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        toggleWishlist(product);
                      }}
                      className="absolute top-4 right-4 z-10 p-2 text-white hover:text-white/50 transition-colors"
                    >
                      <Heart className="w-5 h-5 fill-current" />
                    </button>
                  </div>
                  <div className="p-6 bg-black flex flex-col justify-between h-32">
                    <h3 className="font-serif text-xl tracking-tight text-white line-clamp-1">{product.name}</h3>
                    <div className="flex justify-between items-end">
                      <p className="text-[10px] tracking-[0.2em] uppercase text-white/50">{product.category}</p>
                      <p className="font-mono text-xs tracking-widest text-white">${product.price.toFixed(2)}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {wishlist.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-48 flex flex-col items-center justify-center text-center px-6"
          >
            <h3 className="font-serif text-4xl italic tracking-tighter text-white mb-6">Empty.</h3>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-12 max-w-sm leading-loose">
              You haven't saved any objects yet.
            </p>
            <Link 
              href="/preview/starter/canvas/products"
              className="border border-white/30 px-8 py-4 text-[10px] uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-colors"
            >
              Browse Archive
            </Link>
          </motion.div>
        )}
      </section>
    </div>
  );
}
