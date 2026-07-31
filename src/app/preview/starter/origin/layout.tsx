"use client";

import Link from "next/link";
import { ShoppingBag, Search, Menu, ArrowLeft, X, Heart } from "lucide-react";
import { CartProvider, useCart } from "./CartContext";
import { ReactNode, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";

// Colors: 
// Bg Cream: #fdfbf7
// Dark Brown: #402c21
// Light Brown: #a38c7f

function Header() {
  const { totalItems, searchQuery, setSearchQuery, wishlist } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0;
    if (latest > 150 && latest > previous) {
      setHidden(true);
    } else {
      setHidden(false);
    }
    setScrolled(latest > 50);
  });

  return (
    <>
      <motion.header
        variants={{
          visible: { y: 0, opacity: 1 },
          hidden: { y: "-100%", opacity: 0 },
        }}
        animate={hidden ? "hidden" : "visible"}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 py-4 px-4 md:px-8"
      >
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between bg-[#fdfbf7]/90 backdrop-blur-xl border border-[#402c21]/10 rounded-full px-8 py-3 shadow-lg">
            <div className="flex items-center gap-12">
              <Link href="/preview/starter/origin" className="font-serif text-3xl font-bold tracking-tight text-[#402c21]">
                ORIGIN.
              </Link>
              <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#402c21]/70">
                {['Home', 'Shop', 'About', 'Contact', 'Orders'].map((item) => {
                  const href = item === 'Home' ? '/preview/starter/origin' : item === 'Shop' ? '/preview/starter/origin/products' : `/preview/starter/origin/${item.toLowerCase()}`;
                  const isActive = pathname === href;
                  return (
                    <Link key={item} href={href} className={`relative group py-2 overflow-hidden`}>
                      <span className={`transition-colors duration-300 ${isActive ? 'text-[#402c21] font-bold' : 'group-hover:text-[#402c21]'}`}>{item}</span>
                      <span className={`absolute bottom-0 left-0 w-full h-[1px] bg-[#402c21] transform origin-left transition-transform duration-300 ease-out ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-4 sm:gap-8">
              <div className="relative">
                <AnimatePresence mode="wait">
                  {isSearchOpen ? (
                    <motion.div
                      key="search-input"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="flex items-center border-b border-[#402c21] overflow-hidden"
                    >
                      <input
                        autoFocus
                        type="text"
                        placeholder="Search collection..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          if (pathname !== "/preview/starter/origin/products") router.push("/preview/starter/origin/products");
                        }}
                        className="bg-transparent pb-1 text-sm focus:outline-none text-[#402c21] placeholder:text-[#402c21]/40 w-24 sm:w-48"
                      />
                      <button onClick={() => setIsSearchOpen(false)} className="text-[#402c21]/40 hover:text-[#402c21] pb-1 ml-2">
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="search-btn"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsSearchOpen(true)}
                      className="hover:text-[#a38c7f] transition-colors text-[#402c21] flex items-center gap-2 text-sm font-medium"
                    >
                      <Search className="w-4 h-4" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              <Link href="/preview/starter/origin/wishlist" className="group flex items-center gap-2 text-sm font-medium text-[#402c21] transition-colors hover:text-[#a38c7f]">
                <Heart className="w-5 h-5" />
                <span className="bg-[#402c21] text-[#fdfbf7] text-xs px-2 py-0.5 rounded-full transition-colors group-hover:bg-[#a38c7f]">
                  {wishlist.length}
                </span>
              </Link>

              <Link href="/preview/starter/origin/cart" className="group flex items-center gap-2 text-sm font-medium text-[#402c21] transition-colors hover:text-[#a38c7f]">
                <span className="hidden sm:block">Cart</span>
                <span className="bg-[#402c21] text-[#fdfbf7] text-xs px-2 py-0.5 rounded-full transition-colors group-hover:bg-[#a38c7f]">
                  {totalItems}
                </span>
              </Link>

              <button
                className="md:hidden text-[#402c21]"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 bg-[#fdfbf7] pt-28 px-8 flex flex-col md:hidden"
          >
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-8 right-8 text-[#402c21]"
            >
              <X className="w-8 h-8" />
            </button>
            <nav className="flex flex-col gap-8 text-4xl font-serif font-bold text-[#402c21]">
              {['Home', 'Shop', 'About', 'Contact', 'Orders'].map((item) => {
                const href = item === 'Home' ? '/preview/starter/origin' : item === 'Shop' ? '/preview/starter/origin/products' : `/preview/starter/origin/${item.toLowerCase()}`;
                return (
                  <Link
                    key={item}
                    href={href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="hover:italic transition-all duration-300"
                  >
                    {item}.
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Footer() {
  return (
    <footer className="bg-[#402c21] text-[#fdfbf7] py-20 px-6 mt-auto border-t border-[#fdfbf7]/10">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="md:col-span-1">
          <div className="font-serif text-3xl font-bold tracking-tight mb-4">ORIGIN.</div>
          <p className="text-[#fdfbf7]/70 text-sm leading-relaxed font-medium">
            Embracing the earth's natural palette. Goods crafted for the modern soul.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-bold mb-6 text-[#a38c7f]">Navigation</h4>
          <ul className="space-y-3 text-sm text-[#fdfbf7]/80">
            <li><Link href="/preview/starter/origin" className="hover:text-white transition-colors">Home</Link></li>
            <li><Link href="/preview/starter/origin/products" className="hover:text-white transition-colors">Shop</Link></li>
            <li><Link href="/preview/starter/origin/about" className="hover:text-white transition-colors">About</Link></li>
            <li><Link href="/preview/starter/origin/contact" className="hover:text-white transition-colors">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold mb-6 text-[#a38c7f]">Legal</h4>
          <ul className="space-y-3 text-sm text-[#fdfbf7]/80">
            <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Returns</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold mb-6 text-[#a38c7f]">Connect</h4>
          <ul className="space-y-3 text-sm text-[#fdfbf7]/80">
            <li><Link href="#" className="hover:text-white transition-colors">Instagram</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Twitter</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Facebook</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto mt-20 pt-8 border-t border-[#fdfbf7]/10 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-[#fdfbf7]/50 font-medium">
        <div>&copy; 2026 Origin Supply Co.</div>
        <Link href="/templates" className="flex items-center gap-2 hover:text-white transition-colors font-bold uppercase tracking-widest text-[10px]">
          <ArrowLeft className="w-3 h-3" /> Back to Templates
        </Link>
      </div>
    </footer>
  );
}

export default function OriginPreviewLayout({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-[#fdfbf7] font-sans text-[#402c21] selection:bg-[#a38c7f] selection:text-white relative">
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

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#402c21] text-[#fdfbf7] px-6 py-3 rounded-full shadow-xl flex items-center gap-4 text-sm font-medium transition-all animate-in slide-in-from-bottom-5 fade-in">
      {toastMessage}
      <button onClick={clearToast} className="text-[#fdfbf7]/50 hover:text-[#fdfbf7] transition-colors ml-2">
        ✕
      </button>
    </div>
  );
}
