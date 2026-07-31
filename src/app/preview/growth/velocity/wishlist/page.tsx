"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import { Database, Zap, Trash2, Heart } from "lucide-react";
import { useVelocity } from "../VelocityContext";

// Reusing the 3D card from home page, modified for Wishlist
function WishlistCard3D({ product }: { product: any }) {
  const { toggleWishlist, addToCart, setIsCartOpen } = useVelocity();
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateXValue = ((y - centerY) / centerY) * -15;
    const rotateYValue = ((x - centerX) / centerX) * 15;
    
    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div className="relative perspective-1000">
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={{ rotateX, rotateY }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative aspect-[3/4] rounded-sm border border-[#00f0ff]/20 bg-[#050505] overflow-visible group"
      >
        <Link href={`/preview/growth/velocity/products/${product.id}`} className="absolute inset-0 z-10" />
        
        <div 
          className="absolute inset-0 bg-[#00f0ff] opacity-0 group-hover:opacity-10 transition-opacity duration-300 blur-xl"
          style={{ transform: "translateZ(-20px)" }}
        />
        
        <div className="absolute inset-0 overflow-hidden" style={{ transform: "translateZ(0px)" }}>
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 mix-blend-lighten"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent opacity-90 pointer-events-none" />
        </div>

        <div 
          className="absolute bottom-6 left-6 right-6 pointer-events-none"
          style={{ transform: "translateZ(30px)" }}
        >
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[#00f0ff] text-[9px] font-bold uppercase tracking-[0.3em] mb-2 font-mono">{product.category}</p>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-tight font-orbitron">{product.name}</h3>
            </div>
          </div>
        </div>

        <div 
          className="absolute top-6 right-6 pointer-events-none"
          style={{ transform: "translateZ(40px)" }}
        >
          <span className="text-[#ff003c] font-black text-lg font-orbitron">${product.price}</span>
        </div>

        {/* Wishlist Actions (z-20 so they are clickable over the link) */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2" style={{ transform: "translateZ(50px)" }}>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(product);
            }}
            className="p-3 bg-[#0a0a0a] border border-[#ff003c]/50 text-[#ff003c] hover:bg-[#ff003c] hover:text-white transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addToCart(product);
              setIsCartOpen(true);
            }}
            className="p-3 bg-[#0a0a0a] border border-[#00f0ff]/50 text-[#00f0ff] hover:bg-[#00f0ff] hover:text-black transition-colors"
          >
            <Zap className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function VelocityWishlistPage() {
  const { wishlist } = useVelocity();

  return (
    <div className="bg-[#050505] min-h-screen pt-32 pb-32 text-white relative overflow-hidden">
      
      {/* Cyber Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", damping: 20 }}
          className="mb-16 border-b border-[#00f0ff]/20 pb-8"
        >
          <div className="flex items-center gap-4 mb-2">
            <Database className="w-8 h-8 text-[#00f0ff]" />
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white font-orbitron drop-shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              Wishlist
            </h1>
          </div>
          <p className="text-white/50 text-xs uppercase tracking-[0.3em] font-space">Your Saved Items</p>
        </motion.div>

        {wishlist.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-32 text-center border border-white/10 bg-white/5"
          >
            <Heart className="w-12 h-12 text-white/20 mx-auto mb-6" />
            <h3 className="text-xl font-black uppercase tracking-widest mb-4 font-orbitron text-white/50">Wishlist Empty</h3>
            <p className="text-white/40 text-xs font-space tracking-widest uppercase mb-8">You haven't saved any items yet.</p>
            <Link 
              href="/preview/growth/velocity/products"
              className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00f0ff] border border-[#00f0ff] px-6 py-3 hover:bg-[#00f0ff] hover:text-black transition-colors"
            >
              Shop Now
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 gap-y-16">
            <AnimatePresence mode="popLayout">
              {wishlist.map((product, index) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", damping: 20, delay: index * 0.05 }}
                  key={product.id}
                >
                  <WishlistCard3D product={product} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

      </div>
    </div>
  );
}
