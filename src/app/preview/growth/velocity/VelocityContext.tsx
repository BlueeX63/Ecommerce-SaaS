"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export interface VelocityProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  isNew?: boolean;
  rating: number;
  description: string;
  brand: string;
  wearType: "top" | "bottom" | "accessory" | "footwear" | "other" | "tech";
  specs: string[];
}

export const VELOCITY_PRODUCTS: VelocityProduct[] = [
  {
    id: "v-1",
    name: "Aero-Dynamic Exoskeleton Jacket",
    category: "Outerwear",
    price: 899.99,
    image: "https://images.unsplash.com/photo-1610484826967-09c5720778c7?q=80&w=2000&auto=format&fit=crop",
    isNew: true,
    rating: 4.9,
    description: "Constructed with nano-weave carbon fibers. Adjusts thermal retention dynamically based on core body temperature. Built for the modern cyberpunk.",
    brand: "Velocity",
    wearType: "top",
    specs: ["Nano-weave carbon", "Thermal adaptation", "Waterproof"]
  },
  {
    id: "v-2",
    name: "Neon-Pulse Sneakers",
    category: "Footwear",
    price: 349.99,
    image: "https://images.unsplash.com/photo-1514989940723-e8e51635b782?q=80&w=2000&auto=format&fit=crop",
    isNew: false,
    rating: 4.7,
    description: "Kinetic energy absorption soles with programmable LED light strips. Reacts to your pace and step rhythm.",
    brand: "Velocity",
    wearType: "footwear",
    specs: ["Kinetic soles", "App-controlled LEDs", "Breathable mesh"]
  },
  {
    id: "v-3",
    name: "Haptic Feedback Gloves",
    category: "Accessories",
    price: 199.99,
    image: "https://images.unsplash.com/photo-1517420879524-86d64ac2f339?q=80&w=2000&auto=format&fit=crop",
    isNew: true,
    rating: 4.8,
    description: "Seamless integration with your digital devices. Feel the digital world with precise haptic motors in each fingertip.",
    brand: "Neurolink",
    wearType: "accessory",
    specs: ["Bluetooth 6.0", "Haptic motors", "Touch-screen compatible"]
  },
  {
    id: "v-4",
    name: "Carbon Visor V2",
    category: "Accessories",
    price: 299.99,
    image: "https://images.unsplash.com/photo-1535295972055-1c762f4483e5?q=80&w=2000&auto=format&fit=crop",
    isNew: false,
    rating: 4.6,
    description: "Augmented reality HUD built right into a sleek carbon frame. Syncs with your daily tasks and displays vital metrics.",
    brand: "Velocity",
    wearType: "tech",
    specs: ["AR HUD", "Carbon frame", "12hr battery"]
  },
  {
    id: "v-5",
    name: "Zero-G Cargo Pants",
    category: "Bottoms",
    price: 249.99,
    image: "https://images.unsplash.com/photo-1584865288642-42078afe6942?q=80&w=2000&auto=format&fit=crop",
    isNew: true,
    rating: 4.8,
    description: "Ultra-lightweight tactical cargo pants. The material feels completely weightless, allowing for absolute freedom of movement.",
    brand: "Velocity",
    wearType: "bottom",
    specs: ["Ultra-lightweight", "Water repellent", "Magnetic closures"]
  },
  {
    id: "v-6",
    name: "Quantum Duffle Bag",
    category: "Bags",
    price: 399.99,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=2000&auto=format&fit=crop",
    isNew: false,
    rating: 4.5,
    description: "A bag that seemingly holds more than it should. Features biometric locking and an indestructible Kevlar shell.",
    brand: "AeroTech",
    wearType: "accessory",
    specs: ["Biometric lock", "Kevlar shell", "Vacuum seal tech"]
  }
];

export interface CartItem extends VelocityProduct {
  quantity: number;
  selectedSize?: string;
}

interface VelocityContextType {
  cart: CartItem[];
  addToCart: (product: VelocityProduct, size?: string) => void;
  removeFromCart: (productId: string, size?: string) => void;
  updateQuantity: (productId: string, quantity: number, size?: string) => void;
  clearCart: () => void;
  wishlist: VelocityProduct[];
  toggleWishlist: (product: VelocityProduct) => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  appliedCoupon: string | null;
  discountAmount: number;
  couponError: string | null;
  applyCoupon: (code: string) => void;
  removeCoupon: () => void;
}

const VelocityContext = createContext<VelocityContextType | undefined>(undefined);

export function VelocityProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<VelocityProduct[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const addToCart = (product: VelocityProduct, size?: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.selectedSize === size);
      if (existing) {
        return prev.map(item => 
          item.id === product.id && item.selectedSize === size 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1, selectedSize: size }];
    });
  };

  const removeFromCart = (productId: string, size?: string) => {
    setCart(prev => prev.filter(item => !(item.id === productId && item.selectedSize === size)));
  };

  const updateQuantity = (productId: string, quantity: number, size?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, size);
      return;
    }
    setCart(prev => prev.map(item => 
      item.id === productId && item.selectedSize === size 
        ? { ...item, quantity }
        : item
    ));
  };

  const clearCart = () => setCart([]);

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
  };

  const toggleWishlist = (product: VelocityProduct) => {
    setWishlist(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) return prev.filter(item => item.id !== product.id);
      return [...prev, product];
    });
  };

  return (
    <VelocityContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      wishlist,
      toggleWishlist,
      isCartOpen,
      setIsCartOpen,
      appliedCoupon,
      discountAmount,
      couponError,
      applyCoupon,
      removeCoupon
    }}>
      {children}
    </VelocityContext.Provider>
  );
}

export function useVelocity() {
  const context = useContext(VelocityContext);
  if (context === undefined) {
    throw new Error("useVelocity must be used within a VelocityProvider");
  }
  return context;
}
