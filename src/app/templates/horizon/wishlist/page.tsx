"use client";

import { motion } from "framer-motion";
import { useHorizon } from "../HorizonContext";
import { Heart, Trash2, ShoppingCart } from "lucide-react";
import Link from "next/link";

export default function HorizonWishlist() {
  const { wishlist, toggleWishlist, addToCart , currencySymbol } = useHorizon();

  return (
    <div className="bg-[#FAFAFA] min-h-screen text-[#111] pt-40 pb-32">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-24 flex flex-col items-start"
        >
          <span className="font-outfit text-[10px] uppercase tracking-[0.4em] text-black/40 mb-6 block font-medium">
            Personal Collection
          </span>
          <h1 className="font-cormorant text-5xl md:text-7xl font-light tracking-tight leading-none text-[#111]">
            Your <span className="italic font-medium">Wishlist</span>.
          </h1>
        </motion.div>

        {wishlist.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center border border-black/5 bg-white shadow-[0_20px_40px_rgba(0,0,0,0.02)]">
             <Heart className="w-8 h-8 text-black/20 mb-8" strokeWidth={1} />
             <h2 className="font-cormorant text-3xl font-light text-black/60 mb-6 italic">No assets saved.</h2>
             <Link href="/templates/horizon/products" className="inline-flex items-center gap-4 group pointer-events-auto cursor-none">
               <span className="font-outfit text-[10px] uppercase tracking-[0.3em] text-[#111] group-hover:text-black/60 transition-colors duration-500 font-medium pb-1 border-b border-black group-hover:border-black/20">
                 Explore Archive
               </span>
             </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-24">
            {wishlist.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="group flex flex-col pointer-events-auto"
              >
                <Link href={`/templates/horizon/products/${product.id}`} className="block relative overflow-hidden mb-8" style={{ cursor: "none" }}>
                  <div className="relative aspect-[4/5] bg-[#F5F5F5] overflow-hidden">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    />
                  </div>
                </Link>
                
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-cormorant text-3xl font-medium text-[#111] group-hover:opacity-70 transition-opacity duration-500 mb-2">
                      {product.name}
                    </h3>
                    <p className="font-outfit text-[10px] font-medium text-black/40 tracking-[0.2em] uppercase mb-6">{currencySymbol}{product.price.toFixed(2)}</p>
                  </div>
                  
                  <div className="flex gap-4 pt-6 border-t border-black/5">
                    <button 
                      onClick={() => addToCart(product)}
                      className="flex-1 bg-black text-white py-4 font-outfit text-[9px] font-medium uppercase tracking-[0.3em] hover:bg-black/80 transition-colors flex items-center justify-center gap-3 pointer-events-auto"
                      style={{ cursor: "none" }}
                    >
                      <ShoppingCart className="w-3 h-3" strokeWidth={2} /> Add to Cart
                    </button>
                    <button 
                      onClick={() => toggleWishlist(product)}
                      className="w-12 flex-shrink-0 bg-white border border-black/10 text-black flex items-center justify-center hover:bg-black/5 hover:text-red-500 transition-colors pointer-events-auto"
                      style={{ cursor: "none" }}
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
