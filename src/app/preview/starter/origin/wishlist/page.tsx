"use client";

import Link from "next/link";
import { useCart } from "../CartContext";
import { Heart } from "lucide-react";

export default function OriginWishlistPage() {
  const { wishlist, addToCart, toggleWishlist } = useCart();

  return (
    <div className="w-full bg-[#fdfbf7] min-h-screen pt-12 pb-32 px-6">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Page Header */}
        <div className="mb-20">
          <div className="text-[10px] uppercase tracking-widest font-bold text-[#a38c7f] mb-4">Wishlist</div>
          <h1 className="font-serif text-5xl md:text-6xl text-[#402c21] font-bold animate-in slide-in-from-bottom-5 fade-in duration-700">
            Saved Goods
          </h1>
        </div>

        {wishlist.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
            {wishlist.map((product) => (
              <div
                key={product.id}
                className="group flex flex-col gap-4 animate-in fade-in duration-700"
              >
                <Link href={`/preview/starter/origin/products/${product.id}`} className="block relative aspect-[4/5] overflow-hidden bg-[#e5e0dc] rounded-sm">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-[#402c21]/0 group-hover:bg-[#402c21]/5 transition-colors duration-300" />
                </Link>
                <div className="flex flex-col">
                  <div className="text-[10px] uppercase tracking-widest text-[#a38c7f] font-bold mb-1">{product.category}</div>
                  <Link href={`/preview/starter/origin/products/${product.id}`}>
                    <h3 className="font-serif text-xl font-bold text-[#402c21] group-hover:text-[#a38c7f] transition-colors mb-2">{product.name}</h3>
                  </Link>
                  <div className="text-base font-bold text-[#402c21]/80 mb-4">${product.price.toFixed(2)}</div>
                  
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
                      <Heart className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-[#efebe9] rounded-sm">
            <h2 className="font-serif text-2xl text-[#402c21] font-bold mb-4">Your wishlist is empty</h2>
            <p className="text-[#402c21]/70 font-medium mb-8">Save goods you love and they will appear here.</p>
            <Link 
              href="/preview/starter/origin/products"
              className="inline-block bg-[#402c21] text-[#fdfbf7] px-10 py-5 text-xs font-bold tracking-widest uppercase hover:bg-[#a38c7f] transition-colors rounded-sm"
            >
              Explore Ceramics
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
