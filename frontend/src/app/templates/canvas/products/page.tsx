"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ProductToolbar, ResultsNote, useProductBrowser, LIGHT_TOOLBAR, DARK_TOOLBAR, type ToolbarTheme } from "@/components/storefront/ProductToolbar";
import { useCart, ALL_PRODUCTS } from "../CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { useCustomization } from "@/hooks/useCustomization";
 export default function ({ initialProducts, initialCustomData }: any) {
  const { currencySymbol, basePath } = useCart();
  const { toggleWishlist, isInWishlist } = useCart();
  const [activeCategory, setActiveCategory] = useState("All");
  
  const customData = useCustomization(initialCustomData);
  const shopTitle = customData?.formData?.shopTitle || "Collection.";
  const rawCategories = customData?.formData?.shopCategories;
  
  const productSource = useMemo(
    () =>
      (initialProducts && initialProducts.length > 0 ? initialProducts : ALL_PRODUCTS).map((p: any) => ({
        id: p.product_id || p.id,
        name: p.product_name || p.name,
        price: Number(p.base_price ?? p.price ?? 0),
        image: p.product_images?.[0]?.image_url || p.image || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=2000&auto=format&fit=crop",
        category: p.categories?.category_name || p.category || "Uncategorized",
        description: p.description || "",
        sku: p.sku || "",
        stockStatus: p.stock_status || p.stockStatus || "untracked",
        createdAt: p.created_date || p.createdAt || null,
      })),
    [initialProducts],
  );

  const categories = rawCategories
    ? rawCategories.split(",").map((c: string) => c.trim()).filter(Boolean)
    : ["All", ...Array.from(new Set(productSource.map((p: any) => p.category)))];

  const browser = useProductBrowser(productSource, { category: activeCategory });
  const filteredProducts = browser.results;

  return (
    <div className="flex flex-col w-full bg-black text-white min-h-screen pt-32">
      
      {/* Header */}
      <section className="px-6 md:px-12 w-full flex flex-col md:flex-row justify-between items-start md:items-end gap-8 pb-12 border-b border-white/20">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-8">
            [ Archive ]
          </div>
          <h1 className="font-serif text-5xl md:text-8xl tracking-tighter uppercase leading-[0.8] whitespace-pre-line">
            {shopTitle.replace(" ", "\n")}
          </h1>
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/50">
          {filteredProducts.length} Objects Found
        </div>
      </section>

      {/* Toolbar / Filters */}
      <section className="w-full border-b border-white/20">
        <div className="px-6 md:px-12 flex flex-wrap items-center gap-12 py-6">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 hidden md:block">Filter By:</span>
          {categories.map((category: any) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`text-[10px] uppercase tracking-[0.2em] transition-colors duration-300 ${
                activeCategory === category 
                  ? "text-white border-b border-white pb-1" 
                  : "text-white/40 hover:text-white"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 px-6 pb-6 md:px-12">
          <ProductToolbar browser={browser} theme={DARK_TOOLBAR} symbol={currencySymbol} showSearch searchPlaceholder="SEARCH THE ARCHIVE" />
          <ResultsNote browser={browser} total={productSource.length} theme={DARK_TOOLBAR} />
        </div>
      </section>

      {/* Product Grid */}
      <section className="w-full pb-32">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border-l border-white/10">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product: any, index: number) => (
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
                  href={`${basePath}/products/${product.id}`}
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
                      className="absolute top-4 right-4 z-10 p-2 text-white/50 hover:text-white transition-colors"
                    >
                      <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-current text-white' : ''}`} />
                    </button>
                  </div>
                  <div className="p-6 bg-black flex flex-col justify-between h-32">
                    <h3 className="font-serif text-xl tracking-tight text-white line-clamp-1">{product.name}</h3>
                    <div className="flex justify-between items-end">
                      <p className="text-[10px] tracking-[0.2em] uppercase text-white/50">{product.category}</p>
                      <p className="font-mono text-xs tracking-widest text-white">{currencySymbol}{product.price.toFixed(2)}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-48 flex flex-col items-center justify-center text-center px-6"
          >
            <h3 className="font-serif text-4xl italic tracking-tighter text-white mb-6">Null.</h3>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-12 max-w-sm leading-loose">
              No objects exist in this category.
            </p>
            <button 
              onClick={() => setActiveCategory("All")}
              className="border border-white/30 px-8 py-4 text-[10px] uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-colors"
            >
              Reset Filters
            </button>
          </motion.div>
        )}
      </section>
    </div>
  );
}
