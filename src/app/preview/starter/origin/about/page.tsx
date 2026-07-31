"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function OriginAboutPage() {
  return (
    <div className="w-full bg-[#fdfbf7] min-h-screen pt-16 pb-32">
      <div className="max-w-[1400px] mx-auto px-6">
        
        {/* Header */}
        <div className="mb-24 text-center max-w-3xl mx-auto">
          <div className="text-[10px] uppercase tracking-widest font-bold text-[#a38c7f] mb-6">Our Roots</div>
          <h1 className="font-serif text-5xl md:text-6xl text-[#402c21] leading-tight font-bold mb-8 animate-in slide-in-from-bottom-10 fade-in duration-700">
            Rooted in tradition, built for today.
          </h1>
        </div>

        {/* Story Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24 items-center mb-32">
          <div className="aspect-[4/5] bg-[#efebe9] overflow-hidden rounded-sm animate-in fade-in duration-1000">
            <img 
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2940&auto=format&fit=crop" 
              alt="Craftsmanship"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col gap-8 text-[#402c21]/80 text-base leading-relaxed font-medium">
            <h2 className="font-serif text-3xl font-bold text-[#402c21] mb-2">The Journey</h2>
            <p>
              Origin began in a small workshop in 2026. What started as a personal quest to find enduring, well-made everyday goods evolved into a collective dedication to craftsmanship.
            </p>
            <p>
              We believe that we are defined by the objects we choose to surround ourselves with. Our mission is to offer an alternative to the disposable culture by providing goods that are designed to last a lifetime, developing character and history with each use.
            </p>
            <p>
              Every piece in our catalog is thoughtfully sourced. We partner directly with artisans and small factories who share our commitment to ethical production, sustainable materials, and fair labor practices.
            </p>
            
            <div className="mt-8 p-8 bg-[#efebe9] border-l-4 border-[#a38c7f]">
              <h3 className="font-serif text-xl font-bold text-[#402c21] mb-2">Our Promise</h3>
              <p className="text-sm">
                No shortcuts. No compromises. Just honest goods that serve a purpose and tell a story.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-24 bg-[#402c21] text-[#fdfbf7] rounded-sm">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-8">Discover the Collection</h2>
          <Link 
            href="/preview/starter/origin/products" 
            className="inline-flex items-center gap-4 bg-[#fdfbf7] text-[#402c21] px-8 py-4 text-sm font-bold tracking-widest uppercase hover:bg-[#a38c7f] hover:text-[#fdfbf7] transition-colors group"
          >
            Shop Now
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        
      </div>
    </div>
  );
}
