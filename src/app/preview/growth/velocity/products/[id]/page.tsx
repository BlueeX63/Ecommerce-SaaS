"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Zap, Target, Activity, Check, Heart } from "lucide-react";
import Link from "next/link";
import { VELOCITY_PRODUCTS, useVelocity } from "../../VelocityContext";

export default function VelocityProductDetails() {
  const { id } = useParams();
  const router = useRouter();
  const { addToCart, setIsCartOpen, toggleWishlist, wishlist } = useVelocity();
  
  const product = VELOCITY_PRODUCTS.find(p => p.id === id);
  const [selectedSize, setSelectedSize] = useState("L");
  const [isAdding, setIsAdding] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!product) {
      router.push('/preview/growth/velocity/products');
    }
  }, [product, router]);

  if (!product) return null;

  const handleAddToCart = () => {
    setIsAdding(true);
    addToCart(product, selectedSize);
    setTimeout(() => {
      setIsAdding(false);
      setIsCartOpen(true);
    }, 600);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - left, y: e.clientY - top });
  };

  return (
    <div className="min-h-screen bg-[#050505] pt-32 pb-32 text-white relative overflow-hidden">
      
      {/* Tech Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,0,60,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,0,60,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0 [transform:perspective(1000px)_rotateX(70deg)_translateY(-200px)_translateZ(-200px)] opacity-50" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        
        <Link 
          href="/preview/growth/velocity/products"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#00f0ff] hover:text-white transition-colors mb-12 font-space"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          
          {/* Image Display */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className="relative"
          >
            <div 
              onMouseMove={handleMouseMove}
              className="relative aspect-square overflow-hidden border border-[#00f0ff]/30 bg-[#0a0a0a] group"
            >
              <div 
                className="absolute w-[300px] h-[300px] bg-[#00f0ff]/20 rounded-full blur-[100px] pointer-events-none transition-transform duration-300 ease-out z-10"
                style={{ transform: `translate(${mousePos.x - 150}px, ${mousePos.y - 150}px)` }}
              />
              <img 
                src={product.image} 
                alt={product.name}
                className="absolute inset-0 w-full h-full object-cover mix-blend-lighten grayscale group-hover:grayscale-0 transition-all duration-700"
              />
              {/* Scanline effect */}
              <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50" />
            </div>

            <div className="flex gap-4 mt-6">
              {[product.image, product.image, product.image].map((img, i) => (
                <div key={i} className="w-20 h-20 border border-white/10 hover:border-[#00f0ff] cursor-pointer relative overflow-hidden transition-colors">
                  <img src={img} alt="thumbnail" className="w-full h-full object-cover mix-blend-lighten grayscale opacity-50 hover:opacity-100 hover:grayscale-0 transition-all" />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Product Data */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", damping: 20, delay: 0.2 }}
            className="flex flex-col"
          >
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-5 h-5 text-[#ff003c]" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ff003c] font-space">{product.brand} // {product.category}</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4 font-orbitron leading-none text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              {product.name}
            </h1>
            
            <div className="flex items-center gap-6 mb-8 border-b border-white/10 pb-8">
              <span className="text-3xl font-black text-[#00f0ff] font-orbitron">${product.price.toFixed(2)}</span>
              <div className="flex items-center gap-2 px-3 py-1 bg-[#ff003c]/10 border border-[#ff003c]/30 text-[#ff003c]">
                <Activity className="w-4 h-4" />
                <span className="text-xs font-bold font-space">RATING {product.rating}/5.0</span>
              </div>
            </div>

            <p className="text-sm text-white/60 leading-relaxed font-space mb-12">
              {product.description}
            </p>

            <div className="mb-12">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-4 flex items-center gap-2">
                <Target className="w-3 h-3" /> Select Configuration
              </h3>
              <div className="flex flex-wrap gap-4">
                {["S", "M", "L", "XL"].map(size => (
                  <button 
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-14 h-14 flex items-center justify-center font-bold uppercase tracking-widest text-xs transition-all ${
                      selectedSize === size 
                        ? 'border-2 border-[#00f0ff] text-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.3)]' 
                        : 'border border-white/10 text-white/40 hover:border-white/50'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-12 p-6 bg-white/5 border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-[#ff003c]" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4 font-orbitron">Technical Specs</h3>
              <ul className="space-y-2 text-sm font-space text-white/70">
                {product.specs.map((spec, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-[#00f0ff]">&gt;</span> {spec}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={handleAddToCart}
                disabled={isAdding}
                className={`flex-1 py-6 font-black uppercase tracking-[0.3em] text-sm flex items-center justify-center gap-3 transition-all relative overflow-hidden group ${
                  isAdding ? 'bg-white text-black' : 'bg-[#ff003c] text-white hover:bg-[#00f0ff] hover:text-black shadow-[0_0_30px_rgba(255,0,60,0.4)] hover:shadow-[0_0_40px_rgba(0,240,255,0.6)]'
                }`}
              >
                {isAdding ? (
                  <>
                    <Check className="w-5 h-5 animate-bounce" /> Processing...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 group-hover:scale-125 transition-transform" /> Add to Cart
                  </>
                )}
              </button>

              <button
                onClick={() => toggleWishlist(product)}
                className={`w-20 flex shrink-0 border-2 transition-colors items-center justify-center ${
                  wishlist.some(item => item.id === product.id) 
                    ? 'border-[#ff003c] text-[#ff003c] bg-[#ff003c]/10' 
                    : 'border-[#00f0ff]/30 text-white/50 hover:border-[#00f0ff] hover:text-[#00f0ff]'
                }`}
              >
                <Heart className={`w-6 h-6 ${wishlist.some(item => item.id === product.id) ? 'fill-current' : ''}`} />
              </button>
            </div>

          </motion.div>
        </div>

        {/* Field Reports */}
        <div className="mt-32 pt-16 border-t border-[#00f0ff]/20">
          <div className="flex items-center gap-4 mb-12">
            <Activity className="w-8 h-8 text-[#00f0ff]" />
            <h2 className="text-3xl font-black uppercase tracking-widest text-white font-orbitron">Customer Reviews</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1">
              <div className="bg-[#0a0a0a] border border-[#ff003c]/30 p-6 relative">
                <div className="absolute top-0 left-0 w-2 h-full bg-[#ff003c]" />
                <h3 className="text-xs font-black uppercase tracking-widest text-[#ff003c] mb-6 font-orbitron">Write a Review</h3>
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <input type="text" placeholder="YOUR NAME" className="w-full bg-black border border-white/10 p-3 text-xs uppercase tracking-widest text-white focus:outline-none focus:border-[#00f0ff]" />
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(star => (
                      <button key={star} type="button" className="text-white/30 hover:text-[#00f0ff] focus:text-[#00f0ff]"><Target className="w-5 h-5" /></button>
                    ))}
                  </div>
                  <textarea placeholder="YOUR REVIEW..." rows={3} className="w-full bg-black border border-white/10 p-3 text-xs tracking-widest text-white focus:outline-none focus:border-[#00f0ff] resize-none" />
                  <button className="w-full bg-transparent border border-[#00f0ff] text-[#00f0ff] font-bold uppercase tracking-widest py-3 text-xs hover:bg-[#00f0ff] hover:text-black transition-colors">
                    Submit Review
                  </button>
                </form>
              </div>
            </div>
            <div className="lg:col-span-2 space-y-6">
              {[
                { id: 'OP-42', rating: 5, date: '2026-07-26', text: 'Flawless integration with my neural link. The materials withstand extreme heat. Essential for Sector 4 drops.' },
                { id: 'OP-99', rating: 4, date: '2026-07-21', text: 'Solid build quality. Took a hit from an EMP and circuitry remained intact. Sizing runs slightly large.' }
              ].map((review, i) => (
                <div key={i} className="bg-white/5 border border-white/10 p-6">
                  <div className="flex justify-between items-start mb-4 border-b border-white/10 pb-4">
                    <div>
                      <p className="text-xs font-bold text-[#00f0ff] uppercase tracking-widest mb-1">{review.id}</p>
                      <p className="text-[10px] text-white/50 uppercase tracking-widest">{review.date}</p>
                    </div>
                    <div className="flex gap-1 text-[#ff003c]">
                      {[...Array(5)].map((_, j) => (
                        <Target key={j} className={`w-4 h-4 ${j < review.rating ? 'opacity-100' : 'opacity-30'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-white/70 font-space leading-relaxed">{review.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related Tech */}
        <div className="mt-32 pt-16 border-t border-[#00f0ff]/20">
          <div className="flex items-center gap-4 mb-12">
            <Zap className="w-8 h-8 text-[#ff003c]" />
            <h2 className="text-3xl font-black uppercase tracking-widest text-white font-orbitron">Related Tech</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {VELOCITY_PRODUCTS.filter(p => p.id !== product.id).slice(0, 3).map(related => (
              <Link key={related.id} href={`/preview/growth/velocity/products/${related.id}`} className="group bg-[#0a0a0a] border border-white/10 overflow-hidden relative block hover:border-[#00f0ff]/50 transition-colors">
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img src={related.image} alt={related.name} className="w-full h-full object-cover grayscale mix-blend-lighten group-hover:grayscale-0 transition-all duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent opacity-90 pointer-events-none" />
                </div>
                <div className="p-4 absolute bottom-0 left-0 w-full pointer-events-none">
                  <p className="text-[9px] text-[#00f0ff] uppercase tracking-[0.2em] mb-1 font-mono">{related.category}</p>
                  <h4 className="text-sm font-black text-white uppercase tracking-widest font-orbitron truncate">{related.name}</h4>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
