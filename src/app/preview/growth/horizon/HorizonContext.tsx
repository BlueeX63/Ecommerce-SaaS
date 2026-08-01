"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export interface HorizonReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
}

export interface HorizonProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  gallery?: string[];
  isNew?: boolean;
  rating: number;
  description: string;
  format: string;
  fileSize: string;
  reviews: HorizonReview[];
}

export const HORIZON_PRODUCTS: HorizonProduct[] = [
  {
    id: "h-1",
    name: "Obsidian UI Framework",
    category: "Design System",
    price: 149.00,
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2000&auto=format&fit=crop"
    ],
    isNew: true,
    rating: 4.9,
    description: "An elegant, dark-themed UI kit featuring sophisticated typography, ultra-smooth interactions, and a meticulous component library.",
    format: "Figma, React",
    fileSize: "210 MB",
    reviews: [
      { id: "r1", author: "Alex Rivera", rating: 5, date: "Oct 24, 2026", text: "The attention to detail in this UI kit is staggering. Saved us weeks of design time." },
      { id: "r2", author: "Sam Chen", rating: 4, date: "Sep 12, 2026", text: "Beautiful typography choices, though I wish there were more dashboard components." }
    ]
  },
  {
    id: "h-2",
    name: "Noir 3D Abstract Objects",
    category: "3D Assets",
    price: 89.00,
    image: "https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?q=80&w=2000&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?q=80&w=2000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"
    ],
    isNew: false,
    rating: 4.8,
    description: "A premium collection of high-resolution abstract 3D objects with dark glass and matte metallic textures.",
    format: "Blender, PNG, OBJ",
    fileSize: "1.2 GB",
    reviews: [
      { id: "r3", author: "Elena Rostova", rating: 5, date: "Nov 02, 2026", text: "Incredible rendering quality. These objects look stunning as hero backgrounds." }
    ]
  },
  {
    id: "h-3",
    name: "Lumina Display Serif",
    category: "Typography",
    price: 45.00,
    image: "https://images.unsplash.com/photo-1512403754473-27835f7b9984?q=80&w=2000&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1512403754473-27835f7b9984?q=80&w=2000&auto=format&fit=crop"
    ],
    isNew: true,
    rating: 4.9,
    description: "A striking, high-contrast serif typeface designed exclusively for luxury brands and editorial statements.",
    format: "OTF, TTF, WOFF2",
    fileSize: "4.1 MB",
    reviews: []
  },
  {
    id: "h-4",
    name: "Fluid Motion Gradients",
    category: "Video Assets",
    price: 65.00,
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2000&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1550684376-efcbd6e3f031?q=80&w=2000&auto=format&fit=crop"
    ],
    isNew: false,
    rating: 4.7,
    description: "Beautifully slow, dark motion backgrounds that add unparalleled depth and elegance to hero sections.",
    format: "MP4 (H.264), ProRes 4444",
    fileSize: "4.5 GB",
    reviews: []
  },
  {
    id: "h-5",
    name: "Aura Framer Template",
    category: "Templates",
    price: 199.00,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop"
    ],
    isNew: true,
    rating: 5.0,
    description: "An Awwwards-winning level Framer template utilizing seamless scroll-jacking and majestic typography.",
    format: "Framer",
    fileSize: "N/A",
    reviews: []
  },
  {
    id: "h-6",
    name: "Eclipse Light Leaks",
    category: "Video Overlays",
    price: 34.00,
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2000&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2000&auto=format&fit=crop"
    ],
    isNew: false,
    rating: 4.6,
    description: "Subtle, cinematic lens flares and light leaks designed to enhance dark-themed footage and imagery.",
    format: "ProRes 422",
    fileSize: "2.1 GB",
    reviews: []
  }
];

export interface CartItem extends HorizonProduct {
  quantity: number;
}

interface HorizonContextType {
  cart: CartItem[];
  addToCart: (product: HorizonProduct) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  wishlist: HorizonProduct[];
  toggleWishlist: (product: HorizonProduct) => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  toastMessage: string | null;
  setToastMessage: (msg: string | null) => void;
  appliedCoupon: string | null;
  discountAmount: number;
  couponError: string | null;
  applyCoupon: (code: string) => void;
  removeCoupon: () => void;
}

const HorizonContext = createContext<HorizonContextType | undefined>(undefined);

export function HorizonProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<HorizonProduct[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const addToCart = (product: HorizonProduct) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    showToast(`Added ${product.name} to cart.`);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => 
      item.id === productId ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => setCart([]);

  const toggleWishlist = (product: HorizonProduct) => {
    setWishlist(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        showToast(`Removed ${product.name} from wishlist.`);
        return prev.filter(item => item.id !== product.id);
      }
      showToast(`Saved ${product.name} to wishlist.`);
      return [...prev, product];
    });
  };

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  let discountAmount = 0;
  if (appliedCoupon === 'DISCOUNT20') {
    discountAmount = (cartTotal || 0) * 0.2;
  } else if (appliedCoupon === 'SAVE50') {
    discountAmount = Math.min(50, cartTotal || 0);
  } else if (appliedCoupon) {
    discountAmount = (cartTotal || 0) * 0.1; // Default 10% for API coupons for demo
  }

  const applyCoupon = async (code: string) => {
    setCouponError(null);
    try {
      const res = await fetch('/api/v1/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code, 
          tenantId: '00000000-0000-0000-0000-000000000000' // Using dummy UUID, in real app from session
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAppliedCoupon(code.toUpperCase());
        // For simplicity, we just use the discount percentage or flat amount.
        // The API returns discount_amount and discount_type. 
        // Real implementation would store this in context state.
      } else {
        setCouponError(data.error || "Invalid coupon code");
      }
    } catch (err) {
      setCouponError("Failed to validate coupon");
    }
  };;

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
    showToast(`Promotional code removed.`);
  };

  return (
    <HorizonContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      wishlist,
      toggleWishlist,
      isCartOpen,
      setIsCartOpen,
      toastMessage,
      setToastMessage,
      appliedCoupon,
      discountAmount,
      couponError,
      applyCoupon,
      removeCoupon
    }}>
      {children}
    </HorizonContext.Provider>
  );
}

export function useHorizon() {
  const context = useContext(HorizonContext);
  if (context === undefined) {
    throw new Error("useHorizon must be used within a HorizonProvider");
  }
  return context;
}
