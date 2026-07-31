"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export interface QuantumProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  isNew?: boolean;
  rating: number;
  description: string;
  brand: string;
  materials: string[];
}

export const QUANTUM_PRODUCTS: QuantumProduct[] = [
  {
    id: "q-1",
    name: "Aether Levitation Planter",
    category: "Decor",
    price: 450.00,
    image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?q=80&w=2000&auto=format&fit=crop",
    isNew: true,
    rating: 4.9,
    description: "Defy gravity with the Aether Planter. Utilizing electromagnetic suspension, this piece floats seamlessly above its polished obsidian base.",
    brand: "Quantum",
    materials: ["Obsidian Base", "Ceramic Vessel", "Electromagnetic Core"]
  },
  {
    id: "q-2",
    name: "Prism Contour Chair",
    category: "Furniture",
    price: 1200.00,
    image: "https://images.unsplash.com/photo-1592078615290-033ee584e267?q=80&w=2000&auto=format&fit=crop",
    isNew: false,
    rating: 4.8,
    description: "A continuous flow of transparent acrylic. The Prism Contour Chair plays with light and shadow to create a stunning optical illusion.",
    brand: "Quantum",
    materials: ["Lucite", "Brushed Steel"]
  },
  {
    id: "q-3",
    name: "Nova Ambient Sphere",
    category: "Lighting",
    price: 320.00,
    image: "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?q=80&w=2000&auto=format&fit=crop",
    isNew: true,
    rating: 4.7,
    description: "Bring the cosmos indoors. The Nova Sphere projects a continuously evolving, fluid light show that adapts to your room's ambient sound.",
    brand: "Lumiere",
    materials: ["Frosted Glass", "Aluminum"]
  },
  {
    id: "q-4",
    name: "Monolith Coffee Table",
    category: "Furniture",
    price: 890.00,
    image: "https://images.unsplash.com/photo-1633504581786-316c8002b1b9?q=80&w=2000&auto=format&fit=crop",
    isNew: false,
    rating: 4.6,
    description: "Carved from a single piece of dark basalt, this coffee table anchors any living space with its brutalist, uncompromising geometry.",
    brand: "Quantum",
    materials: ["Basalt Stone", "Tempered Glass"]
  },
  {
    id: "q-5",
    name: "Kinetic Timepiece",
    category: "Decor",
    price: 550.00,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=2000&auto=format&fit=crop",
    isNew: true,
    rating: 4.9,
    description: "More than a clock, this is a kinetic sculpture. The fluid metallic hands glide silently over a minimalist concrete face.",
    brand: "Chronos",
    materials: ["Concrete", "Titanium"]
  },
  {
    id: "q-6",
    name: "Echo Sound System",
    category: "Audio",
    price: 1800.00,
    image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=2000&auto=format&fit=crop",
    isNew: false,
    rating: 4.9,
    description: "Unparalleled acoustic clarity wrapped in a seamless cylindrical shell. The Echo system fills your space with immersive, multi-directional sound.",
    brand: "Acoustica",
    materials: ["Acoustic Mesh", "Anodized Aluminum"]
  }
];

export interface CartItem extends QuantumProduct {
  quantity: number;
}

interface QuantumContextType {
  cart: CartItem[];
  addToCart: (product: QuantumProduct) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  wishlist: QuantumProduct[];
  toggleWishlist: (product: QuantumProduct) => void;
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

const QuantumContext = createContext<QuantumContextType | undefined>(undefined);

export function QuantumProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<QuantumProduct[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const addToCart = (product: QuantumProduct) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    showToast(`Added ${product.name} to cart`);
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

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  let discountAmount = 0;
  if (appliedCoupon === 'DISCOUNT20') {
    discountAmount = cartTotal * 0.2;
  } else if (appliedCoupon === 'SAVE50') {
    discountAmount = Math.min(50, cartTotal);
  }

  const applyCoupon = (code: string) => {
    setCouponError(null);
    const upperCode = code.trim().toUpperCase();
    if (upperCode === "DISCOUNT20" || upperCode === "SAVE50") {
      setAppliedCoupon(upperCode);
      showToast(`Coupon ${upperCode} applied`);
    } else {
      setCouponError("Invalid coupon code");
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
    showToast(`Coupon removed`);
  };

  const toggleWishlist = (product: QuantumProduct) => {
    setWishlist(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        showToast(`Removed ${product.name} from gallery`);
        return prev.filter(item => item.id !== product.id);
      }
      showToast(`Added ${product.name} to gallery`);
      return [...prev, product];
    });
  };

  return (
    <QuantumContext.Provider value={{
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
    </QuantumContext.Provider>
  );
}

export function useQuantum() {
  const context = useContext(QuantumContext);
  if (context === undefined) {
    throw new Error("useQuantum must be used within a QuantumProvider");
  }
  return context;
}
