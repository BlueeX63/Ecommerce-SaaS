"use client";

import Link from "next/link";
import { ShoppingBag, Search, Menu, ArrowLeft, Heart, User , Droplet} from "lucide-react";
import { CartProvider, useCart } from "./CartContext";
import { ReactNode, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCustomization } from "@/hooks/useCustomization";

function Header() {
  const { totalItems, searchQuery, setSearchQuery, wishlist } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const customData = useCustomization();
  const brandName = customData?.formData?.brandName || "ESSENCE.";
  const logoUrl = customData?.formData?.logoUrl || "";

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#F3EDE2]/90 backdrop-blur-md border-b border-[#4A3F35]/5 relative">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 h-24 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              className="xl:hidden text-[#4A3F35]"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <nav className="hidden xl:flex items-center gap-4 xl:gap-10 text-[11px] xl:text-[13px] font-medium tracking-[0.2em] uppercase text-[#4A3F35]/70">
              <Link href="/templates/essence" className={`hover:text-[#4A3F35] transition-colors ${pathname === '/templates/essence' ? 'text-[#4A3F35]' : ''}`}>Home</Link>
              <Link href="/templates/essence/products" className={`hover:text-[#4A3F35] transition-colors ${pathname === '/templates/essence/products' ? 'text-[#4A3F35]' : ''}`}>Shop</Link>
              <Link href="/templates/essence/about" className={`hover:text-[#4A3F35] transition-colors ${pathname === '/templates/essence/about' ? 'text-[#4A3F35]' : ''}`}>About</Link>
              <Link href="/templates/essence/contact" className={`hover:text-[#4A3F35] transition-colors ${pathname === '/templates/essence/contact' ? 'text-[#4A3F35]' : ''}`}>Contact Us</Link>
              <Link href="/templates/essence/orders" className={`hover:text-[#4A3F35] transition-colors ${pathname === '/templates/essence/orders' ? 'text-[#4A3F35]' : ''}`}>Orders</Link>
            </nav>
          </div>
          
          <Link href="/templates/essence" className="font-heading text-4xl tracking-tighter absolute left-1/2 -translate-x-1/2 text-[#4A3F35]">
            {logoUrl ? <img src={logoUrl} alt={brandName} className="h-8 w-auto object-contain" /> : <div className="flex items-center gap-2"><Droplet className="w-6 h-6" /><span>{brandName}</span></div>}
          </Link>

          <div className="flex items-center gap-8 relative">
            <AnimatePresence>
              {isSearchOpen && (
                <motion.input
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 220, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  autoFocus
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (pathname !== "/templates/essence/products") {
                      router.push("/templates/essence/products");
                    }
                  }}
                  className="bg-transparent border-b border-[#4A3F35]/20 pb-2 text-sm focus:outline-none focus:border-[#4A3F35] text-[#4A3F35] placeholder:text-[#4A3F35]/40 font-serif italic"
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
              className="hover:text-[#4A3F35]/50 transition-colors hidden sm:block text-[#4A3F35]"
            >
              <Search className="w-5 h-5" />
            </button>
            <Link href="/templates/essence/profile" className="hover:text-[#4A3F35]/50 transition-colors relative text-[#4A3F35] flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-widest font-medium hidden sm:block">Profile</span>
              <User className="w-5 h-5" />
            </Link>
            <Link href="/templates/essence/wishlist" className="hover:text-[#4A3F35]/50 transition-colors relative text-[#4A3F35] flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-widest font-medium hidden sm:block">Wishlist</span>
              <div className="relative">
                <Heart className="w-5 h-5" />
                <AnimatePresence>
                  {wishlist.length > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-2 w-4 h-4 bg-[#A69684] text-white rounded-full text-[9px] font-bold flex items-center justify-center"
                    >
                      {wishlist.length}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </Link>
            
            <Link href="/templates/essence/cart" className="hover:text-[#4A3F35]/50 transition-colors relative text-[#4A3F35] flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-widest font-medium hidden sm:block">Cart</span>
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                <AnimatePresence>
                  {totalItems > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-2 w-4 h-4 bg-[#A69684] text-white rounded-full text-[9px] font-bold flex items-center justify-center"
                    >
                      {totalItems}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </Link>
          </div>
        </div>
      </header>
      
      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-[#F3EDE2] pt-32 px-8 flex flex-col xl:hidden"
          >
            <nav className="flex flex-col gap-8 text-2xl font-serif text-[#4A3F35]">
              <Link href="/templates/essence" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
              <Link href="/templates/essence/products" onClick={() => setIsMobileMenuOpen(false)}>Shop</Link>
              <Link href="/templates/essence/about" onClick={() => setIsMobileMenuOpen(false)}>About</Link>
              <Link href="/templates/essence/contact" onClick={() => setIsMobileMenuOpen(false)}>Contact Us</Link>
              <Link href="/templates/essence/orders" onClick={() => setIsMobileMenuOpen(false)}>Orders</Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Footer() {
  const customData = useCustomization();
  
  const footerText = customData?.formData?.footerText || "Curating spaces with intention. A collection of timeless objects for the modern sanctuary.";
  const socialInsta = customData?.formData?.socialInsta || "#";
  const socialTwitter = customData?.formData?.socialTwitter || "#";
  const socialFacebook = customData?.formData?.socialFacebook || "#";
  const copyrightText = customData?.formData?.copyrightText || "© 2026 Essence. All rights reserved.";
  const footerCol1 = customData?.formData?.footerCol1 || "Studio";
  const footerCol2 = customData?.formData?.footerCol2 || "Enquiries";
  const footerCol3 = customData?.formData?.footerCol3 || "Hours";
  const tBrandName = customData?.formData?.brandName || "ESSENCE.";
  const tLogoUrl = customData?.formData?.logoUrl || "";
  return (
    <footer className="bg-[#332B25] text-[#F3EDE2] py-24 px-8 mt-auto">
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8">
        <div className="md:col-span-4">
          <div className="font-heading text-4xl tracking-tighter mb-6">{tLogoUrl ? <img src={tLogoUrl} alt={tBrandName} className="h-8 w-auto object-contain" /> : tBrandName}</div>
          <p className="text-[#F3EDE2]/60 text-sm leading-relaxed max-w-sm font-serif italic">
            {footerText}
          </p>
        </div>
        
        <div className="md:col-span-2 md:col-start-7">
          <h4 className="text-[10px] tracking-[0.2em] uppercase text-[#F3EDE2]/40 mb-6 font-bold">{footerCol1}</h4>
          <ul className="space-y-4 text-sm text-[#F3EDE2]/80">
            <li><Link href="/templates/essence/products" className="hover:text-white transition-colors">All Products</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">New Arrivals</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Ceramics</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Textiles</Link></li>
          </ul>
        </div>
        
        <div className="md:col-span-2">
          <h4 className="text-[10px] tracking-[0.2em] uppercase text-[#F3EDE2]/40 mb-6 font-bold">{footerCol2}</h4>
          <ul className="space-y-4 text-sm text-[#F3EDE2]/80">
            <li><Link href="#" className="hover:text-white transition-colors">About Us</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Journal</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Shipping & Returns</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
          </ul>
        </div>
        
        <div className="md:col-span-2">
          <h4 className="text-[10px] tracking-[0.2em] uppercase text-[#F3EDE2]/40 mb-6 font-bold">{footerCol3}</h4>
          <ul className="space-y-4 text-sm text-[#F3EDE2]/80">
            {socialInsta !== "#" && <li><Link href={socialInsta} className="hover:text-white transition-colors">Instagram</Link></li>}
            {socialTwitter !== "#" && <li><Link href={socialTwitter} className="hover:text-white transition-colors">Twitter</Link></li>}
            {socialFacebook !== "#" && <li><Link href={socialFacebook} className="hover:text-white transition-colors">Facebook</Link></li>}
          </ul>
        </div>
      </div>
      
      <div className="max-w-[1600px] mx-auto mt-24 pt-8 border-t border-[#F3EDE2]/10 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-[#F3EDE2]/40 tracking-wider">
        <div>{copyrightText}</div>
        <div className="flex items-center gap-8">
        </div>
      </div>
    </footer>
  );
}

export default function EssencePreviewLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.includes('/auth/');

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-[#F3EDE2] font-body text-[#4A3F35] selection:bg-[#A69684] selection:text-white relative">
        {!isAuthPage && <Header />}
        <main className="flex-grow flex flex-col">
          {children}
        </main>
        {!isAuthPage && <Footer />}
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
          className="fixed bottom-8 right-8 z-50 bg-[#4A3F35] text-[#F3EDE2] px-8 py-4 rounded-sm shadow-2xl flex items-center gap-6 text-sm font-medium tracking-wide"
        >
          {toastMessage}
          <button onClick={clearToast} className="text-[#F3EDE2]/50 hover:text-[#F3EDE2] transition-colors">
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
