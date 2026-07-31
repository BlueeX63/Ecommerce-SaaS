"use client";

import { Cormorant_Garamond, Outfit } from "next/font/google";
import { HorizonProvider, useHorizon } from "./HorizonContext";
import Link from "next/link";
import { ShoppingBag, Heart, Menu, X, ArrowRight, User, Check, CreditCard, Banknote, Smartphone } from "lucide-react";
import { useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { usePathname } from "next/navigation";

const cormorant = Cormorant_Garamond({ 
  subsets: ["latin"], 
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant" 
});

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: "--font-outfit" 
});

function HorizonNavigation() {
  const { cart, wishlist, isCartOpen, setIsCartOpen, clearCart, appliedCoupon, applyCoupon, removeCoupon, discountAmount, couponError, updateQuantity, removeFromCart } = useHorizon();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const { scrollY } = useScroll();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  
  // Checkout States
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "form" | "processing" | "success">("cart");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi" | "cod">("card");
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    address: ""
  });

  const pathname = usePathname();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0;
    if (latest > 100 && latest > previous) {
      setIsHidden(true);
    } else {
      setIsHidden(false);
    }
    setIsScrolled(latest > 20);
  });

  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const navLinks = [
    { name: "Collection", href: "/preview/growth/horizon/products" },
    { name: "Manifesto", href: "/preview/growth/horizon/about" },
    { name: "Contact", href: "/preview/growth/horizon/contact" },
  ];

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponInput.trim()) {
      applyCoupon(couponInput);
    }
  };

  const startCheckout = () => {
    setCheckoutStep("form");
  };

  const submitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutStep("processing");
    
    setTimeout(() => {
      setCheckoutStep("success");
      clearCart();
      setTimeout(() => {
        setCheckoutStep("cart");
        setIsCartOpen(false);
      }, 4000);
    }, 2000);
  };

  // Reset checkout step when cart closes
  useEffect(() => {
    if (!isCartOpen) {
      setTimeout(() => setCheckoutStep("cart"), 300); // Wait for exit animation
    }
  }, [isCartOpen]);

  // Lock body scroll when cart or mobile menu is open
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
        className={`fixed top-0 inset-x-0 z-50 transition-colors duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isScrolled 
            ? "py-4 bg-[#FAFAFA]/90 backdrop-blur-xl border-b border-black/5 shadow-[0_10px_40px_rgba(0,0,0,0.03)]" 
            : "py-8 bg-transparent"
        }`}
      >
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 flex items-center justify-between">
          
          <Link href="/preview/growth/horizon" className="flex items-center gap-3 group z-50 relative pointer-events-auto" style={{ cursor: "none" }}>
            <span className={`text-2xl font-medium tracking-widest text-black uppercase ${outfit.className}`}>
              H<span className="text-black/40">ORIZON</span>
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
                  className={`text-[11px] font-medium tracking-[0.2em] uppercase transition-all duration-500 relative group pointer-events-auto ${outfit.className} ${isActive ? 'text-black' : 'text-black/50 hover:text-black'}`}
                >
                  <motion.span
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {link.name}
                  </motion.span>
                  <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 h-[1px] bg-black transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-6 z-50 relative text-black">
            <Link href="/preview/growth/horizon/profile" className="hidden md:flex relative group p-2 hover:opacity-50 transition-opacity duration-500 pointer-events-auto" style={{ cursor: "none" }}>
              <User className="w-4 h-4 stroke-[1.5]" />
            </Link>

            <Link href="/preview/growth/horizon/wishlist" className="hidden md:flex relative group p-2 hover:opacity-50 transition-opacity duration-500 pointer-events-auto" style={{ cursor: "none" }}>
              <Heart className="w-4 h-4 stroke-[1.5]" />
              {wishlist.length > 0 && (
                <span className={`absolute top-0 right-0 w-3.5 h-3.5 bg-black text-white text-[9px] font-bold flex items-center justify-center rounded-full ${outfit.className}`}>
                  {wishlist.length}
                </span>
              )}
            </Link>

            <button 
              onClick={() => setIsCartOpen(true)}
              style={{ cursor: "none" }}
              className="relative group flex items-center p-2 hover:opacity-50 transition-opacity duration-500 pointer-events-auto"
            >
              <ShoppingBag className="w-4 h-4 stroke-[1.5]" />
              {cartItemsCount > 0 && (
                <span className={`absolute top-0 right-0 w-3.5 h-3.5 bg-black text-white text-[9px] font-bold flex items-center justify-center rounded-full ${outfit.className}`}>
                  {cartItemsCount}
                </span>
              )}
            </button>

            <button 
              className="md:hidden text-black pointer-events-auto"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 stroke-[1.5]" /> : <Menu className="w-5 h-5 stroke-[1.5]" />}
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
            className="fixed inset-0 z-40 bg-[#FAFAFA]/95 backdrop-blur-xl pt-32 px-8 flex flex-col md:hidden"
          >
            <div className="flex flex-col gap-8 text-4xl text-black">
              {navLinks.map((link, i) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  key={link.name}
                >
                  <Link href={link.href} onClick={() => setIsMobileMenuOpen(false)} className={`${cormorant.className} italic hover:opacity-50 transition-opacity`}>
                    {link.name}
                  </Link>
                </motion.div>
              ))}
              <div className="flex gap-8 mt-12 border-t border-black/10 pt-8">
                <Link href="/preview/growth/horizon/profile" onClick={() => setIsMobileMenuOpen(false)}>
                  <User className="w-6 h-6 text-black/60 hover:text-black" />
                </Link>
                <Link href="/preview/growth/horizon/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="relative">
                  <Heart className="w-6 h-6 text-black/60 hover:text-black" />
                  {wishlist.length > 0 && (
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
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              data-lenis-prevent
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-[70] flex flex-col shadow-2xl"
            >
              <div className="p-8 border-b border-black/5 flex justify-between items-center bg-[#FAFAFA]">
                <h2 className={`text-3xl italic text-black ${cormorant.className}`}>
                  {checkoutStep === "form" ? "Delivery Details" : checkoutStep === "processing" ? "Processing" : checkoutStep === "success" ? "Confirmation" : "Your Cart"}
                </h2>
                <button onClick={() => setIsCartOpen(false)} className="text-black/40 hover:text-black transition-colors duration-300 pointer-events-auto" style={{ cursor: "none" }}>
                  <X className="w-5 h-5 stroke-[1.5]" />
                </button>
              </div>

              {checkoutStep === "success" ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex-1 flex flex-col items-center justify-center p-8 text-center"
                >
                  <div className="w-20 h-20 rounded-full border border-black/10 flex items-center justify-center mb-8 bg-black/5">
                     <Check className="w-8 h-8 text-black stroke-[1.5]" />
                  </div>
                  <h3 className={`text-3xl text-black mb-4 ${cormorant.className} italic`}>Order Confirmed</h3>
                  <p className={`text-black/50 ${outfit.className} font-light text-sm leading-relaxed mb-4`}>
                    Thank you, {formData.name || 'Client'}. Your elegant assets are being prepared for delivery to {formData.address}.
                  </p>
                  <p className={`text-black/40 ${outfit.className} text-[10px] uppercase tracking-widest`}>
                    Paid via {paymentMethod.toUpperCase()}
                  </p>
                </motion.div>
              ) : checkoutStep === "processing" ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex flex-col items-center justify-center p-8 text-center"
                >
                  <div className="w-12 h-12 border-t-2 border-black rounded-full animate-spin mb-8" />
                  <h3 className={`text-2xl text-black mb-4 ${cormorant.className} italic`}>Processing Payment</h3>
                  <p className={`text-black/50 ${outfit.className} font-light text-sm`}>Please do not close this window.</p>
                </motion.div>
              ) : checkoutStep === "form" ? (
                <div className="flex-1 flex flex-col pointer-events-auto overflow-hidden min-h-0">
                  <div data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain p-8 space-y-8 bg-white min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <form id="checkout-form" onSubmit={submitOrder} className="space-y-6">
                      
                      <div className="space-y-4">
                        <h3 className={`text-[10px] uppercase tracking-[0.3em] font-medium text-black/50 ${outfit.className}`}>Shipping Information</h3>
                        <div className="relative pt-6">
                          <input 
                            required 
                            type="text" 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder="Name"
                            className={`w-full bg-transparent border-b border-black/10 pb-3 font-light text-sm text-[#111] focus:outline-none focus:border-black transition-colors peer placeholder-transparent ${outfit.className}`} 
                            style={{ cursor: "none" }}
                          />
                          <label className={`absolute left-0 top-0 text-[10px] uppercase tracking-[0.2em] text-black/40 transition-all peer-placeholder-shown:top-6 peer-placeholder-shown:text-sm peer-focus:top-0 peer-focus:text-[10px] peer-focus:text-black pointer-events-none ${outfit.className}`}>
                            Full Name
                          </label>
                        </div>
                        <div className="relative pt-6">
                          <input 
                            required 
                            type="tel" 
                            value={formData.mobile}
                            onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                            placeholder="Mobile"
                            className={`w-full bg-transparent border-b border-black/10 pb-3 font-light text-sm text-[#111] focus:outline-none focus:border-black transition-colors peer placeholder-transparent ${outfit.className}`} 
                            style={{ cursor: "none" }}
                          />
                          <label className={`absolute left-0 top-0 text-[10px] uppercase tracking-[0.2em] text-black/40 transition-all peer-placeholder-shown:top-6 peer-placeholder-shown:text-sm peer-focus:top-0 peer-focus:text-[10px] peer-focus:text-black pointer-events-none ${outfit.className}`}>
                            Mobile Number
                          </label>
                        </div>
                        <div className="relative pt-6">
                          <textarea 
                            required 
                            rows={3}
                            value={formData.address}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                            placeholder="Address"
                            className={`w-full bg-transparent border-b border-black/10 pb-3 font-light text-sm text-[#111] focus:outline-none focus:border-black transition-colors peer placeholder-transparent resize-none ${outfit.className}`} 
                            style={{ cursor: "none" }}
                          />
                          <label className={`absolute left-0 top-0 text-[10px] uppercase tracking-[0.2em] text-black/40 transition-all peer-placeholder-shown:top-6 peer-placeholder-shown:text-sm peer-focus:top-0 peer-focus:text-[10px] peer-focus:text-black pointer-events-none ${outfit.className}`}>
                            Delivery Address
                          </label>
                        </div>
                      </div>

                      <div className="pt-6 space-y-4">
                        <h3 className={`text-[10px] uppercase tracking-[0.3em] font-medium text-black/50 ${outfit.className}`}>Payment Method</h3>
                        <div className="grid grid-cols-1 gap-4">
                          
                          {/* Card Payment */}
                          <div className="flex flex-col border border-black/10 hover:border-black/30 transition-colors">
                            <label className={`flex items-center gap-4 p-4 cursor-pointer ${paymentMethod === 'card' ? 'bg-[#FAFAFA]' : ''} ${outfit.className}`}>
                              <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="hidden" />
                              <CreditCard className={`w-4 h-4 ${paymentMethod === 'card' ? 'text-black' : 'text-black/40'}`} />
                              <span className={`text-xs uppercase tracking-widest font-medium ${paymentMethod === 'card' ? 'text-black' : 'text-black/60'}`}>Credit / Debit Card</span>
                            </label>
                            <AnimatePresence>
                              {paymentMethod === 'card' && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                  <div className="p-4 pt-0 space-y-4 bg-[#FAFAFA]">
                                    <input type="text" placeholder="Card Number" required className={`w-full bg-white border border-black/10 p-3 text-xs tracking-widest focus:outline-none focus:border-black/30 ${outfit.className}`} />
                                    <div className="flex gap-4">
                                      <input type="text" placeholder="MM/YY" required className={`w-1/2 bg-white border border-black/10 p-3 text-xs tracking-widest focus:outline-none focus:border-black/30 ${outfit.className}`} />
                                      <input type="text" placeholder="CVC" required className={`w-1/2 bg-white border border-black/10 p-3 text-xs tracking-widest focus:outline-none focus:border-black/30 ${outfit.className}`} />
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* UPI Payment */}
                          <div className="flex flex-col border border-black/10 hover:border-black/30 transition-colors">
                            <label className={`flex items-center gap-4 p-4 cursor-pointer ${paymentMethod === 'upi' ? 'bg-[#FAFAFA]' : ''} ${outfit.className}`}>
                              <input type="radio" name="payment" value="upi" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} className="hidden" />
                              <Smartphone className={`w-4 h-4 ${paymentMethod === 'upi' ? 'text-black' : 'text-black/40'}`} />
                              <span className={`text-xs uppercase tracking-widest font-medium ${paymentMethod === 'upi' ? 'text-black' : 'text-black/60'}`}>UPI Transfer</span>
                            </label>
                            <AnimatePresence>
                              {paymentMethod === 'upi' && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                  <div className="p-4 pt-0 bg-[#FAFAFA]">
                                    <input type="text" placeholder="UPI ID (e.g. name@bank)" required className={`w-full bg-white border border-black/10 p-3 text-xs tracking-widest focus:outline-none focus:border-black/30 ${outfit.className}`} />
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* COD Payment */}
                          <div className="flex flex-col border border-black/10 hover:border-black/30 transition-colors">
                            <label className={`flex items-center gap-4 p-4 cursor-pointer ${paymentMethod === 'cod' ? 'bg-[#FAFAFA]' : ''} ${outfit.className}`}>
                              <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="hidden" />
                              <Banknote className={`w-4 h-4 ${paymentMethod === 'cod' ? 'text-black' : 'text-black/40'}`} />
                              <span className={`text-xs uppercase tracking-widest font-medium ${paymentMethod === 'cod' ? 'text-black' : 'text-black/60'}`}>Cash on Delivery</span>
                            </label>
                          </div>
                          
                        </div>
                      </div>

                    </form>
                  </div>
                  
                  <div className="p-8 border-t border-black/5 bg-[#FAFAFA]">
                    <div className="flex justify-between items-center mb-6">
                       <span className={`text-black text-sm uppercase tracking-widest font-medium ${outfit.className}`}>Total to Pay</span>
                       <span className={`text-2xl text-black ${cormorant.className} italic`}>
                         ${(cart.reduce((acc, item) => acc + (item.price * item.quantity), 0) - discountAmount).toFixed(2)}
                       </span>
                    </div>
                    <div className="flex gap-4">
                      <button 
                        type="button"
                        onClick={() => setCheckoutStep("cart")}
                        className={`px-6 py-5 bg-transparent border border-black text-black text-xs font-medium uppercase tracking-[0.2em] transition-colors hover:bg-black/5 ${outfit.className}`}
                      >
                        Back
                      </button>
                      <button 
                        type="submit"
                        form="checkout-form"
                        className={`flex-1 py-5 bg-black text-white text-xs font-medium uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-3 group overflow-hidden relative ${outfit.className}`}
                      >
                        <span className="relative z-10 flex items-center gap-3">
                          PLACE ORDER <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-[#333] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-0" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain p-8 space-y-8 min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {cart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-black/20 space-y-6">
                        <ShoppingBag className="w-16 h-16 stroke-[0.5]" />
                        <p className={`text-xl ${cormorant.className} italic`}>Your cart remains empty.</p>
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
                            key={item.id} 
                            className="flex gap-6 group"
                          >
                            <div className="w-24 h-32 bg-[#F5F5F5] overflow-hidden shrink-0">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover opacity-90 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                            </div>
                            <div className="flex-1 flex flex-col justify-between py-1">
                              <div>
                                <h3 className={`text-lg text-black leading-tight ${cormorant.className}`}>{item.name}</h3>
                                <p className={`text-xs text-black/40 mt-2 uppercase tracking-widest ${outfit.className}`}>{item.category}</p>
                              </div>
                              <div className="flex justify-between items-center mt-4">
                                <p className={`text-sm text-black/80 ${outfit.className} font-light`}>${item.price.toFixed(2)}</p>
                                <div className="flex items-center gap-4 text-black/60 pointer-events-auto" style={{ cursor: "none" }}>
                                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="hover:text-black transition-colors">-</button>
                                  <span className={`text-xs ${outfit.className}`}>{item.quantity}</span>
                                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="hover:text-black transition-colors">+</button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </div>

                  {cart.length > 0 && (
                    <div className="p-8 border-t border-black/5 bg-[#FAFAFA]">
                      {/* Coupon Logic */}
                      <div className="mb-6 pointer-events-auto" style={{ cursor: "none" }}>
                         {!appliedCoupon ? (
                           <form onSubmit={handleApplyCoupon} className="flex gap-2">
                             <input 
                               type="text" 
                               value={couponInput}
                               onChange={(e) => setCouponInput(e.target.value)}
                               placeholder="PROMO CODE" 
                               className={`flex-1 bg-white border border-black/10 px-4 py-3 text-xs uppercase tracking-widest text-black placeholder:text-black/30 focus:outline-none focus:border-black/50 transition-colors ${outfit.className}`}
                               style={{ cursor: "none" }}
                             />
                             <button type="submit" className={`px-4 bg-black/5 hover:bg-black/10 text-black text-xs uppercase tracking-widest transition-colors ${outfit.className}`} style={{ cursor: "none" }}>
                               Apply
                             </button>
                           </form>
                         ) : (
                           <div className="flex justify-between items-center bg-white border border-black/20 px-4 py-3">
                             <span className={`text-xs text-black tracking-widest uppercase ${outfit.className}`}>{appliedCoupon}</span>
                             <button onClick={removeCoupon} className="text-black/40 hover:text-black transition-colors">
                               <X className="w-3 h-3" />
                             </button>
                           </div>
                         )}
                         {couponError && <p className={`text-red-500 text-xs mt-2 ${outfit.className}`}>{couponError}</p>}
                      </div>

                      <div className="space-y-4 mb-8">
                        <div className="flex justify-between items-center">
                          <span className={`text-black/40 text-xs uppercase tracking-widest ${outfit.className}`}>Subtotal</span>
                          <span className={`text-black/80 ${outfit.className} font-light`}>
                            ${cart.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2)}
                          </span>
                        </div>
                        {discountAmount > 0 && (
                          <div className="flex justify-between items-center">
                            <span className={`text-black text-xs uppercase tracking-widest ${outfit.className}`}>Discount</span>
                            <span className={`text-black ${outfit.className} font-light`}>
                              -${discountAmount.toFixed(2)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-4 border-t border-black/10">
                          <span className={`text-black text-sm uppercase tracking-widest font-medium ${outfit.className}`}>Total</span>
                          <span className={`text-2xl text-black ${cormorant.className} italic`}>
                            ${(cart.reduce((acc, item) => acc + (item.price * item.quantity), 0) - discountAmount).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={startCheckout}
                        style={{ cursor: "none" }}
                        className={`w-full py-5 bg-black text-white text-xs font-medium uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-3 group overflow-hidden relative pointer-events-auto ${outfit.className}`}
                      >
                        <span className="relative z-10 flex items-center gap-3">
                          PROCEED TO CHECKOUT <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-[#222] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-0" />
                      </button>
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

function HorizonFooter() {
  return (
    <footer className="bg-[#FAFAFA] border-t border-black/5 pt-32 pb-12 relative overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 md:gap-24 mb-24">
          <div className="md:col-span-2">
            <Link href="/preview/growth/horizon" className="flex items-center gap-3 mb-8 pointer-events-auto" style={{ cursor: "none" }}>
              <span className={`text-3xl text-black tracking-widest uppercase ${outfit.className}`}>
                H<span className="text-black/30">ORIZON</span>
              </span>
            </Link>
            <p className={`text-black/50 max-w-md text-sm leading-loose font-light ${outfit.className}`}>
              A curated collection of exceptionally crafted digital assets. Designed for the most discerning creators and agencies aiming for unparalleled aesthetic excellence.
            </p>
          </div>
          <div>
            <h4 className={`text-[10px] text-black/40 tracking-[0.3em] font-medium uppercase mb-8 ${outfit.className}`}>Discovery</h4>
            <ul className={`space-y-4 text-sm font-light text-black/70 ${outfit.className}`}>
              <li><Link href="/preview/growth/horizon/products" className="hover:text-black transition-colors pointer-events-auto" style={{ cursor: "none" }}>The Vault</Link></li>
              <li><Link href="/preview/growth/horizon/about" className="hover:text-black transition-colors pointer-events-auto" style={{ cursor: "none" }}>Manifesto</Link></li>
              <li><Link href="/preview/growth/horizon/contact" className="hover:text-black transition-colors pointer-events-auto" style={{ cursor: "none" }}>Inquiries</Link></li>
            </ul>
          </div>
          <div>
            <h4 className={`text-[10px] text-black/40 tracking-[0.3em] font-medium uppercase mb-8 ${outfit.className}`}>Connect</h4>
            <ul className={`space-y-4 text-sm font-light text-black/70 ${outfit.className}`}>
              <li><Link href="#" className="hover:text-black transition-colors pointer-events-auto" style={{ cursor: "none" }}>Instagram</Link></li>
              <li><Link href="#" className="hover:text-black transition-colors pointer-events-auto" style={{ cursor: "none" }}>Twitter (X)</Link></li>
              <li><Link href="#" className="hover:text-black transition-colors pointer-events-auto" style={{ cursor: "none" }}>Awwwards</Link></li>
            </ul>
          </div>
        </div>
        
        <div className={`pt-12 border-t border-black/5 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-black/40 tracking-widest uppercase ${outfit.className}`}>
          <p>© 2026 HORIZON STUDIO.</p>
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
  const { toastMessage } = useHorizon();
  return (
    <AnimatePresence>
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-12 right-12 z-[100] bg-white border border-black/10 text-black px-6 py-4 shadow-[0_20px_40px_rgba(0,0,0,0.08)] flex items-center gap-4 pointer-events-auto"
        >
          <div className="w-1.5 h-1.5 bg-black rounded-full" />
          <span className={`${outfit.className} text-xs font-medium tracking-wide uppercase`}>{toastMessage}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Global Custom Cursor for the entire layout
function GlobalCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);

      const target = e.target as HTMLElement;
      const isActionable = target.closest('a, button, input, textarea, select, [role="button"], label') !== null;
      setIsHovering(isActionable);
    };
    
    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 rounded-full mix-blend-difference pointer-events-none z-[9999] flex items-center justify-center bg-white"
      animate={{
        x: mousePosition.x - (isHovering ? 32 : 8),
        y: mousePosition.y - (isHovering ? 32 : 8),
        width: isHovering ? 64 : 16,
        height: isHovering ? 64 : 16,
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 28,
        mass: 0.5
      }}
    />
  );
}

export default function HorizonLayout({ children }: { children: ReactNode }) {
  return (
    <HorizonProvider>
      <div className={`min-h-screen bg-[#FAFAFA] text-[#111111] selection:bg-black selection:text-white ${cormorant.variable} ${outfit.variable} font-sans flex flex-col overflow-x-hidden cursor-none`}>
        <GlobalCursor />
        <HorizonNavigation />
        <main className="flex-1 pointer-events-none *:pointer-events-auto">{children}</main>
        <HorizonFooter />
        <ToastContainer />
      </div>
    </HorizonProvider>
  );
}
