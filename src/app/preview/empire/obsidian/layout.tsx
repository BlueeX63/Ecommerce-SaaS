"use client";

import { Inter, Oswald } from "next/font/google";
import { ObsidianProvider, useObsidian } from "./ObsidianContext";
import Link from "next/link";
import { ShoppingBag, Heart, Menu, X, ArrowRight, User, Check } from "lucide-react";
import { useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { usePathname } from "next/navigation";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald"
});

function ObsidianNavigation() {
  const { cart, wishlist, isCartOpen, setIsCartOpen, clearCart, mounted } = useObsidian();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const { scrollY } = useScroll();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [checkoutStep, setCheckoutStep] = useState<"cart" | "processing" | "success">("cart");

  const pathname = usePathname();

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 50) setIsHidden(true);
    else setIsHidden(false);
    setIsScrolled(latest > 20);
  });

  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const navLinks = [
    { name: "Archive", href: "/preview/empire/obsidian/products" },
    { name: "Visuals", href: "/preview/empire/obsidian/lookbook" },
    { name: "Manifesto", href: "/preview/empire/obsidian/about" },
    { name: "Communicate", href: "/preview/empire/obsidian/contact" },
  ];

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
        variants={{ visible: { y: 0 }, hidden: { y: "-100%" } }}
        animate={isHidden ? "hidden" : "visible"}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] bg-transparent ${isScrolled ? "py-4 mix-blend-difference" : "py-8 mix-blend-difference"}`}
      >
        <div className={`max-w-[1600px] mx-auto px-6 md:px-12 flex items-center justify-between transition-colors duration-700 text-white`}>

          <Link href="/preview/empire/obsidian" className="flex items-center gap-3 group z-50 relative pointer-events-auto" style={{ cursor: "none" }}>
            <span className={`text-3xl font-bold tracking-widest uppercase ${oswald.className} hover:tracking-[0.2em] transition-all duration-500`}>
              OBSIDIAN
            </span>
          </Link>

          <nav className="hidden md:flex items-center justify-center absolute left-1/2 -translate-x-1/2 gap-12">
            {navLinks.map((link, i) => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  style={{ cursor: "none" }}
                  className={`text-[10px] font-bold tracking-[0.2em] uppercase transition-all duration-500 relative group pointer-events-auto ${inter.className} ${isActive ? 'text-white' : 'text-white/40 hover:text-white'}`}
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
            <Link href="/preview/empire/obsidian/profile" className="hidden md:flex relative group p-2 hover:opacity-50 transition-opacity duration-500 pointer-events-auto" style={{ cursor: "none" }}>
              <User className="w-5 h-5 stroke-[1.5]" />
            </Link>

            <Link href="/preview/empire/obsidian/wishlist" className="hidden md:flex relative group p-2 hover:opacity-50 transition-opacity duration-500 pointer-events-auto" style={{ cursor: "none" }}>
              <Heart className="w-5 h-5 stroke-[1.5]" />
              {mounted && wishlist.length > 0 && (
                <span className={`absolute top-0 -right-1 w-4 h-4 bg-white text-black text-[10px] font-bold flex items-center justify-center rounded-sm ${oswald.className}`}>
                  {wishlist.length}
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsCartOpen(true)}
              style={{ cursor: "none" }}
              className="relative group flex items-center p-2 hover:opacity-50 transition-opacity duration-500 pointer-events-auto"
            >
              <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
              {mounted && cartItemsCount > 0 && (
                <span className={`absolute top-0 -right-1 w-4 h-4 bg-white text-black text-[10px] font-bold flex items-center justify-center rounded-sm ${oswald.className}`}>
                  {cartItemsCount}
                </span>
              )}
            </button>

            <button
              className="md:hidden pointer-events-auto"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6 stroke-[1.5]" /> : <Menu className="w-6 h-6 stroke-[1.5]" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)" }}
            animate={{ opacity: 1, clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
            exit={{ opacity: 0, clipPath: "polygon(0 100%, 100% 100%, 100% 100%, 0 100%)" }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-40 bg-[#050505] pt-32 px-8 flex flex-col md:hidden"
          >
            <div className="flex flex-col gap-6 text-white mt-12">
              {navLinks.map((link, i) => (
                <motion.div
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  key={link.name}
                >
                  <Link href={link.href} onClick={() => setIsMobileMenuOpen(false)} className={`${oswald.className} text-5xl font-bold tracking-tighter hover:tracking-widest transition-all duration-500 uppercase`}>
                    {link.name}
                  </Link>
                </motion.div>
              ))}
              <div className="flex gap-8 mt-12 border-t border-white/10 pt-8">
                <Link href="/preview/empire/obsidian/profile" onClick={() => setIsMobileMenuOpen(false)}>
                  <User className="w-6 h-6 text-white/60 hover:text-white" />
                </Link>
                <Link href="/preview/empire/obsidian/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="relative">
                  <Heart className="w-6 h-6 text-white/60 hover:text-white" />
                  {mounted && wishlist.length > 0 && (
                    <span className="absolute -top-2 -right-2 w-4 h-4 bg-white text-black text-xs flex items-center justify-center rounded-sm">
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
              className="fixed inset-0 bg-[#050505]/80 backdrop-blur-md z-[60]"
            />
            <motion.div
              data-lenis-prevent
              initial={{ x: "100%", skewX: -10 }}
              animate={{ x: 0, skewX: 0 }}
              exit={{ x: "100%", skewX: 10 }}
              transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#111] z-[70] flex flex-col border-l border-white/10"
            >
              <div className="p-8 border-b border-white/10 flex justify-between items-center bg-[#111]">
                <h2 className={`text-2xl font-bold tracking-widest uppercase text-white ${oswald.className}`}>
                  {checkoutStep === "processing" ? "SYSTEM.PROCESSING" : checkoutStep === "success" ? "SYSTEM.CONFIRMED" : "SYSTEM.BAG"}
                </h2>
                <button onClick={() => setIsCartOpen(false)} className="text-white/40 hover:text-white transition-colors duration-300 pointer-events-auto" style={{ cursor: "none" }}>
                  <X className="w-6 h-6 stroke-[1.5]" />
                </button>
              </div>

              {checkoutStep === "success" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex-1 flex flex-col items-center justify-center p-8 text-center"
                >
                  <div className="w-24 h-24 rounded-sm border border-white/20 flex items-center justify-center mb-8 bg-white/5">
                    <Check className="w-10 h-10 text-white stroke-[1]" />
                  </div>
                  <h3 className={`text-3xl font-bold text-white mb-4 ${oswald.className} uppercase tracking-widest`}>Transaction<br/>Complete</h3>
                  <p className={`text-white/40 ${inter.className} text-xs uppercase tracking-widest leading-loose mb-4`}>
                    Asset acquisition successful.
                  </p>
                </motion.div>
              ) : checkoutStep === "processing" ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex flex-col items-center justify-center p-8 text-center"
                >
                  <div className="w-16 h-16 border-t-2 border-r-2 border-white rounded-none animate-spin mb-8" />
                  <h3 className={`text-2xl font-bold text-white mb-4 ${oswald.className} uppercase tracking-widest`}>Verifying</h3>
                  <p className={`text-white/40 ${inter.className} text-xs uppercase tracking-widest`}>Awaiting confirmation block.</p>
                </motion.div>
              ) : (
                <>
                  <div data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain p-8 space-y-8 min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {cart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-white/20 space-y-6">
                        <ShoppingBag className="w-20 h-20 stroke-[0.5]" />
                        <p className={`text-xs uppercase tracking-[0.2em] font-medium ${inter.className}`}>No assets found.</p>
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
                            <div className="w-28 h-28 bg-[#1a1a1a] overflow-hidden shrink-0 rounded-sm">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover mix-blend-screen opacity-90 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] grayscale contrast-125" />
                            </div>
                            <div className="flex-1 flex flex-col justify-between py-1">
                              <div>
                                <h3 className={`text-lg font-bold text-white uppercase tracking-widest ${oswald.className}`}>{item.name}</h3>
                                <p className={`text-[10px] text-white/40 mt-1 uppercase tracking-[0.2em] ${inter.className}`}>
                                  {item.color} {item.size && `// ${item.size}`}
                                </p>
                              </div>
                              <div className="flex justify-between items-center mt-4 border-t border-white/10 pt-2">
                                <p className={`text-sm font-bold text-white ${oswald.className}`}>${item.price.toFixed(2)}</p>
                                <p className={`text-[10px] text-white/60 uppercase tracking-widest ${inter.className}`}>Qty: {item.quantity}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </div>

                  {cart.length > 0 && (
                    <div className="p-8 border-t border-white/10 bg-[#111]">
                      <div className="space-y-4 mb-8">
                        <div className="flex justify-between items-center">
                          <span className={`text-white/40 text-[10px] uppercase tracking-[0.2em] ${inter.className}`}>Subtotal</span>
                          <span className={`text-white/80 ${inter.className} text-xs tracking-widest font-medium`}>
                            ${cart.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-white/20">
                          <span className={`text-white text-xs uppercase tracking-[0.3em] font-bold ${inter.className}`}>Total</span>
                          <span className={`text-2xl font-bold text-white ${oswald.className}`}>
                            ${cart.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <Link
                        href="/preview/empire/obsidian/checkout"
                        onClick={() => setIsCartOpen(false)}
                        style={{ cursor: "none" }}
                        className={`w-full py-6 bg-white text-black text-xs font-bold uppercase tracking-[0.3em] transition-all duration-500 flex items-center justify-center gap-4 group overflow-hidden relative pointer-events-auto rounded-sm ${inter.className}`}
                      >
                        <span className="relative z-10 flex items-center gap-4 group-hover:text-white transition-colors duration-500">
                          INITIALIZE CHECKOUT <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-[#333] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-0" />
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

function ObsidianFooter() {
  return (
    <footer className="bg-[#050505] border-t border-white/10 pt-32 pb-12 relative overflow-hidden text-white">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 md:gap-24 mb-24">
          <div className="md:col-span-2">
            <Link href="/preview/empire/obsidian" className="flex items-center gap-3 mb-8 pointer-events-auto" style={{ cursor: "none" }}>
              <span className={`text-4xl font-bold tracking-widest uppercase ${oswald.className}`}>
                OBSIDIAN
              </span>
            </Link>
            <p className={`text-white/40 max-w-md text-[11px] leading-loose uppercase tracking-[0.2em] ${inter.className}`}>
              Precision engineering meets avant-garde aesthetic. Forged for those who demand absolute performance.
            </p>
          </div>
          <div>
            <h4 className={`text-[10px] text-white/30 tracking-[0.4em] font-bold uppercase mb-8 ${inter.className}`}>Directory</h4>
            <ul className={`space-y-4 text-[11px] uppercase tracking-[0.2em] font-medium text-white/70 ${inter.className}`}>
              <li><Link href="/preview/empire/obsidian/products" className="hover:text-white transition-colors pointer-events-auto" style={{ cursor: "none" }}>Archive</Link></li>
              <li><Link href="/preview/empire/obsidian/lookbook" className="hover:text-white transition-colors pointer-events-auto" style={{ cursor: "none" }}>Visuals</Link></li>
              <li><Link href="/preview/empire/obsidian/about" className="hover:text-white transition-colors pointer-events-auto" style={{ cursor: "none" }}>Manifesto</Link></li>
            </ul>
          </div>
          <div>
            <h4 className={`text-[10px] text-white/30 tracking-[0.4em] font-bold uppercase mb-8 ${inter.className}`}>Network</h4>
            <ul className={`space-y-4 text-[11px] uppercase tracking-[0.2em] font-medium text-white/70 ${inter.className}`}>
              <li><Link href="#" className="hover:text-white transition-colors pointer-events-auto" style={{ cursor: "none" }}>Instagram</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors pointer-events-auto" style={{ cursor: "none" }}>X / Twitter</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors pointer-events-auto" style={{ cursor: "none" }}>Discord</Link></li>
            </ul>
          </div>
        </div>

        <div className={`pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 text-[9px] text-white/30 tracking-[0.3em] uppercase font-bold ${inter.className}`}>
          <p>© 2026 OBSIDIAN CORP. ALL RIGHTS RESERVED.</p>
          <div className="flex gap-8">
            <Link href="#" className="hover:text-white transition-colors pointer-events-auto" style={{ cursor: "none" }}>Privacy_Policy</Link>
            <Link href="#" className="hover:text-white transition-colors pointer-events-auto" style={{ cursor: "none" }}>Terms_of_Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function ToastContainer() {
  const { toastMessage } = useObsidian();
  return (
    <AnimatePresence>
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: "-50%", scale: 0.95 }}
          animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
          exit={{ opacity: 0, y: 20, x: "-50%", scale: 0.95 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-12 left-1/2 z-[100] bg-white text-black px-8 py-5 rounded-sm shadow-2xl flex items-center gap-4 pointer-events-auto"
        >
          <span className={`${oswald.className} text-sm font-bold tracking-widest uppercase`}>{toastMessage}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Custom Crosshair Cursor for Obsidian
function GlobalCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);

      const target = e.target as HTMLElement;
      const isActionable = target.closest('a, button, input, textarea, select, [role="button"], label, .cursor-pointer') !== null;
      setIsHovering(isActionable);
    };

    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, []);

  if (!isVisible) return null;

  return (
    <>
      {/* Center Dot */}
      <motion.div
        className="hidden md:block fixed top-0 left-0 w-1 h-1 bg-white pointer-events-none z-[10000] mix-blend-difference"
        animate={{
          x: mousePosition.x - 2,
          y: mousePosition.y - 2,
        }}
        transition={{ type: "tween", ease: "linear", duration: 0 }}
      />
      {/* Outer Square Brackets / Reticle */}
      <motion.div
        className="hidden md:flex fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference items-center justify-center border border-white/40"
        animate={{
          x: mousePosition.x - (isHovering ? 20 : 12),
          y: mousePosition.y - (isHovering ? 20 : 12),
          width: isHovering ? 40 : 24,
          height: isHovering ? 40 : 24,
          rotate: isHovering ? 45 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25,
          mass: 0.5
        }}
      />
    </>
  );
}

export default function ObsidianLayout({ children }: { children: ReactNode }) {
  return (
    <ObsidianProvider>
      <div className={`min-h-screen bg-[#050505] text-white selection:bg-white selection:text-black ${inter.variable} ${oswald.variable} font-sans flex flex-col cursor-none`}>
        <GlobalCursor />
        <ObsidianNavigation />
        <main className="flex-1 relative z-10">{children}</main>
        <ObsidianFooter />
        <ToastContainer />
      </div>
    </ObsidianProvider>
  );
}
