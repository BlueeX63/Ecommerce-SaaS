"use client";

import { Space_Grotesk, Orbitron } from "next/font/google";
import { VelocityProvider } from "./VelocityContext";
import Link from "next/link";
import { ShoppingCart, Heart, Search, Menu, X, Activity, Zap, ArrowRight, User, Check } from "lucide-react";
import { useVelocity } from "./VelocityContext";
import { useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useCustomization } from "@/hooks/useCustomization";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: '--font-space' });
const orbitron = Orbitron({ subsets: ["latin"], variable: '--font-orbitron' });

function VelocityNavigation() {
  const { cart, wishlist, isCartOpen, setIsCartOpen, clearCart , currencySymbol } = useVelocity();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const pathname = usePathname();
  const customData = useCustomization();
  const brandName = customData?.formData?.brandName || "Velocity";
  const logoUrl = customData?.formData?.logoUrl || "";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleCheckout = () => {
    setIsCheckingOut(true);
    setTimeout(() => {
      setIsCheckingOut(false);
      setCheckoutSuccess(true);
      clearCart();
      setTimeout(() => {
        setCheckoutSuccess(false);
        setIsCartOpen(false);
      }, 2000);
    }, 1500);
  };

  return (
    <>
      <header 
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 border-b ${
          isScrolled 
            ? "bg-[#050505]/80 backdrop-blur-md border-[#00f0ff]/20 py-4 shadow-[0_4px_30px_rgba(0,240,255,0.1)]" 
            : "bg-transparent border-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
          
          <Link href="/templates/velocity" className="flex items-center gap-2 group">
            <Zap className="w-8 h-8 text-[#00f0ff] group-hover:text-[#ff003c] transition-colors duration-500" />
            <span className={`text-2xl font-black uppercase tracking-tighter text-white ${orbitron.className}`}>
              {logoUrl ? <img src={logoUrl} alt={brandName} className="h-8 w-auto object-contain" /> : <div className="flex items-center gap-2"><Zap className="w-6 h-6" /><span>{brandName}</span></div>}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-10">
            {["Products", "About", "Contact"].map((item) => {
              const href = `/templates/velocity/${item.toLowerCase()}`;
              const isActive = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link 
                  key={item}
                  href={href}
                  className={`text-sm uppercase tracking-[0.2em] font-bold transition-colors relative group ${spaceGrotesk.className} ${isActive ? 'text-[#00f0ff]' : 'text-white/70 hover:text-[#00f0ff]'}`}
                >
                  {item}
                  <span className={`absolute -bottom-2 left-0 w-full h-[2px] bg-[#00f0ff] transition-transform origin-left duration-300 ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-6">
            <Link href="/templates/velocity/profile" className="relative group hidden md:block">
              <User className="w-5 h-5 text-white/70 group-hover:text-[#00f0ff] transition-colors" />
            </Link>

            <Link href="/templates/velocity/wishlist" className="relative group hidden md:block">
              <Heart className="w-5 h-5 text-white/70 group-hover:text-[#ff003c] transition-colors" />
              {wishlist.length > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-[#ff003c] text-white text-[9px] font-bold flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(255,0,60,0.5)]">
                  {wishlist.length}
                </span>
              )}
            </Link>

            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative group flex items-center gap-2"
            >
              <ShoppingCart className="w-5 h-5 text-white/70 group-hover:text-[#00f0ff] transition-colors" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 md:relative md:top-0 md:right-0 w-4 h-4 md:w-auto md:h-auto md:bg-transparent md:text-[#00f0ff] bg-[#00f0ff] text-black text-[9px] md:text-sm font-bold flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(0,240,255,0.5)] md:shadow-none">
                  {cartItemsCount}
                </span>
              )}
            </button>

            <button 
              className="md:hidden text-white"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#050505] border-l border-[#00f0ff]/20 z-50 flex flex-col shadow-[-20px_0_50px_rgba(0,240,255,0.1)]"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#0a0a0a]">
                <h2 className={`text-xl font-black uppercase tracking-widest text-[#00f0ff] ${orbitron.className}`}>Shopping Cart</h2>
                <button onClick={() => setIsCartOpen(false)} className="text-white/50 hover:text-[#ff003c] transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-white/30 space-y-4">
                    <Activity className="w-12 h-12 text-[#00f0ff]/30 animate-pulse" />
                    <p className={`uppercase tracking-widest text-sm ${spaceGrotesk.className}`}>Your Cart is Empty</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={`${item.id}-${item.selectedSize}`} className="flex gap-4 bg-white/5 p-4 rounded-xl border border-white/5 hover:border-[#00f0ff]/30 transition-colors">
                      <div className="w-20 h-24 bg-black rounded-lg overflow-hidden shrink-0 relative">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover opacity-80" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className={`text-sm font-bold text-white mb-1 leading-tight ${spaceGrotesk.className}`}>{item.name}</h3>
                          <p className="text-xs text-[#00f0ff] uppercase tracking-widest">{item.category} {item.selectedSize ? `// ${item.selectedSize}` : ''}</p>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                          <p className={`font-bold text-[#ff003c] ${orbitron.className}`}>{currencySymbol}{item.price.toFixed(2)}</p>
                          <div className="text-xs text-white/50 uppercase tracking-widest">
                            QTY: {item.quantity}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-white/10 bg-[#0a0a0a]">
                  <div className="flex justify-between items-center mb-6 text-lg">
                    <span className={`uppercase tracking-widest font-bold text-white/70 ${spaceGrotesk.className}`}>Total</span>
                    <span className={`font-black text-[#00f0ff] ${orbitron.className}`}>
                      ${cart.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2)}
                    </span>
                  </div>
                  <Link 
                    href="/templates/velocity/checkout"
                    onClick={() => setIsCartOpen(false)}
                    className={`w-full py-4 font-black uppercase tracking-[0.2em] text-sm transition-colors flex items-center justify-center gap-2 group bg-[#00f0ff] text-black hover:bg-white`}
                  >
                    Checkout <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function VelocityFooter() {
  const customData = useCustomization();
  const brandName = customData?.formData?.brandName || "Velocity";
  const logoUrl = customData?.formData?.logoUrl || "";
  const footerText = customData?.formData?.footerText || "Engineered armor for the digital age. Pushing the boundaries of human performance with cutting-edge cybernetics.";
  const copyrightText = customData?.formData?.copyrightText || "© 2026 VELOCITY. SYSTEM SECURED.";
  const socialInsta = customData?.formData?.socialInsta || "#";
  const socialTwitter = customData?.formData?.socialTwitter || "#";
  const socialFacebook = customData?.formData?.socialFacebook || "#";
  const footerCol1 = customData?.formData?.footerCol1 || "Grid Access";
  const footerCol2 = customData?.formData?.footerCol2 || "System";
  const footerCol3 = customData?.formData?.footerCol3 || "Network";

  return (
    <footer className="bg-[#050505] border-t border-[#00f0ff]/20 pt-24 pb-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,240,255,0.05)_0%,rgba(0,0,0,1)_70%)] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <Link href="/templates/velocity" className="flex items-center gap-2 mb-6">
              <Zap className="w-6 h-6 text-[#00f0ff]" />
              <span className={`text-xl font-black uppercase tracking-tighter text-white ${orbitron.className}`}>{logoUrl ? <img src={logoUrl} alt={brandName} className="h-8 w-auto object-contain" /> : <div className="flex items-center gap-2"><Zap className="w-6 h-6" /><span>{brandName}</span></div>}</span>
            </Link>
            <p className={`text-white/50 text-sm max-w-sm leading-relaxed mb-6 ${spaceGrotesk.className}`}>
              {footerText}
            </p>
            <div className="flex gap-4">
              {socialInsta !== "#" && (
                <a href={socialInsta} className="w-10 h-10 rounded-full border border-[#00f0ff]/30 flex items-center justify-center hover:bg-[#00f0ff] hover:text-black hover:border-transparent transition-all">
                  Insta
                </a>
              )}
              {socialTwitter !== "#" && (
                <a href={socialTwitter} className="w-10 h-10 rounded-full border border-[#00f0ff]/30 flex items-center justify-center hover:bg-[#00f0ff] hover:text-black hover:border-transparent transition-all">
                  X
                </a>
              )}
              {socialFacebook !== "#" && (
                <a href={socialFacebook} className="w-10 h-10 rounded-full border border-[#00f0ff]/30 flex items-center justify-center hover:bg-[#00f0ff] hover:text-black hover:border-transparent transition-all">
                  FB
                </a>
              )}
            </div>
          </div>
          <div className="col-span-1 md:col-span-2">
            <h4 className="text-[#00f0ff] text-[10px] font-black tracking-widest uppercase mb-6 font-space">{footerCol1}</h4>
            <ul className="space-y-4 font-space">
              <li><Link href="/templates/velocity/products" className="text-xs font-bold uppercase tracking-widest hover:text-[#00f0ff] transition-colors text-white/50 hover:shadow-[0_0_10px_rgba(0,240,255,0.5)]">Hardware</Link></li>
              <li><Link href="/templates/velocity/products" className="text-xs font-bold uppercase tracking-widest hover:text-[#00f0ff] transition-colors text-white/50">Enhancements</Link></li>
              <li><Link href="#" className="text-xs font-bold uppercase tracking-widest hover:text-[#00f0ff] transition-colors text-white/50">Techwear</Link></li>
              <li><Link href="#" className="text-xs font-bold uppercase tracking-widest hover:text-[#ff003c] transition-colors text-[#ff003c]/70">Classified</Link></li>
            </ul>
          </div>
          
          <div className="col-span-1 md:col-span-2">
            <h4 className="text-[#00f0ff] text-[10px] font-black tracking-widest uppercase mb-6 font-space">{footerCol2}</h4>
            <ul className="space-y-4 font-space">
              <li><Link href="/templates/velocity/about" className="text-xs font-bold uppercase tracking-widest hover:text-[#00f0ff] transition-colors text-white/50">Origin Log</Link></li>
              <li><Link href="/templates/velocity/contact" className="text-xs font-bold uppercase tracking-widest hover:text-[#00f0ff] transition-colors text-white/50">Comm Link</Link></li>
              <li><Link href="#" className="text-xs font-bold uppercase tracking-widest hover:text-[#00f0ff] transition-colors text-white/50">Returns</Link></li>
              <li><Link href="#" className="text-xs font-bold uppercase tracking-widest hover:text-[#00f0ff] transition-colors text-white/50">Support</Link></li>
            </ul>
          </div>
          
          <div className="col-span-1 md:col-span-2">
            <h4 className="text-[#00f0ff] text-[10px] font-black tracking-widest uppercase mb-6 font-space">{footerCol3}</h4>
            <ul className={`space-y-4 text-sm text-white/60 uppercase tracking-widest ${spaceGrotesk.className}`}>
              <li><Link href="/templates/velocity/products" className="hover:text-[#00f0ff] transition-colors">Products</Link></li>
              <li><Link href="/templates/velocity/about" className="hover:text-[#00f0ff] transition-colors">About Us</Link></li>
              <li><Link href="/templates/velocity/contact" className="hover:text-[#00f0ff] transition-colors">Contact</Link></li>
            </ul>
            <ul className={`space-y-4 text-sm text-white/60 uppercase tracking-widest ${spaceGrotesk.className}`}>
              <li><Link href="#" className="hover:text-[#00f0ff] transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-[#00f0ff] transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className={`border-t border-[#00f0ff]/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/30 uppercase tracking-[0.2em] ${spaceGrotesk.className}`}>
          <p>{copyrightText}</p>
          <p className="flex items-center gap-2">SYSTEM STATUS <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" /></p>
        </div>
      </div>
    </footer>
  );
}

export default function VelocityLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.includes('/auth/');

  return (
    <VelocityProvider>
      <div className={`min-h-screen bg-[#050505] text-white selection:bg-[#ff003c] selection:text-white ${spaceGrotesk.variable} ${orbitron.variable} font-sans flex flex-col`}>
        <VelocityNavigation />
        <main className="flex-1">{children}</main>
        <VelocityFooter />
      </div>
    </VelocityProvider>
  );
}
