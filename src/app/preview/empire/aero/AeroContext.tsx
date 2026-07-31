"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
  size?: string;
  color?: string;
  edition?: string;
};

export type Product = Omit<CartItem, 'quantity' | 'size' | 'color'> & {
  size?: string;
  color?: string;
};

export type Review = {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
};

type AeroContextType = {
  cart: CartItem[];
  wishlist: Product[];
  isCartOpen: boolean;
  isMenuOpen: boolean;
  toastMessage: string | null;
  mounted: boolean;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (id: string) => boolean;
  setIsCartOpen: (open: boolean) => void;
  setIsMenuOpen: (open: boolean) => void;
  showToast: (message: string) => void;
  clearCart: () => void;
  
  // Coupons
  appliedCoupon: string | null;
  discountAmount: number;
  couponError: string | null;
  applyCoupon: (code: string) => void;
  removeCoupon: () => void;

  // Reviews
  reviews: Review[];
  addReview: (productId: string, rating: number, comment: string, userName: string) => void;
};

const AeroContext = createContext<AeroContextType | undefined>(undefined);

export function AeroProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const [reviews, setReviews] = useState<Review[]>([]);

  // Load state from local storage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("aero_cart");
    const savedWishlist = localStorage.getItem("aero_wishlist");
    const savedReviews = localStorage.getItem("aero_reviews");
    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    if (savedReviews) setReviews(JSON.parse(savedReviews));
    setMounted(true);
  }, []);

  // Save state to local storage on change
  useEffect(() => {
    localStorage.setItem("aero_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("aero_wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem("aero_reviews", JSON.stringify(reviews));
  }, [reviews]);

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id && i.size === item.size && i.color === item.color);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id && i.size === item.size && i.color === item.color ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      }
      return [...prev, item];
    });
    showToast("Added to Cart");
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(id);
      return;
    }
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
  };

  const clearCart = () => setCart([]);

  const toggleWishlist = (product: Product) => {
    setWishlist((prev) => {
      const exists = prev.some(p => p.id === product.id);
      if (exists) {
        showToast("Removed from Wishlist");
        return prev.filter((item) => item.id !== product.id);
      } else {
        showToast("Added to Wishlist");
        return [...prev, product];
      }
    });
  };

  const isInWishlist = (id: string) => wishlist.some(p => p.id === id);

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  let discountAmount = 0;
  if (appliedCoupon === 'DISCOUNT20') {
    discountAmount = subtotal * 0.2;
  } else if (appliedCoupon === 'SAVE50') {
    discountAmount = Math.min(50, subtotal);
  }

  const applyCoupon = (code: string) => {
    setCouponError(null);
    const upperCode = code.trim().toUpperCase();
    if (upperCode === "DISCOUNT20" || upperCode === "SAVE50") {
      setAppliedCoupon(upperCode);
    } else {
      setCouponError("Invalid coupon code");
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const addReview = (productId: string, rating: number, comment: string, userName: string) => {
    const newReview: Review = {
      id: Math.random().toString(36).substr(2, 9),
      productId,
      userName,
      rating,
      comment,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    };
    setReviews(prev => [...prev, newReview]);
    showToast("Review submitted successfully");
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <AeroContext.Provider
      value={{
        cart,
        wishlist,
        isCartOpen,
        isMenuOpen,
        toastMessage,
        mounted,
        addToCart,
        removeFromCart,
        updateQuantity,
        toggleWishlist,
        isInWishlist,
        setIsCartOpen,
        setIsMenuOpen,
        showToast,
        clearCart,
        appliedCoupon,
        discountAmount,
        couponError,
        applyCoupon,
        removeCoupon,
        reviews,
        addReview
      }}
    >
      {children}
    </AeroContext.Provider>
  );
}

export function useAero() {
  const context = useContext(AeroContext);
  if (context === undefined) {
    throw new Error("useAero must be used within an AeroProvider");
  }
  return context;
}
