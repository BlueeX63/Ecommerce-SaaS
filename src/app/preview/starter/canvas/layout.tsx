"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, X, Menu, ArrowRight, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { CartProvider, useCart } from "./CartContext";
import { motion, AnimatePresence } from "framer-motion";

function CartFlyout() {
  const { isCartOpen, setIsCartOpen, items, removeFromCart, updateQuantity, cartTotal } = useCart();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/80 z-50 cursor-pointer"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", ease: [0.16, 1, 0.3, 1], duration: 0.8 }}
            className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-black border-l border-white/10 z-50 flex flex-col text-white"
          >
            <div className="p-8 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-[10px] uppercase tracking-[0.2em] font-medium text-white/50">Shopping Bag</h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-white/50 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-12">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                  <p className="font-serif text-2xl italic text-white/30">Empty.</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.product.id} className="flex gap-8 group">
                    <div className="w-24 h-32 bg-white/5 flex-shrink-0 overflow-hidden relative">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 ease-out"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-serif text-xl tracking-tight text-white leading-tight pr-4">{item.product.name}</h3>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-white/30 hover:text-white transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-end justify-between mt-6">
                        <div className="flex items-center gap-4 text-[10px] tracking-[0.2em] font-mono">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="text-white/50 hover:text-white transition-colors"
                          >
                            [-]
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="text-white/50 hover:text-white transition-colors"
                          >
                            [+]
                          </button>
                        </div>
                        <p className="font-mono text-[10px] tracking-[0.1em] text-white/70">${(item.product.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-8 border-t border-white/10 space-y-8 bg-black">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">Subtotal</span>
                  <span className="font-serif text-2xl">${cartTotal.toFixed(2)}</span>
                </div>
                <Link
                  href="/preview/starter/canvas/cart"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-4 border border-white text-white flex items-center justify-between px-6 text-[10px] uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-colors duration-500"
                >
                  <span>Proceed to Checkout</span>
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

function Navigation() {
  const pathname = usePathname();
  const { cartCount, setIsCartOpen, wishlist } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const links = [
    { href: "/preview/starter/canvas", label: "Home" },
    { href: "/preview/starter/canvas/products", label: "Collection" },
    { href: "/preview/starter/canvas/about", label: "Maison" },
    { href: "/preview/starter/canvas/contact", label: "Concierge" },
    { href: "/preview/starter/canvas/orders", label: "Orders" },
  ];

  return (
    <>
      <nav 
        className={`fixed top-0 w-full z-40 transition-all duration-700 bg-black/80 backdrop-blur-md border-b border-white/10 ${
          scrolled ? "py-4" : "py-6"
        }`}
      >
        <div className="px-6 md:px-12 w-full flex items-center justify-between">
            
          {/* Logo */}
          <Link
            href="/preview/starter/canvas"
            className="font-serif text-2xl md:text-3xl tracking-tight uppercase text-white"
          >
            Canvas.
          </Link>

          {/* Desktop Links */}
          <div className="hidden xl:flex flex-1 items-center justify-center gap-6 xl:gap-12">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[10px] uppercase tracking-[0.2em] transition-colors duration-500 ${
                  pathname === link.href ? "text-white" : "text-white/40 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-6 md:gap-8">
            <Link
              href="/preview/starter/canvas/wishlist"
              className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors"
            >
              <Heart className="w-4 h-4" />
              <span>[{wishlist.length}]</span>
            </Link>

            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors"
            >
              <span className="hidden md:inline">Cart</span>
              <span>[{cartCount}]</span>
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="xl:hidden text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 bg-black flex flex-col p-6 border-b border-white/10"
          >
            <div className="flex justify-end pt-6 pr-6">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white/50 hover:text-white transition-colors"
              >
                <X className="w-8 h-8" />
              </button>
            </div>
            <div className="flex-1 flex flex-col justify-center gap-12 px-12">
              {links.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`font-serif text-5xl tracking-tight block ${
                      pathname === link.href ? "text-white italic" : "text-white/30 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Footer() {
  return (
    <footer className="bg-black text-white pt-32 pb-12 border-t border-white/10">
      <div className="px-6 md:px-12 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16 lg:gap-8 mb-32">
          
          <div className="lg:col-span-4 flex flex-col justify-between">
            <div>
              <Link href="/preview/starter/canvas" className="font-serif text-4xl tracking-tight uppercase text-white block mb-8">
                Canvas.
              </Link>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 leading-loose max-w-xs">
                A study in restraint.<br/>
                Objects of uncompromising quality.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-8">Navigation</h3>
            <ul className="space-y-4">
              <li><Link href="/preview/starter/canvas" className="text-xs tracking-widest uppercase hover:text-white/50 transition-colors">Home</Link></li>
              <li><Link href="/preview/starter/canvas/products" className="text-xs tracking-widest uppercase hover:text-white/50 transition-colors">Collection</Link></li>
              <li><Link href="/preview/starter/canvas/about" className="text-xs tracking-widest uppercase hover:text-white/50 transition-colors">Maison</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-8">Client Services</h3>
            <ul className="space-y-4">
              <li><Link href="#" className="text-xs tracking-widest uppercase hover:text-white/50 transition-colors">Shipping</Link></li>
              <li><Link href="#" className="text-xs tracking-widest uppercase hover:text-white/50 transition-colors">Returns</Link></li>
              <li><Link href="/preview/starter/canvas/contact" className="text-xs tracking-widest uppercase hover:text-white/50 transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-4">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-8">Newsletter</h3>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 leading-loose mb-8">
              Subscribe to receive exclusive communications.
            </p>
            <form className="relative border-b border-white/20 pb-4">
              <input 
                type="email" 
                placeholder="EMAIL ADDRESS" 
                className="w-full bg-transparent text-[10px] uppercase tracking-[0.2em] outline-none text-white placeholder:text-white/30"
              />
              <button className="absolute right-0 top-0 text-[10px] uppercase tracking-[0.2em] hover:text-white/50 transition-colors">
                Subscribe
              </button>
            </form>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pt-8 border-t border-white/10 text-[10px] uppercase tracking-[0.2em] text-white/30">
          <p>© {new Date().getFullYear()} Canvas. All rights reserved.</p>
          <div className="flex items-center gap-8 mt-6 md:mt-0">
            <Link href="#" className="hover:text-white transition-colors">Instagram</Link>
            <Link href="#" className="hover:text-white transition-colors">Twitter</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function CanvasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans flex flex-col">
      <CartProvider>
        <Navigation />
        <CartFlyout />
        <main className="flex-grow flex flex-col w-full">
          {children}
        </main>
        <Footer />
      </CartProvider>
    </div>
  );
}
