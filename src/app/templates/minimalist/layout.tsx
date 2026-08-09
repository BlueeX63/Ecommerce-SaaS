"use client";

import Link from "next/link";
import { ShoppingBag, Search, Menu, ArrowLeft, Plus, X, Heart, User, Hexagon } from "lucide-react";
import { CartProvider, useCart, ALL_PRODUCTS } from "./CartContext";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

import { useRouter } from "next/navigation";

function Header({ initialCustomData, basePath }: { initialCustomData?: any, basePath: string }) {
  const { totalItems, searchQuery, setSearchQuery, currencySymbol, wishlist } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [customData, setCustomData] = useState<any>(initialCustomData || null);

  useEffect(() => {
    if (window.parent && window.parent !== window) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === "MONOLITH_CUSTOMIZATION") {
          setCustomData(event.data.data);
        }
      };
      window.addEventListener("message", handleMessage);
      window.parent.postMessage({ type: "MONOLITH_REQUEST_STATE" }, "*");
      return () => window.removeEventListener("message", handleMessage);
    }
  }, []);

  const tBrandName = customData?.formData?.brandName || "ESSENTIALS.";
  const tLogoUrl = customData?.formData?.logoUrl || "";
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
              <Link href={basePath || '/'} className={`hover:text-black/50 transition-colors ${pathname === (basePath || '/') ? 'border-b border-black pb-1' : ''}`}>Home</Link>
              <Link href={`${basePath}/products`} className={`hover:text-black/50 transition-colors ${pathname === `${basePath}/products` ? 'border-b border-black pb-1' : ''}`}>Shop</Link>
              <Link href={`${basePath}/about`} className={`hover:text-black/50 transition-colors ${pathname === `${basePath}/about` ? 'border-b border-black pb-1' : ''}`}>About</Link>
              <Link href={`${basePath}/contact`} className={`hover:text-black/50 transition-colors ${pathname === `${basePath}/contact` ? 'border-b border-black pb-1' : ''}`}>Contact</Link>
              <Link href={`${basePath}/orders`} className={`hover:text-black/50 transition-colors ${pathname === `${basePath}/orders` ? 'border-b border-black pb-1' : ''}`}>Orders</Link>
            </nav>
          </div>
          
          <Link href={basePath || '/'} className={`font-heading text-3xl tracking-tighter absolute left-1/2 -translate-x-1/2 text-[#111111] transition-opacity duration-300 z-10 ${isSearchOpen ? 'opacity-0 sm:opacity-100 pointer-events-none sm:pointer-events-auto' : 'opacity-100'}`}>
            {tLogoUrl ? <img src={tLogoUrl} alt={tBrandName} className="h-8 w-auto object-contain" /> : <div className="flex items-center gap-2"><Hexagon className="w-6 h-6" /><span>{tBrandName}</span></div>}
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
                    if (pathname !== `${basePath}/products`) {
                      router.push(`${basePath}/products`);
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
            <Link href={`${basePath}/profile`} className="hover:text-black/50 transition-colors block text-[#111111]">
              <User className="w-5 h-5" />
            </Link>
            <Link href={`${basePath}/wishlist`} className="hover:text-black/50 transition-colors relative text-[#111111]">
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
            <Link href={`${basePath}/cart`} className="hover:text-black/50 transition-colors relative text-[#111111]">
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
                {tLogoUrl ? <img src={tLogoUrl} alt={tBrandName} className="h-8 w-auto object-contain" /> : <div className="flex items-center gap-2"><Hexagon className="w-6 h-6" /><span>{tBrandName}</span></div>}
              </span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-[#111111]"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex flex-col gap-6 p-8 text-xl font-medium tracking-wide uppercase text-[#111111]">
              <Link href={basePath || '/'} onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#FF4D00] transition-colors">Home</Link>
              <Link href={`${basePath}/products`} onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#FF4D00] transition-colors">Shop</Link>
              <Link href={`${basePath}/about`} onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#FF4D00] transition-colors">About</Link>
              <Link href={`${basePath}/contact`} onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#FF4D00] transition-colors">Contact</Link>
              <Link href={`${basePath}/orders`} onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#FF4D00] transition-colors">Orders</Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

function Footer({ initialCustomData, basePath }: { initialCustomData?: any, basePath: string }) {
  const [customData, setCustomData] = useState<any>(initialCustomData || null);

  useEffect(() => {
    if (window.parent && window.parent !== window) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === "MONOLITH_CUSTOMIZATION") {
          setCustomData(event.data.data);
        }
      };
      window.addEventListener("message", handleMessage);
      window.parent.postMessage({ type: "MONOLITH_REQUEST_STATE" }, "*");
      return () => window.removeEventListener("message", handleMessage);
    }
  }, []);

  const tBrandName = customData?.formData?.brandName || "ESSENTIALS.";
  const tLogoUrl = customData?.formData?.logoUrl || "";
  const footerText = customData?.formData?.footerText || "Curated everyday essentials built to last. No logos, no fuss, just quality materials.";
  const socialInsta = customData?.formData?.socialInsta || "#";
  const socialTwitter = customData?.formData?.socialTwitter || "#";
  const socialFacebook = customData?.formData?.socialFacebook || "#";
  const copyrightText = customData?.formData?.copyrightText || "© 2026 Essentials.";
  const footerCol1 = customData?.formData?.footerCol1 || "Shop";
  const footerCol2 = customData?.formData?.footerCol2 || "Company";
  const footerCol3 = customData?.formData?.footerCol3 || "Social";

  return (
    <footer className="border-t border-black/10 py-16 px-6 bg-[#F8F7F5] mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
        <div>
          <div className="font-heading text-2xl tracking-tighter mb-2 text-[#111111] uppercase">{tLogoUrl ? <img src={tLogoUrl} alt={tBrandName} className="h-8 w-auto object-contain" /> : <div className="flex items-center gap-2"><Hexagon className="w-6 h-6" /><span>{tBrandName}</span></div>}</div>
          <p className="text-sm text-black/50 max-w-xs">{footerText}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-8 sm:gap-16 text-sm text-[#111111]">
          <div className="flex flex-col gap-3">
            <span className="font-bold tracking-widest uppercase text-xs mb-1">{footerCol1}</span>
            <Link href={`${basePath}/products`} className="hover:text-black/50 transition-colors">All Products</Link>
            <Link href={`${basePath}/products`} className="hover:text-black/50 transition-colors">New Arrivals</Link>
          </div>
          <div className="flex flex-col gap-3">
            <span className="font-bold tracking-widest uppercase text-xs mb-1">{footerCol2}</span>
            <Link href={`${basePath}/about`} className="hover:text-black/50 transition-colors">About Us</Link>
            <Link href={`${basePath}/contact`} className="hover:text-black/50 transition-colors">Contact</Link>
          </div>
          <div className="flex flex-col gap-3">
            <span className="font-bold tracking-widest uppercase text-xs mb-1">{footerCol3}</span>
            {socialInsta && (
              <Link href={socialInsta} className="flex items-center gap-2 hover:text-black/50 transition-colors">
                <InstagramIcon className="w-4 h-4" /> Instagram
              </Link>
            )}
            {socialTwitter && (
              <Link href={socialTwitter} className="flex items-center gap-2 hover:text-black/50 transition-colors">
                <TwitterIcon className="w-4 h-4" /> Twitter
              </Link>
            )}
            {socialFacebook && (
              <Link href={socialFacebook} className="flex items-center gap-2 hover:text-black/50 transition-colors">
                <FacebookIcon className="w-4 h-4" /> Facebook
              </Link>
            )}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-black/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-black/40 font-medium tracking-wide uppercase">
        <div>{copyrightText}</div>
        
      </div>
    </footer>
  );
}
export default function StarterPreviewLayout({ children, initialCustomData, basePath }: { children: ReactNode, initialCustomData?: any, basePath?: string }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.includes('/auth/');

  return (
    <CartProvider initialBasePath={basePath} initialCustomData={initialCustomData}>
      <div className="min-h-screen flex flex-col bg-[#F8F7F5] font-body text-[#111111] selection:bg-[#FF4D00] selection:text-white relative">
        {!isAuthPage && <Header initialCustomData={initialCustomData} basePath={basePath !== undefined ? basePath : '/templates/minimalist'} />}
        <main className="flex-grow flex flex-col">
          {children}
        </main>
        {!isAuthPage && <Footer initialCustomData={initialCustomData} basePath={basePath !== undefined ? basePath : '/templates/minimalist'} />}
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
