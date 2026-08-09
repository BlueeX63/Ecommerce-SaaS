"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, X, Menu, Heart, User, Search, ArrowRight, Globe, Mail, MessageCircle , Layers} from "lucide-react";
import { useState, useEffect } from "react";
import { ShopProvider, useShop } from "./ShopContext";
import { motion, AnimatePresence } from "framer-motion";
import { useCustomization } from "@/hooks/useCustomization";

function CartFlyout() {
  const { isCartOpen, setIsCartOpen, cartItems, removeFromCart, updateCartQuantity, totalPrice , currencySymbol } = useShop();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 cursor-pointer"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-[#0a0a0a] border-l border-white/10 z-50 flex flex-col text-white shadow-2xl"
          >
            <div className="p-8 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xs uppercase tracking-widest font-bold">Your Cart</h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-white/50 hover:text-white hover:rotate-90 transition-all duration-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-50">
                  <ShoppingCart className="w-12 h-12 mb-4" />
                  <p className="text-sm tracking-widest uppercase">Your cart is empty</p>
                  <Link 
                    href="/templates/nexus-pro/products"
                    onClick={() => setIsCartOpen(false)}
                    className="border-b border-white pb-1 text-xs uppercase tracking-widest hover:text-[#d4af37] hover:border-[#d4af37] transition-colors"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                cartItems.map((item) => (
                  <motion.div layout key={item.product.id} className="flex gap-6 group">
                    <div className="w-24 h-32 bg-white/5 flex-shrink-0 overflow-hidden rounded-md relative">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm font-semibold tracking-wide text-white mb-1 group-hover:text-[#d4af37] transition-colors">{item.product.name}</h3>
                          <p className="text-[10px] text-white/50 uppercase tracking-widest">{item.product.category}</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-white/30 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-end justify-between mt-4">
                        <div className="flex items-center gap-4 bg-white/5 rounded-full px-3 py-1">
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                            className="text-white/50 hover:text-white transition-colors"
                          >
                            -
                          </button>
                          <span className="text-xs font-medium w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                            className="text-white/50 hover:text-white transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <p className="text-sm font-semibold">${(item.product.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-8 border-t border-white/10 bg-[#0a0a0a]">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs uppercase tracking-widest text-white/50">Subtotal</span>
                  <span className="text-2xl font-bold">{currencySymbol}{totalPrice.toFixed(2)}</span>
                </div>
                <Link
                  href="/templates/nexus-pro/cart"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-4 bg-white text-black rounded-full flex items-center justify-center gap-2 text-xs uppercase tracking-widest font-bold hover:bg-[#d4af37] hover:text-white transition-all duration-300"
                >
                  <span>Review Cart</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { cartCount, setIsCartOpen } = useShop();
  const pathname = usePathname();
  const customData = useCustomization();
  const brandName = customData?.formData?.brandName || "NEXUS";
  const logoUrl = customData?.formData?.logoUrl || "";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", path: "/templates/nexus-pro" },
    { name: "Collection", path: "/templates/nexus-pro/products" },
    { name: "About", path: "/templates/nexus-pro/about" },
    { name: "Contact", path: "/templates/nexus-pro/contact" },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-500 border-b ${
          isScrolled ? "bg-[#0a0a0a]/90 backdrop-blur-md py-4 border-white/10 shadow-lg" : "bg-transparent py-6 border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden text-white hover:text-[#d4af37] transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link href="/templates/nexus-pro" className="text-2xl font-black tracking-tighter uppercase text-white hover:text-[#d4af37] transition-colors">
              {logoUrl ? <img src={logoUrl} alt={brandName} className="h-8 w-auto object-contain" /> : <div className="flex items-center gap-2"><Layers className="w-6 h-6" /><span>{brandName}</span></div>}<span className="text-[#d4af37]">.</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.path}
                className={`text-xs uppercase tracking-widest font-bold transition-colors ${
                  pathname === link.path ? "text-[#d4af37]" : "text-white/70 hover:text-white"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-6">
            <Link href="/templates/nexus-pro/products" className="hidden sm:block text-white/70 hover:text-white transition-colors">
              <Search className="w-5 h-5" />
            </Link>
            <Link href="/templates/nexus-pro/profile" className="hidden sm:block text-white/70 hover:text-white transition-colors">
              <User className="w-5 h-5" />
            </Link>
            <Link href="/templates/nexus-pro/wishlist" className="text-white/70 hover:text-white transition-colors">
              <Heart className="w-5 h-5" />
            </Link>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative text-white/70 hover:text-white transition-colors group"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#d4af37] text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "-100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-[#0a0a0a] z-50 flex flex-col p-6"
          >
            <div className="flex justify-between items-center mb-12">
              <Link href="/templates/nexus-pro" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-black tracking-tighter uppercase text-white">
                {logoUrl ? <img src={logoUrl} alt={brandName} className="h-8 w-auto object-contain" /> : <div className="flex items-center gap-2"><Layers className="w-6 h-6" /><span>{brandName}</span></div>}<span className="text-[#d4af37]">.</span>
              </Link>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-white/50 hover:text-white">
                <X className="w-8 h-8" />
              </button>
            </div>
            
            <div className="flex flex-col gap-6 text-2xl font-black uppercase tracking-tighter">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-[#d4af37] transition-colors"
                >
                  {link.name}
                </Link>
              ))}
              <div className="h-px bg-white/10 w-full my-4" />
              <Link href="/templates/nexus-pro/profile" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#d4af37] transition-colors text-lg">My Account</Link>
              <Link href="/templates/nexus-pro/products" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#d4af37] transition-colors text-lg">Search</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Footer() {
  const customData = useCustomization();
  
  const footerText = customData?.formData?.footerText || "Defining the future of premium aesthetics. Engineered for the modern individual who refuses to compromise on quality and design.";
  const socialInsta = customData?.formData?.socialInsta || "#";
  const socialTwitter = customData?.formData?.socialTwitter || "#";
  const socialFacebook = customData?.formData?.socialFacebook || "#";
  const copyrightText = customData?.formData?.copyrightText || "© 2026 NEXUS PRO. ALL RIGHTS RESERVED.";
  const footerCol1 = customData?.formData?.footerCol1 || "Arsenal";
  const footerCol2 = customData?.formData?.footerCol2 || "Protocol";
  const footerCol3 = customData?.formData?.footerCol3 || "Comms";
  const tBrandName = customData?.formData?.brandName || "NEXUS";
  const tLogoUrl = customData?.formData?.logoUrl || "";
  return (
    <footer className="bg-[#050505] text-white pt-24 pb-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-20">
          <div className="col-span-1 md:col-span-1">
            <Link href="/templates/nexus-pro" className="text-3xl font-black tracking-tighter uppercase mb-6 block">
              {tLogoUrl ? <img src={tLogoUrl} alt={tBrandName} className="h-8 w-auto object-contain" /> : tBrandName}<span className="text-[#d4af37]">.</span>
            </Link>
            <p className="text-sm text-white/50 leading-relaxed mb-8 max-w-xs">
              {footerText}
            </p>
            <div className="flex gap-4">
              {socialInsta !== "#" && (
                <a href={socialInsta} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#d4af37] hover:text-black transition-colors">
                  <Globe className="w-4 h-4" />
                </a>
              )}
              {socialTwitter !== "#" && (
                <a href={socialTwitter} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#d4af37] hover:text-black transition-colors">
                  <MessageCircle className="w-4 h-4" />
                </a>
              )}
              {socialFacebook !== "#" && (
                <a href={socialFacebook} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#d4af37] hover:text-black transition-colors">
                  <Mail className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-xs uppercase tracking-widest font-bold mb-6 text-white/70">{footerCol1}</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link href="/templates/nexus-pro/products" className="hover:text-[#d4af37] transition-colors">All Collection</Link></li>
              <li><Link href="/templates/nexus-pro/products?category=Outerwear" className="hover:text-[#d4af37] transition-colors">Outerwear</Link></li>
              <li><Link href="/templates/nexus-pro/products?wearType=accessory" className="hover:text-[#d4af37] transition-colors">Accessories</Link></li>
              <li><Link href="/templates/nexus-pro/products?isNew=true" className="hover:text-[#d4af37] transition-colors">New Arrivals</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-xs uppercase tracking-widest font-bold mb-6 text-white/70">{footerCol2}</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link href="/templates/nexus-pro/contact" className="hover:text-[#d4af37] transition-colors">Contact Us</Link></li>
              <li><Link href="/templates/nexus-pro/privacy-policy" className="hover:text-[#d4af37] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/templates/nexus-pro/terms-conditions" className="hover:text-[#d4af37] transition-colors">Terms & Conditions</Link></li>
              <li><Link href="#" className="hover:text-[#d4af37] transition-colors">Shipping Returns</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-xs uppercase tracking-widest font-bold mb-6 text-white/70">{footerCol3}</h4>
            <p className="text-sm text-white/50 mb-4">Subscribe for exclusive access to new drops and private sales.</p>
            <form className="flex">
              <input 
                type="email" 
                placeholder="Email Address" 
                className="bg-white/5 border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-[#d4af37] w-full rounded-l-md transition-colors"
              />
              <button 
                type="button"
                className="bg-white text-black px-6 py-3 font-bold text-xs uppercase tracking-widest hover:bg-[#d4af37] hover:text-white transition-colors rounded-r-md"
              >
                Join
              </button>
            </form>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/10 text-xs text-white/40 font-medium">
          <p>{copyrightText}</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <span>Designed with Precision</span>
            <span>Awwwards Winning Quality</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function NexusProLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.includes('/auth/');

  return (
    <ShopProvider>
      <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] font-sans selection:bg-[#d4af37] selection:text-black flex flex-col">
        <Navbar />
        <CartFlyout />
        <main className="flex-grow pt-0">{children}</main>
        {!isAuthPage && <Footer />}
      </div>
    </ShopProvider>
  );
}
