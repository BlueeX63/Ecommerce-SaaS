"use client";

import { use, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Heart, ArrowLeft, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QUANTUM_PRODUCTS, useQuantum } from "../../QuantumContext";

export default function QuantumProductDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { addToCart, wishlist, toggleWishlist } = useQuantum();
  const [activeTab, setActiveTab] = useState("description");

  const product = QUANTUM_PRODUCTS.find(p => p.id === resolvedParams.id);

  if (!product) {
    notFound();
  }

  const isWishlisted = wishlist.some(item => item.id === product.id);

  return (
    <div className="min-h-screen bg-[#F9F9FB]">
      <div className="flex flex-col lg:flex-row h-full">
        {/* Left: Sticky Image Gallery */}
        <div className="w-full lg:w-1/2 lg:sticky lg:top-0 lg:h-screen bg-gray-100 relative overflow-hidden group">
          <Link href="/preview/growth/quantum/products" className="absolute top-32 left-8 z-20 flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-md rounded-full text-sm font-bold uppercase tracking-wider hover:bg-white hover:text-[#111111] transition-all font-inter shadow-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          
          <motion.img 
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            src={product.image} 
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        </div>

        {/* Right: Scrolling Details */}
        <div className="w-full lg:w-1/2 pt-32 pb-24 px-8 lg:px-16 xl:px-24">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-xl mx-auto lg:mx-0"
          >
            <div className="flex items-center gap-4 mb-6">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#111111] bg-[#111111]/10 px-3 py-1 rounded-full">
                {product.category}
              </span>
              <div className="flex items-center gap-1 text-yellow-400">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-inter text-gray-600 ml-1 font-medium">{product.rating} (128 Reviews)</span>
              </div>
            </div>

            <h1 className="font-playfair text-5xl md:text-6xl font-bold text-[#121212] mb-6 leading-tight">
              {product.name}
            </h1>
            
            <p className="font-inter text-3xl text-gray-500 font-light mb-12">
              ${product.price.toFixed(2)}
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              <button
                onClick={() => addToCart(product)}
                className="flex-1 py-5 bg-[#121212] hover:bg-[#111111] text-white rounded-full font-bold font-inter uppercase tracking-widest text-sm transition-all shadow-xl hover:shadow-[#111111]/40 group flex items-center justify-center gap-3 overflow-hidden relative"
              >
                <motion.span 
                  className="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-[shimmer_1s_forwards]"
                  style={{ transform: "skewX(-20deg)" }}
                />
                Add to Cart
              </button>
              <button
                onClick={() => toggleWishlist(product)}
                className={`w-full sm:w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all ${
                  isWishlisted 
                    ? 'border-[#FF4500] bg-[#FF4500]/10 text-[#FF4500]' 
                    : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-[#121212]'
                }`}
              >
                <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-current scale-110' : ''} transition-transform`} />
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16 py-8 border-y border-gray-200/60">
              <div className="flex flex-col items-center text-center gap-2 text-gray-500">
                <ShieldCheck className="w-6 h-6 text-[#111111]" />
                <span className="font-inter text-sm font-medium">Lifetime Guarantee</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2 text-gray-500">
                <Truck className="w-6 h-6 text-[#111111]" />
                <span className="font-inter text-sm font-medium">Free Global Shipping</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2 text-gray-500">
                <RotateCcw className="w-6 h-6 text-[#111111]" />
                <span className="font-inter text-sm font-medium">30-Day Returns</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-16">
              <div className="flex gap-8 border-b border-gray-200 mb-8 font-playfair font-bold uppercase tracking-wider text-sm">
                <button 
                  onClick={() => setActiveTab('description')}
                  className={`pb-4 relative transition-colors ${activeTab === 'description' ? 'text-[#121212]' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Story
                  {activeTab === 'description' && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#111111]" />
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab('specs')}
                  className={`pb-4 relative transition-colors ${activeTab === 'specs' ? 'text-[#121212]' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Specifications
                  {activeTab === 'specs' && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#111111]" />
                  )}
                </button>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="font-inter text-gray-600 leading-relaxed"
                >
                  {activeTab === 'description' ? (
                    <p>{product.description} Designed by {product.brand}, this artifact represents the pinnacle of contemporary aesthetic thought.</p>
                  ) : (
                    <ul className="space-y-4">
                      <li className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="font-bold text-[#121212]">Brand</span>
                        <span>{product.brand}</span>
                      </li>
                      <li className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="font-bold text-[#121212]">Materials</span>
                        <span className="text-right">{product.materials.join(", ")}</span>
                      </li>
                      <li className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="font-bold text-[#121212]">Origin</span>
                        <span>Designed in Geneva</span>
                      </li>
                    </ul>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Review Section Simulation */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-playfair font-bold text-xl">Curator Notes</h3>
                <button 
                  onClick={() => {
                    const el = document.getElementById('review-form');
                    if (el) el.classList.toggle('hidden');
                  }}
                  className="text-xs font-bold uppercase tracking-wider text-[#111111] hover:text-gray-500 transition-colors border-b border-[#111111] pb-0.5"
                >
                  Write a Review
                </button>
              </div>

              {/* Expandable Form */}
              <div id="review-form" className="hidden mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <h4 className="font-bold text-sm font-inter mb-4 uppercase tracking-widest text-[#111111]">Submit Review</h4>
                <div className="space-y-4">
                  <div className="flex gap-2 text-yellow-400">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-current cursor-pointer hover:scale-110 transition-transform" />)}
                  </div>
                  <input type="text" placeholder="Your Name" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-inter focus:outline-none focus:border-[#111111]" />
                  <textarea placeholder="Share your experience with this artifact..." rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-inter focus:outline-none focus:border-[#111111] resize-none"></textarea>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      const form = document.getElementById('review-form');
                      if (form) form.classList.add('hidden');
                      alert('Review submitted successfully!');
                    }}
                    className="w-full py-3 bg-[#111111] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
                  >
                    Submit
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden shrink-0">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop" className="w-full h-full object-cover" alt="Reviewer" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold font-playfair text-[#121212]">Elena R.</span>
                    <span className="text-xs bg-[#111111]/10 text-[#111111] px-2 py-0.5 rounded font-inter font-bold">Verified</span>
                  </div>
                  <div className="flex gap-1 text-yellow-400 mb-2">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-current" />)}
                  </div>
                  <p className="font-inter text-sm text-gray-600 italic">"An absolute triumph of industrial design. It transforms the energy of the entire room."</p>
                </div>
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  );
}
