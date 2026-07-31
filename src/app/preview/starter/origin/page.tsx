"use client";

import Link from "next/link";
import { ALL_PRODUCTS, useCart } from "./CartContext";
import { ArrowRight } from "lucide-react";

export default function OriginHomePage() {
  const { addToCart } = useCart();
  const featuredProducts = ALL_PRODUCTS.slice(0, 4);

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative w-full bg-[#402c21] text-[#fdfbf7] min-h-[100vh] flex items-center pt-16">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=2940&auto=format&fit=crop" 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-30 mix-blend-overlay"
          />
        </div>
        <div className="max-w-[1400px] mx-auto px-6 relative z-10 w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="font-serif text-5xl md:text-7xl font-bold leading-[1.1] mb-6 animate-in slide-in-from-bottom-10 fade-in duration-700">
              Return to <br/> The Source.
            </h1>
            <p className="text-[#fdfbf7]/80 text-lg md:text-xl max-w-md mb-10 leading-relaxed font-medium animate-in slide-in-from-bottom-10 fade-in duration-700 delay-150">
              Goods crafted with intention, deeply rooted in natural materials and timeless design.
            </p>
            <div className="animate-in slide-in-from-bottom-10 fade-in duration-700 delay-300">
              <Link 
                href="/preview/starter/origin/products" 
                className="inline-flex items-center gap-4 bg-[#fdfbf7] text-[#402c21] px-8 py-4 text-sm font-bold tracking-widest uppercase hover:bg-[#a38c7f] hover:text-[#fdfbf7] transition-colors group"
              >
                Shop Collection
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 px-6 bg-[#efebe9]">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#402c21] mb-2">Featured Goods</h2>
              <p className="text-[#402c21]/70 font-medium">Carefully selected staples for everyday living.</p>
            </div>
            <Link 
              href="/preview/starter/origin/products" 
              className="text-sm font-bold uppercase tracking-widest text-[#402c21] hover:text-[#a38c7f] transition-colors border-b-2 border-transparent hover:border-[#a38c7f] pb-1"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <div
                key={product.id}
                className="group flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-5 duration-700"
              >
                <Link href={`/preview/starter/origin/products/${product.id}`} className="block relative aspect-square overflow-hidden bg-[#e5e0dc] rounded-sm">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                </Link>
                <div className="flex flex-col">
                  <div className="text-[10px] uppercase tracking-widest text-[#a38c7f] font-bold mb-1">{product.category}</div>
                  <div className="flex justify-between items-start gap-4">
                    <Link href={`/preview/starter/origin/products/${product.id}`}>
                      <h3 className="font-serif text-lg font-bold text-[#402c21] group-hover:text-[#a38c7f] transition-colors line-clamp-1">{product.name}</h3>
                    </Link>
                    <div className="text-base font-bold text-[#402c21]">${product.price.toFixed(2)}</div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      addToCart(product);
                    }}
                    className="mt-4 border border-[#402c21] text-[#402c21] py-2 text-xs font-bold uppercase tracking-widest hover:bg-[#402c21] hover:text-[#fdfbf7] transition-colors"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Materials Highlight */}
      <section className="py-0 flex flex-col md:flex-row h-auto min-h-[60vh]">
        <div className="w-full md:w-1/2 p-12 md:p-24 bg-[#efebe9] text-[#402c21] flex flex-col justify-center items-start">
          <div className="text-[10px] uppercase tracking-widest font-bold text-[#a38c7f] mb-6">Sourcing</div>
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-8">Honest Materials.</h2>
          <p className="text-[#402c21]/80 text-lg leading-relaxed mb-10 font-medium">
            From vegetable-tanned leathers that develop a rich patina over time, to sustainably harvested walnut wood. We don't believe in shortcuts. Quality is at the heart of everything we make.
          </p>
          <Link 
            href="/preview/starter/origin/about" 
            className="border-b-2 border-[#a38c7f] pb-1 text-[#402c21] hover:text-[#a38c7f] font-bold tracking-widest text-xs uppercase transition-colors"
          >
            Read Our Story
          </Link>
        </div>
        <div className="w-full md:w-1/2 h-[50vh] md:h-auto">
          <img 
            src="https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2940&auto=format&fit=crop" 
            alt="Materials" 
            className="w-full h-full object-cover"
          />
        </div>
      </section>
    </div>
  );
}
