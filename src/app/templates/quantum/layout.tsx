"use client";

import { Playfair_Display, Inter } from "next/font/google";
import { QuantumProvider, useQuantum } from "./QuantumContext";
import Link from "next/link";
import { ShoppingBag, Heart, Menu, X, ArrowRight, User, Infinity , Atom} from "lucide-react";
import { useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useCustomization } from "@/hooks/useCustomization";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

function QuantumNavigation() {
  const { cart, wishlist, isCartOpen, setIsCartOpen, clearCart, updateQuantity , currencySymbol } = useQuantum();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const pathname = usePathname();
  const customData = useCustomization();
  const brandName = customData?.formData?.brandName || "Quantum";
  const logoUrl = customData?.formData?.logoUrl || "";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
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

  const navLinks = [
    { name: "Collection", href: "/templates/quantum/products" },
    { name: "Philosophy", href: "/templates/quantum/about" },
    { name: "Contact", href: "/templates/quantum/contact" }
  ];

  return (
    <>
      <header 
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-700 ${
          isScrolled 
            ? "py-4 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-[0_4px_30px_rgba(0,0,0,0.03)]" 
            : "py-8 bg-transparent"
        }`}
      >
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 flex items-center justify-between">
          
          <Link href="/templates/quantum" className="flex items-center gap-3 group z-50 relative">
            <div className="relative flex items-center justify-center w-10 h-10 overflow-hidden rounded-full bg-[#121212] group-hover:bg-[#111111] transition-colors duration-500">
              <Infinity className="w-5 h-5 text-white" />
              <div className="absolute inset-0 bg-gradient-to-tr from-[#FF4500]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
            <span className={`text-2xl font-bold tracking-tight text-[#121212] ${playfair.className}`}>
              {logoUrl ? <img src={logoUrl} alt={brandName} className="h-8 w-auto object-contain" /> : <div className="flex items-center gap-2"><Atom className="w-6 h-6" /><span>{brandName}</span></div>}
            </span>
          </Link>

          <nav className="hidden md:flex items-center justify-center absolute left-1/2 -translate-x-1/2 gap-12">
            {navLinks.map((link, i) => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link 
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-medium tracking-wide transition-all relative group ${inter.className} ${isActive ? 'text-[#121212]' : 'text-gray-500 hover:text-[#121212]'}`}
                >
                  <motion.span
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                  >
                    {link.name}
                  </motion.span>
                  <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 h-[2px] bg-[#111111] transition-all duration-300 ease-out ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-6 z-50 relative">
            <Link href="/templates/quantum/profile" className="hidden md:flex relative group p-2">
              <User className="w-5 h-5 text-gray-500 group-hover:text-[#111111] transition-colors" />
            </Link>

            <Link href="/templates/quantum/wishlist" className="hidden md:flex relative group p-2">
              <Heart className="w-5 h-5 text-gray-500 group-hover:text-[#FF4500] transition-colors" />
              {wishlist.length > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-[#FF4500] text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                  {wishlist.length}
                </span>
              )}
            </Link>

            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative group flex items-center p-2"
            >
              <ShoppingBag className="w-5 h-5 text-gray-500 group-hover:text-[#111111] transition-colors" />
              {cartItemsCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-[#111111] text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                  {cartItemsCount}
                </span>
              )}
            </button>

            <button 
              className="md:hidden text-[#121212]"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
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
            className="fixed inset-0 z-40 bg-[#F9F9FB] pt-24 px-6 flex flex-col items-center md:hidden"
          >
            <div className="flex flex-col items-center gap-8 text-3xl font-bold text-[#121212] mt-12">
              {navLinks.map((link) => (
                <Link key={link.name} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className={playfair.className}>
                  {link.name}
                </Link>
              ))}
              <div className="flex gap-8 mt-12">
                <Link href="/templates/quantum/profile" onClick={() => setIsMobileMenuOpen(false)}>
                  <User className="w-8 h-8 text-gray-400" />
                </Link>
                <Link href="/templates/quantum/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="relative">
                  <Heart className="w-8 h-8 text-gray-400" />
                  {wishlist.length > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#FF4500] text-white text-xs flex items-center justify-center rounded-full">
                      {wishlist.length}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-[70] flex flex-col shadow-2xl border-l border-gray-100"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className={`text-xl font-bold text-[#121212] ${playfair.className}`}>Your Cart</h2>
                <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-[#121212] transition-colors p-2 bg-gray-50 rounded-full hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                    <ShoppingBag className="w-12 h-12 stroke-[1]" />
                    <p className={`text-lg ${inter.className}`}>Your cart is feeling light.</p>
                  </div>
                ) : (
                  <motion.div 
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: { staggerChildren: 0.1 }
                      }
                    }}
                    initial="hidden"
                    animate="show"
                    className="space-y-6"
                  >
                    {cart.map(item => (
                      <motion.div 
                        variants={{ hidden: { opacity: 0, x: 50 }, show: { opacity: 1, x: 0 } }}
                        key={item.id} 
                        className="flex gap-6 group"
                      >
                        <div className="w-24 h-28 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover mix-blend-multiply group-hover:scale-110 transition-transform duration-700 ease-out" />
                        </div>
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div>
                            <h3 className={`font-semibold text-[#121212] leading-tight ${playfair.className}`}>{item.name}</h3>
                            <p className="text-sm text-gray-500 mt-1">{item.category}</p>
                          </div>
                          <div className="flex justify-between items-center mt-4">
                            <p className={`font-medium ${inter.className}`}>{currencySymbol}{item.price.toFixed(2)}</p>
                            <div className="flex items-center gap-3 bg-gray-50 rounded-full px-3 py-1">
                              <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-gray-500 hover:text-black font-medium">-</button>
                              <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-gray-500 hover:text-black font-medium">+</button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                  <div className="flex justify-between items-center mb-6">
                    <span className={`text-gray-500 font-medium ${inter.className}`}>Subtotal</span>
                    <span className={`text-xl font-bold text-[#121212] ${playfair.className}`}>
                      ${cart.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2)}
                    </span>
                  </div>
                  <Link 
                    href="/templates/quantum/checkout"
                    onClick={() => setIsCartOpen(false)}
                    className="w-full py-4 rounded-full font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 group overflow-hidden relative bg-[#111111] text-white hover:bg-gray-800 shadow-lg shadow-black/20 hover:shadow-black/40"
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

function QuantumFooter() {
  const customData = useCustomization();
  const brandName = customData?.formData?.brandName || "Quantum";
  const logoUrl = customData?.formData?.logoUrl || "";
  const footerText = customData?.formData?.footerText || "Designing the future of living spaces. We merge conceptual art with functional everyday objects to create a truly transcendent environment.";
  const copyrightText = customData?.formData?.copyrightText || `© ${new Date().getFullYear()} ${logoUrl ? <img src={logoUrl} alt={brandName} className="h-8 w-auto object-contain" /> : <div className="flex items-center gap-2"><Atom className="w-6 h-6" /><span>{brandName}</span></div>} Design Studio. All rights reserved.`;
  const socialInsta = customData?.formData?.socialInsta || "#";
  const socialTwitter = customData?.formData?.socialTwitter || "#";
  const socialFacebook = customData?.formData?.socialFacebook || "#";

  return (
    <footer className="bg-white border-t border-gray-100 pt-24 pb-12 relative overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-24 mb-16">
          <div className="md:col-span-2">
            <Link href="/templates/quantum" className="flex items-center gap-2 mb-8">
              <Infinity className="w-6 h-6 text-[#111111]" />
              <span className={`text-2xl font-bold tracking-tight text-[#121212] ${playfair.className}`}>{logoUrl ? <img src={logoUrl} alt={brandName} className="h-8 w-auto object-contain" /> : <div className="flex items-center gap-2"><Atom className="w-6 h-6" /><span>{brandName}</span></div>}</span>
            </Link>
            <p className={`text-gray-500 max-w-md leading-relaxed ${inter.className}`}>
              {footerText}
            </p>
          </div>
          <div>
            <h4 className={`text-sm font-bold text-[#121212] mb-6 tracking-wide uppercase ${inter.className}`}>Explore</h4>
            <ul className={`space-y-4 text-gray-500 ${inter.className}`}>
              <li><Link href="/templates/quantum/products" className="hover:text-[#111111] transition-colors">Collection</Link></li>
              <li><Link href="/templates/quantum/about" className="hover:text-[#111111] transition-colors">Philosophy</Link></li>
              <li><Link href="/templates/quantum/contact" className="hover:text-[#111111] transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className={`text-sm font-bold text-[#121212] mb-6 tracking-wide uppercase ${inter.className}`}>Legal</h4>
            <ul className={`space-y-4 text-gray-500 ${inter.className}`}>
              <li><Link href="#" className="hover:text-[#111111] transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-[#111111] transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-[#111111] transition-colors">Shipping & Returns</Link></li>
            </ul>
          </div>
        </div>
        <div className={`pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400 ${inter.className}`}>
          <p>{copyrightText}</p>
          <div className="flex gap-6">
            {socialInsta !== "#" && <Link href={socialInsta} className="hover:text-[#121212] transition-colors">Instagram</Link>}
            {socialTwitter !== "#" && <Link href={socialTwitter} className="hover:text-[#121212] transition-colors">Twitter</Link>}
            {socialFacebook !== "#" && <Link href={socialFacebook} className="hover:text-[#121212] transition-colors">Facebook</Link>}
          </div>
        </div>
      </div>
      
      {/* Decorative Blur */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-indigo-50 to-transparent rounded-full blur-3xl -z-10 translate-x-1/3 translate-y-1/3 opacity-70" />
    </footer>
  );
}

function ToastContainer() {
  const { toastMessage } = useQuantum();
  return (
    <AnimatePresence>
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-[#111111] text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-inter text-sm font-medium"
        >
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          {toastMessage}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function QuantumLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.includes('/auth/');

  return (
    <QuantumProvider>
      <div className={`min-h-screen bg-[#F9F9FB] text-[#121212] selection:bg-[#111111] selection:text-white ${playfair.variable} ${inter.variable} font-sans flex flex-col overflow-x-hidden`}>
        <QuantumNavigation />
        <main className="flex-1">{children}</main>
        <QuantumFooter />
        <ToastContainer />
      </div>
    </QuantumProvider>
  );
}
