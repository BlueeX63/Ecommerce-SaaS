"use client";

import Link from "next/link";
import { ALL_PRODUCTS, useCart } from "../CartContext";
import { useState } from "react";
import { Heart } from "lucide-react";
import { useCustomization } from "@/hooks/useCustomization";

export default function OriginProductsPage() {
  const { addToCart, searchQuery, toggleWishlist, isInWishlist , currencySymbol } = useCart();
  const [activeCategory, setActiveCategory] = useState<string>("All");
  
  const filteredProducts = ALL_PRODUCTS.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || product.category === activeCategory;
    return matchesSearch && matchesCategory;
  });
  const customData = useCustomization();
  
  const shopTitle = customData?.formData?.shopTitle || "All Goods";
  const rawCategories = customData?.formData?.shopCategories || "All, Accessories, Home, Pantry, Decor, Apparel, Brewing, Apothecary, Office";
  const tCategories = rawCategories.split(",").map((c: string) => c.trim()).filter(Boolean);

  return (
    <div className="w-full bg-[#fdfbf7] min-h-screen pt-12 pb-32 px-6">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Page Header */}
        <div className="mb-20">
          <div className="text-[10px] uppercase tracking-widest font-bold text-[#a38c7f] mb-4">Shop</div>
          <h1 className="font-serif text-5xl md:text-6xl text-[#402c21] font-bold animate-in slide-in-from-bottom-5 fade-in duration-700">
            {shopTitle}
          </h1>
          {searchQuery && (
            <div className="mt-4 text-[#402c21]/70 font-medium">
              Results for "{searchQuery}"
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* Sidebar Filters */}
          <div className="w-full lg:w-1/4 shrink-0">
            <div className="sticky top-32">
              <h3 className="font-bold text-[#402c21] text-xs uppercase tracking-widest mb-6">Categories</h3>
              <ul className="flex flex-col gap-4 text-[#402c21]/80 font-medium">
                {tCategories.map((cat: string) => (
                  <li key={cat}>
                    <button 
                      onClick={() => setActiveCategory(cat)}
                      className={`hover:text-[#402c21] transition-colors ${activeCategory === cat ? 'text-[#402c21] font-bold underline underline-offset-4 decoration-[#a38c7f] decoration-2' : ''}`}
                    >
                      {cat}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Product Grid */}
          <div className="w-full lg:w-3/4">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="group flex flex-col gap-4 animate-in fade-in duration-700"
                  >
                    <Link href={`/templates/origin/products/${product.id}`} className="block relative aspect-[4/5] overflow-hidden bg-[#e5e0dc] rounded-sm">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-[#402c21]/0 group-hover:bg-[#402c21]/5 transition-colors duration-300" />
                    </Link>
                    <div className="flex flex-col">
                      <div className="text-[10px] uppercase tracking-widest text-[#a38c7f] font-bold mb-1">{product.category}</div>
                      <Link href={`/templates/origin/products/${product.id}`}>
                        <h3 className="font-serif text-xl font-bold text-[#402c21] group-hover:text-[#a38c7f] transition-colors mb-2">{product.name}</h3>
                      </Link>
                      <div className="text-base font-bold text-[#402c21]/80 mb-4">{currencySymbol}{product.price.toFixed(2)}</div>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            addToCart(product);
                          }}
                          className="flex-1 border-2 border-[#402c21] text-[#402c21] py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#402c21] hover:text-[#fdfbf7] transition-colors"
                        >
                          Add to Cart
                        </button>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            toggleWishlist(product);
                          }}
                          className="w-12 shrink-0 flex items-center justify-center border-2 border-[#402c21] text-[#402c21] hover:bg-[#402c21] hover:text-[#fdfbf7] transition-colors"
                        >
                          <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center bg-[#efebe9] rounded-sm">
                <h2 className="font-serif text-2xl text-[#402c21] font-bold mb-4">No goods found.</h2>
                <p className="text-[#402c21]/70 font-medium">Please adjust your search or category filter.</p>
                <button 
                  onClick={() => { setActiveCategory("All"); }}
                  className="mt-8 border-b-2 border-[#402c21] pb-1 text-sm font-bold uppercase tracking-widest text-[#402c21]"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
