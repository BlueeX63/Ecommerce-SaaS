"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Trash2, ShoppingBag } from "lucide-react";
import { useShop } from "../ShopContext";

export default function NexusProWishlistPage() {
  const { wishlist, toggleWishlist, addToCart } = useShop();

  return (
    <div className="flex flex-col w-full bg-[#0a0a0a] text-[#ededed] pt-32 pb-32 min-h-screen">
      <section className="px-6 md:px-12 max-w-7xl mx-auto w-full mb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="text-[#d4af37] text-xs font-bold uppercase tracking-[0.3em] mb-6 block">
            Saved Items
          </span>
          <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9] mb-8">
            Wishlist.
          </h1>
        </motion.div>
      </section>

      <section className="px-6 md:px-12 max-w-7xl mx-auto w-full">
        {wishlist.length === 0 ? (
          <div className="py-32 text-center border-t border-white/10">
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">Nothing Saved Yet</h3>
            <p className="text-white/50 text-sm mb-8">Keep track of items you love by adding them to your wishlist.</p>
            <Link 
              href="/preview/growth/nexus-pro/products"
              className="inline-block px-8 py-4 bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-[#d4af37] hover:text-white transition-colors rounded-full"
            >
              Explore Collection
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 gap-y-16 pt-8 border-t border-white/10">
            <AnimatePresence>
              {wishlist.map((product, index) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  key={product.id}
                  className="group flex flex-col"
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-lg mb-6 bg-white/5">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                    <button 
                      onClick={() => toggleWishlist(product)}
                      className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-red-500 hover:text-white transition-colors z-10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <Link href={`/preview/growth/nexus-pro/products/${product.id}`}>
                        <h3 className="text-xl font-bold mb-1 hover:text-[#d4af37] transition-colors">{product.name}</h3>
                      </Link>
                      <p className="text-sm text-white/50">{product.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">${product.price.toFixed(2)}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      addToCart(product, 1);
                    }}
                    className="w-full py-4 bg-white/10 text-white font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-[#d4af37] hover:text-black transition-colors rounded-full"
                  >
                    <ShoppingBag className="w-4 h-4" /> Move to Cart
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
}
