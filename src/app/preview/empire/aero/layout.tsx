"use client";

import { Inter, Space_Grotesk } from "next/font/google";
import { AeroProvider, useAero } from "./AeroContext";
import Link from "next/link";
import { ShoppingBag, Heart, Menu, X, ArrowRight, User, Check } from "lucide-react";
import { useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { usePathname } from "next/navigation";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space"
});

function AeroNavigation() {
  const { cart, wishlist, isCartOpen, setIsCartOpen, clearCart, mounted } = useAero();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const { scrollY } = useScroll();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [checkoutStep, setCheckoutStep] = useState<"cart" | "processing" | "success">("cart");

  const pathname = usePathname();
  const isDarkPage = pathname.includes('/lookbook') || pathname.includes('/about');
  const isDarkHeader = !isScrolled && isDarkPage;

  const textColor = (isDarkHeader && !isMobileMenuOpen) ? 'text-white' : 'text-black';
  const textMuted = (isDarkHeader && !isMobileMenuOpen) ? 'text-white/50 hover:text-white' : 'text-black/40 hover:text-black';

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 50) {
      setIsHidden(true);
    } else {
      setIsHidden(false);
    }

    setIsScrolled(latest > 20);
  });

  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const navLinks = [
    { name: "Collection", href: "/preview/empire/aero/products" },
    { name: "Lookbook", href: "/preview/empire/aero/lookbook" },
    { name: "Concept", href: "/preview/empire/aero/about" },
    { name: "Connect", href: "/preview/empire/aero/contact" },
  ];

  const submitOrder = () => {
    setCheckoutStep("processing");
    setTimeout(() => {
      setCheckoutStep("success");
      clearCart();
      setTimeout(() => {
        setCheckoutStep("cart");
        setIsCartOpen(false);
      }, 3000);
    }, 2000);
  };

  useEffect(() => {
    if (!isCartOpen) {
      setTimeout(() => setCheckoutStep("cart"), 300);
    }
  }, [isCartOpen]);

  useEffect(() => {
    if (isCartOpen || isMobileMenuOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
  }, [isCartOpen, isMobileMenuOpen]);

  return (
    <>
      <motion.header
        variants={{
          visible: { y: 0 },
          hidden: { y: "-100%" }
        }}
        animate={isHidden ? "hidden" : "visible"}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] bg-transparent ${isScrolled ? "py-4" : "py-8"
          }`}
      >
        <div className={`max-w-[1600px] mx-auto px-6 md:px-12 flex items-center justify-between transition-colors duration-700 ${textColor}`}>

          <Link href="/preview/empire/aero" className="flex items-center gap-3 group z-50 relative pointer-events-auto" style={{ cursor: "none" }}>
            <span className={`text-2xl font-bold tracking-tighter uppercase ${spaceGrotesk.className}`}>
              AERO.
            </span>
          </Link>

          <nav className="hidden md:flex items-center justify-center absolute left-1/2 -translate-x-1/2 gap-10">
            {navLinks.map((link, i) => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  style={{ cursor: "none" }}
                  className={`text-xs font-medium tracking-[0.1em] uppercase transition-all duration-500 relative group pointer-events-auto ${spaceGrotesk.className} ${isActive ? '' : textMuted}`}
                >
                  <motion.span
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {link.name}
                  </motion.span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-6 z-50 relative">
            <Link href="/preview/empire/aero/profile" className="hidden md:flex relative group p-2 hover:opacity-50 transition-opacity duration-500 pointer-events-auto" style={{ cursor: "none" }}>
              <User className="w-4 h-4 stroke-[2]" />
            </Link>

            <Link href="/preview/empire/aero/wishlist" className="hidden md:flex relative group p-2 hover:opacity-50 transition-opacity duration-500 pointer-events-auto" style={{ cursor: "none" }}>
              <Heart className="w-4 h-4 stroke-[2]" />
              {mounted && wishlist.length > 0 && (
                <span className={`absolute top-0 right-0 w-3.5 h-3.5 bg-white text-black text-[9px] font-bold flex items-center justify-center rounded-full ${spaceGrotesk.className}`}>
                  {wishlist.length}
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsCartOpen(true)}
              style={{ cursor: "none" }}
              className="relative group flex items-center p-2 hover:opacity-50 transition-opacity duration-500 pointer-events-auto"
            >
              <ShoppingBag className="w-4 h-4 stroke-[2]" />
              {mounted && cartItemsCount > 0 && (
                <span className={`absolute top-0 right-0 w-3.5 h-3.5 bg-white text-black text-[9px] font-bold flex items-center justify-center rounded-full ${spaceGrotesk.className}`}>
                  {cartItemsCount}
                </span>
              )}
            </button>

            <button
              className="md:hidden pointer-events-auto"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 stroke-[2]" /> : <Menu className="w-5 h-5 stroke-[2]" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-40 bg-white/95 backdrop-blur-xl pt-32 px-8 flex flex-col md:hidden"
          >
            <div className="flex flex-col gap-8 text-4xl text-black">
              {navLinks.map((link, i) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  key={link.name}
                >
                  <Link href={link.href} onClick={() => setIsMobileMenuOpen(false)} className={`${spaceGrotesk.className} font-bold tracking-tighter hover:opacity-50 transition-opacity uppercase`}>
                    {link.name}
                  </Link>
                </motion.div>
              ))}
              <div className="flex gap-8 mt-12 border-t border-black/10 pt-8">
                <Link href="/preview/empire/aero/profile" onClick={() => setIsMobileMenuOpen(false)}>
                  <User className="w-6 h-6 text-black/60 hover:text-black" />
                </Link>
                <Link href="/preview/empire/aero/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="relative">
                  <Heart className="w-6 h-6 text-black/60 hover:text-black" />
                  {mounted && wishlist.length > 0 && (
                    <span className="absolute -top-2 -right-2 w-4 h-4 bg-black text-white text-xs flex items-center justify-center rounded-full">
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
              data-lenis-prevent
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              data-lenis-prevent
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-[70] flex flex-col shadow-2xl"
            >
              <div className="p-8 border-b border-black/5 flex justify-between items-center bg-white">
                <h2 className={`text-xl font-bold tracking-tighter uppercase text-black ${spaceGrotesk.className}`}>
                  {checkoutStep === "processing" ? "Processing" : checkoutStep === "success" ? "Confirmation" : "Bag"}
                </h2>
                <button onClick={() => setIsCartOpen(false)} className="text-black/40 hover:text-black transition-colors duration-300 pointer-events-auto" style={{ cursor: "none" }}>
                  <X className="w-5 h-5 stroke-[2]" />
                </button>
              </div>

              {checkoutStep === "success" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex-1 flex flex-col items-center justify-center p-8 text-center"
                >
                  <div className="w-20 h-20 rounded-full border border-black/10 flex items-center justify-center mb-8 bg-black/5">
                    <Check className="w-8 h-8 text-black stroke-[2]" />
                  </div>
                  <h3 className={`text-2xl font-bold text-black mb-4 ${spaceGrotesk.className} uppercase tracking-tighter`}>Order Confirmed</h3>
                  <p className={`text-black/50 ${inter.className} font-light text-sm leading-relaxed mb-4`}>
                    Your luxury items will be dispatched shortly.
                  </p>
                </motion.div>
              ) : checkoutStep === "processing" ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex flex-col items-center justify-center p-8 text-center"
                >
                  <div className="w-12 h-12 border-t-2 border-black rounded-full animate-spin mb-8" />
                  <h3 className={`text-2xl font-bold text-black mb-4 ${spaceGrotesk.className} uppercase tracking-tighter`}>Authenticating</h3>
                  <p className={`text-black/50 ${inter.className} font-light text-sm`}>Please do not close this window.</p>
                </motion.div>
              ) : (
                <>
                  <div data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain p-8 space-y-8 min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {cart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-black/20 space-y-6">
                        <ShoppingBag className="w-16 h-16 stroke-[1]" />
                        <p className={`text-sm uppercase tracking-widest font-medium ${spaceGrotesk.className}`}>Your bag is empty.</p>
                      </div>
                    ) : (
                      <motion.div
                        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
                        initial="hidden"
                        animate="show"
                        className="space-y-8"
                      >
                        {cart.map(item => (
                          <motion.div
                            variants={{ hidden: { opacity: 0, x: 20 }, show: { opacity: 1, x: 0 } }}
                            key={`${item.id}-${item.size}-${item.color}`}
                            className="flex gap-6 group"
                          >
                            <div className="w-24 h-24 bg-[#F5F5F5] overflow-hidden shrink-0 rounded-xl">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                            </div>
                            <div className="flex-1 flex flex-col justify-between py-1">
                              <div>
                                <h3 className={`text-sm font-bold text-black uppercase tracking-tighter ${spaceGrotesk.className}`}>{item.name}</h3>
                                <p className={`text-xs text-black/40 mt-1 uppercase tracking-widest ${inter.className}`}>
                                  {item.color} {item.size && `| Size ${item.size}`}
                                </p>
                              </div>
                              <div className="flex justify-between items-center mt-4">
                                <p className={`text-sm font-medium text-black ${spaceGrotesk.className}`}>${item.price.toFixed(2)}</p>
                                <p className={`text-xs text-black/60 ${inter.className}`}>Qty: {item.quantity}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </div>

                  {cart.length > 0 && (
                    <div className="p-8 border-t border-black/5 bg-white">
                      <div className="space-y-4 mb-8">
                        <div className="flex justify-between items-center">
                          <span className={`text-black/40 text-xs uppercase tracking-widest ${inter.className}`}>Subtotal</span>
                          <span className={`text-black/80 ${inter.className} font-medium`}>
                            ${cart.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-black/10">
                          <span className={`text-black text-sm uppercase tracking-widest font-bold ${spaceGrotesk.className}`}>Total</span>
                          <span className={`text-xl font-bold text-black ${spaceGrotesk.className}`}>
                            ${cart.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <Link
                        href="/preview/empire/aero/checkout"
                        onClick={() => setIsCartOpen(false)}
                        style={{ cursor: "none" }}
                        className={`w-full py-5 bg-black text-white text-xs font-bold uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-3 group overflow-hidden relative pointer-events-auto rounded-none ${spaceGrotesk.className}`}
                      >
                        <span className="relative z-10 flex items-center gap-3">
                          CHECKOUT <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-[#222] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-0" />
                      </Link>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function AeroFooter() {
  return (
    <footer className="bg-white border-t border-black/5 pt-32 pb-12 relative overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 md:gap-24 mb-24">
          <div className="md:col-span-2">
            <Link href="/preview/empire/aero" className="flex items-center gap-3 mb-8 pointer-events-auto" style={{ cursor: "none" }}>
              <span className={`text-3xl font-bold text-black tracking-tighter uppercase ${spaceGrotesk.className}`}>
                AERO.
              </span>
            </Link>
            <p className={`text-black/50 max-w-md text-sm leading-loose font-light ${inter.className}`}>
              Redefining luxury footwear through innovative design and uncompromising quality. Experience the future of movement.
            </p>
          </div>
          <div>
            <h4 className={`text-[10px] text-black/40 tracking-[0.3em] font-bold uppercase mb-8 ${spaceGrotesk.className}`}>Explore</h4>
            <ul className={`space-y-4 text-sm font-medium text-black/70 ${inter.className}`}>
              <li><Link href="/preview/empire/aero/products" className="hover:text-black transition-colors pointer-events-auto" style={{ cursor: "none" }}>Collection</Link></li>
              <li><Link href="/preview/empire/aero/lookbook" className="hover:text-black transition-colors pointer-events-auto" style={{ cursor: "none" }}>Lookbook</Link></li>
              <li><Link href="/preview/empire/aero/about" className="hover:text-black transition-colors pointer-events-auto" style={{ cursor: "none" }}>Concept</Link></li>
            </ul>
          </div>
          <div>
            <h4 className={`text-[10px] text-black/40 tracking-[0.3em] font-bold uppercase mb-8 ${spaceGrotesk.className}`}>Social</h4>
            <ul className={`space-y-4 text-sm font-medium text-black/70 ${inter.className}`}>
              <li><Link href="#" className="hover:text-black transition-colors pointer-events-auto" style={{ cursor: "none" }}>Instagram</Link></li>
              <li><Link href="#" className="hover:text-black transition-colors pointer-events-auto" style={{ cursor: "none" }}>Twitter</Link></li>
              <li><Link href="#" className="hover:text-black transition-colors pointer-events-auto" style={{ cursor: "none" }}>TikTok</Link></li>
            </ul>
          </div>
        </div>

        <div className={`pt-12 border-t border-black/5 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-black/40 tracking-widest uppercase font-medium ${spaceGrotesk.className}`}>
          <p>© 2026 AERO STUDIOS.</p>
          <div className="flex gap-8">
            <Link href="#" className="hover:text-black transition-colors pointer-events-auto" style={{ cursor: "none" }}>Privacy</Link>
            <Link href="#" className="hover:text-black transition-colors pointer-events-auto" style={{ cursor: "none" }}>Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function ToastContainer() {
  const { toastMessage } = useAero();
  return (
    <AnimatePresence>
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: "-50%", scale: 0.95 }}
          animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
          exit={{ opacity: 0, y: 20, x: "-50%", scale: 0.95 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-12 left-1/2 z-[100] bg-black text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 pointer-events-auto backdrop-blur-md bg-black/90"
        >
          <span className={`${spaceGrotesk.className} text-xs font-bold tracking-widest uppercase`}>{toastMessage}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Global Custom Cursor
function GlobalCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);

      const target = e.target as HTMLElement;
      // Added .cursor-pointer so custom cards can trigger the hover state
      const isActionable = target.closest('a, button, input, textarea, select, [role="button"], label, .cursor-pointer') !== null;
      setIsHovering(isActionable);
    };

    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, []);

  if (!isVisible) return null;

  return (
    <>
      {/* Tiny solid dot - instant follow */}
      <motion.div
        className="hidden md:block fixed top-0 left-0 w-1.5 h-1.5 bg-white rounded-full pointer-events-none z-[10000] mix-blend-difference"
        animate={{
          x: mousePosition.x - 3,
          y: mousePosition.y - 3,
          scale: isHovering ? 0 : 1
        }}
        transition={{ type: "tween", ease: "linear", duration: 0 }}
      />
      {/* Outer elegant ring - smooth spring follow */}
      <motion.div
        className="hidden md:block fixed top-0 left-0 rounded-full pointer-events-none z-[9999] mix-blend-difference box-border"
        animate={{
          x: mousePosition.x - (isHovering ? 24 : 14),
          y: mousePosition.y - (isHovering ? 24 : 14),
          width: isHovering ? 48 : 28,
          height: isHovering ? 48 : 28,
          backgroundColor: isHovering ? "rgba(255,255,255,1)" : "rgba(255,255,255,0)",
          border: isHovering ? "0px solid rgba(255,255,255,1)" : "1px solid rgba(255,255,255,0.6)",
        }}
        transition={{
          type: "spring",
          stiffness: 350,
          damping: 28,
          mass: 0.5
        }}
      />
    </>
  );
}

export default function AeroLayout({ children }: { children: ReactNode }) {
  return (
    <AeroProvider>
      <div className={`min-h-screen bg-white text-black selection:bg-black selection:text-white ${inter.variable} ${spaceGrotesk.variable} font-sans flex flex-col cursor-none`}>
        <GlobalCursor />
        <AeroNavigation />
        <main className="flex-1 relative z-10">{children}</main>
        <AeroFooter />
        <ToastContainer />
      </div>
    </AeroProvider>
  );
}
