"use client";

import Link from "next/link";
import { ShoppingBag, Search, Menu, ArrowLeft, Plus, X, Heart } from "lucide-react";
import { CartProvider, useCart, ALL_PRODUCTS } from "./CartContext";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

import { useRouter } from "next/navigation";

function Header() {
  const { totalItems, searchQuery, setSearchQuery, currencySymbol, wishlist } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [customData, setCustomData] = useState<any>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "MONOLITH_CUSTOMIZATION") {
        setCustomData(event.data.data);
      }
    };
    window.addEventListener("message", handleMessage);
    
    // Request initial state from parent (Customizer) on mount
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "MONOLITH_REQUEST_STATE" }, "*");
    }
    
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const tBrandName = customData?.formData?.brandName || "ESSENTIALS.";
  const tAnnouncementText = customData?.formData?.announcementText !== undefined 
    ? customData.formData.announcementText 
    : "Free shipping on orders over 100";

  return (
    <div className="relative">
      {/* Top Banner */}
      {tAnnouncementText && (
        <div className="w-full bg-[#111111] text-white text-[10px] sm:text-xs font-medium tracking-widest uppercase py-2.5 text-center px-4">
          {tAnnouncementText}
        </div>
      )}

      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-[#F8F7F5]/80 backdrop-blur-md border-b border-black/[0.04] relative">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button 
              className="lg:hidden text-[#111111]"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <nav className="hidden lg:flex items-center gap-8 text-xs font-medium tracking-wide uppercase text-[#111111]">
              <Link href="/preview/starter/minimalist" className={`hover:text-black/50 transition-colors ${pathname === '/preview/starter/minimalist' ? 'border-b border-black pb-1' : ''}`}>Home</Link>
              <Link href="/preview/starter/minimalist/products" className={`hover:text-black/50 transition-colors ${pathname === '/preview/starter/minimalist/products' ? 'border-b border-black pb-1' : ''}`}>Shop</Link>
              <Link href="/preview/starter/minimalist/about" className={`hover:text-black/50 transition-colors ${pathname === '/preview/starter/minimalist/about' ? 'border-b border-black pb-1' : ''}`}>About</Link>
              <Link href="/preview/starter/minimalist/contact" className={`hover:text-black/50 transition-colors ${pathname === '/preview/starter/minimalist/contact' ? 'border-b border-black pb-1' : ''}`}>Contact</Link>
              <Link href="/preview/starter/minimalist/orders" className={`hover:text-black/50 transition-colors ${pathname === '/preview/starter/minimalist/orders' ? 'border-b border-black pb-1' : ''}`}>Orders</Link>
            </nav>
          </div>
          
          <Link href="/preview/starter/minimalist" className={`font-heading text-3xl tracking-tighter absolute left-1/2 -translate-x-1/2 text-[#111111] transition-opacity duration-300 z-10 ${isSearchOpen ? 'opacity-0 sm:opacity-100 pointer-events-none sm:pointer-events-auto' : 'opacity-100'}`}>
            {tBrandName}
          </Link>

          <div className="flex items-center gap-6 relative">
            <AnimatePresence>
              {isSearchOpen && (
                <motion.input
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  autoFocus
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (pathname !== "/preview/starter/minimalist/products") {
                      router.push("/preview/starter/minimalist/products");
                    }
                  }}
                  className="bg-transparent border-b border-black/20 pb-1 text-sm focus:outline-none focus:border-[#FF4D00] text-[#111111] placeholder:text-black/30 w-24 sm:w-auto"
                />
              )}
            </AnimatePresence>

            <button 
              onClick={() => { 
                if (isSearchOpen && searchQuery === "") {
                  setIsSearchOpen(false);
                } else if (!isSearchOpen) {
                  setIsSearchOpen(true);
                }
              }}
              className="hover:text-black/50 transition-colors block text-[#111111]"
            >
              <Search className="w-5 h-5" />
            </button>
            <Link href="/preview/starter/minimalist/wishlist" className="hover:text-black/50 transition-colors relative text-[#111111]">
              <Heart className="w-5 h-5" />
              <AnimatePresence>
                {wishlist.length > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1.5 -right-2 w-4 h-4 bg-[#FF4D00] text-white rounded-full text-[9px] font-bold flex items-center justify-center"
                  >
                    {wishlist.length}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
            <Link href="/preview/starter/minimalist/cart" className="hover:text-black/50 transition-colors relative text-[#111111]">
              <ShoppingBag className="w-5 h-5" />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1.5 -right-2 w-4 h-4 bg-[#FF4D00] text-white rounded-full text-[9px] font-bold flex items-center justify-center"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: "-100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "-100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed inset-0 z-50 bg-[#F8F7F5] flex flex-col lg:hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-black/10">
              <span className="font-heading text-2xl tracking-tighter text-[#111111]">
                {tBrandName}
              </span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-[#111111]"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex flex-col gap-6 p-8 text-xl font-medium tracking-wide uppercase text-[#111111]">
              <Link href="/preview/starter/minimalist" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#FF4D00] transition-colors">Home</Link>
              <Link href="/preview/starter/minimalist/products" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#FF4D00] transition-colors">Shop</Link>
              <Link href="/preview/starter/minimalist/about" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#FF4D00] transition-colors">About</Link>
              <Link href="/preview/starter/minimalist/contact" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#FF4D00] transition-colors">Contact</Link>
              <Link href="/preview/starter/minimalist/orders" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#FF4D00] transition-colors">Orders</Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Footer() {
  const [customData, setCustomData] = useState<any>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "MONOLITH_CUSTOMIZATION") {
        setCustomData(event.data.data);
      }
    };
    window.addEventListener("message", handleMessage);
    
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "MONOLITH_REQUEST_STATE" }, "*");
    }
    
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const tBrandName = customData?.formData?.brandName || "ESSENTIALS.";

  return (
    <footer className="border-t border-black/10 py-16 px-6 bg-[#F8F7F5] mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
        <div>
          <div className="font-heading text-2xl tracking-tighter mb-2 text-[#111111] uppercase">{tBrandName}</div>
          <p className="text-sm text-black/50 max-w-xs">Curated everyday essentials built to last. No logos, no fuss, just quality materials.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-8 sm:gap-16 text-sm text-[#111111]">
          <div className="flex flex-col gap-3">
            <span className="font-bold tracking-widest uppercase text-xs mb-1">Shop</span>
            <Link href="/preview/starter/minimalist/products" className="hover:text-black/50 transition-colors">All Products</Link>
            <Link href="/preview/starter/minimalist/products" className="hover:text-black/50 transition-colors">New Arrivals</Link>
          </div>
          <div className="flex flex-col gap-3">
            <span className="font-bold tracking-widest uppercase text-xs mb-1">Company</span>
            <Link href="/preview/starter/minimalist/about" className="hover:text-black/50 transition-colors">About Us</Link>
            <Link href="/preview/starter/minimalist/contact" className="hover:text-black/50 transition-colors">Contact</Link>
          </div>
          <div className="flex flex-col gap-3">
            <span className="font-bold tracking-widest uppercase text-xs mb-1">Social</span>
            <Link href="#" className="hover:text-black/50 transition-colors">Instagram</Link>
            <Link href="#" className="hover:text-black/50 transition-colors">Twitter</Link>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-black/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-black/40 font-medium tracking-wide uppercase">
        <div>&copy; 2026 Essentials.</div>
        <Link href="/templates" className="flex items-center gap-2 hover:text-[#FF4D00] transition-colors">
          <ArrowLeft className="w-3 h-3" /> Back to Templates
        </Link>
      </div>
    </footer>
  );
}

export default function StarterPreviewLayout({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-[#F8F7F5] font-body text-[#111111] selection:bg-[#FF4D00] selection:text-white relative">
        <Header />
        <main className="flex-grow flex flex-col">
          {children}
        </main>
        <Footer />
        <ToastContainer />
      </div>
    </CartProvider>
  );
}

function ToastContainer() {
  const { toastMessage, clearToast } = useCart();
  
  return (
    <AnimatePresence>
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-50 bg-[#111111] text-white px-6 py-4 rounded-sm shadow-2xl flex items-center gap-4 text-xs font-medium tracking-wide"
        >
          {toastMessage}
          <button onClick={clearToast} className="text-white/50 hover:text-white transition-colors">
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
