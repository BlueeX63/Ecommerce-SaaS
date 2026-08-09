"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type Review = {
  id: string;
  author: string;
  rating: number; // 1 to 5
  date: string;
  content: string;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  hoverImage?: string;
  images?: string[];
  category: string;
  brand: string;
  wearType: "top" | "bottom" | "accessory" | "footwear" | "other";
  rating: number;
  reviews: Review[];
  description: string;
  isNew?: boolean;
};

// Mock products for Nexus Pro
export const NEXUS_PRODUCTS: Product[] = [
  {
    id: "nx-001",
    name: "Aero X1 Tech Jacket",
    price: 349.00,
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=2000&auto=format&fit=crop",
    hoverImage: "https://images.unsplash.com/photo-1559551409-dadc959f76b8?q=80&w=2000&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=2000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1559551409-dadc959f76b8?q=80&w=2000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2000&auto=format&fit=crop"
    ],
    category: "Outerwear",
    brand: "Nexus",
    wearType: "top",
    rating: 4.8,
    isNew: true,
    description: "The ultimate tech jacket for the modern urban explorer. Water-resistant, breathable, and features 12 utility pockets.",
    reviews: [
      { id: "r1", author: "Alex D.", rating: 5, date: "Oct 12, 2023", content: "Incredible build quality. The zippers are buttery smooth and it looks amazing." },
      { id: "r2", author: "Sam K.", rating: 4, date: "Sep 28, 2023", content: "Great jacket, runs slightly large but perfect for layering." }
    ]
  },
  {
    id: "nx-002",
    name: "Lumina Stealth Pants",
    price: 189.00,
    image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=2000&auto=format&fit=crop",
    category: "Pants",
    brand: "Lumina",
    wearType: "bottom",
    rating: 4.5,
    description: "Articulated fit with four-way stretch. Designed for maximum mobility and sleek aesthetics.",
    reviews: [
      { id: "r3", author: "Jordan P.", rating: 5, date: "Nov 02, 2023", content: "Most comfortable pants I own. Worth every penny." }
    ]
  },
  {
    id: "nx-003",
    name: "Void Courier Messenger",
    price: 215.00,
    image: "https://images.unsplash.com/photo-1547949003-9792a18a2601?q=80&w=2000&auto=format&fit=crop",
    category: "Bags",
    brand: "Void",
    wearType: "accessory",
    rating: 4.9,
    description: "Magnetic fidlock closures, waterproof zip compartments, and a dedicated 16-inch laptop sleeve.",
    reviews: [
      { id: "r4", author: "Chris M.", rating: 5, date: "Dec 10, 2023", content: "Perfect commuter bag. Looks very futuristic." }
    ]
  },
  {
    id: "nx-004",
    name: "Aero Seamless Tee",
    price: 65.00,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=2000&auto=format&fit=crop",
    category: "Shirts",
    brand: "Nexus",
    wearType: "top",
    rating: 4.2,
    description: "Engineered mesh ventilation zones mapped to the body's heat centers.",
    reviews: []
  },
  {
    id: "nx-005",
    name: "Lumina Apex Runners",
    price: 280.00,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2000&auto=format&fit=crop",
    category: "Shoes",
    brand: "Lumina",
    wearType: "footwear",
    rating: 4.7,
    isNew: true,
    description: "Carbon-fiber infused midsole for explosive energy return.",
    reviews: [
      { id: "r5", author: "Taylor W.", rating: 4, date: "Jan 15, 2024", content: "Very bouncy and light. Sizing is true to size." },
      { id: "r6", author: "Morgan L.", rating: 5, date: "Feb 03, 2024", content: "Best running shoes I've ever used. The aesthetics are unmatched." }
    ]
  },
  {
    id: "nx-006",
    name: "Void Tactical Vest",
    price: 195.00,
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=2000&auto=format&fit=crop",
    category: "Outerwear",
    brand: "Void",
    wearType: "top",
    rating: 4.1,
    description: "Modular webbing system allows for customizable attachments.",
    reviews: []
  }
];

export type Order = {
  id: string;
  date: string;
  status: "Processing" | "Shipped" | "Delivered";
  total: number;
  items: { name: string; quantity: number; price: number; image: string }[];
};

type CartItem = {
  product: Product;
  quantity: number;
};

type ShopContextType = {
  currencySymbol: string;
  // Cart
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalPrice: number;
  cartCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  
  // Wishlist
  wishlist: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;

  // Orders
  orders: Order[];
  placeOrder: (order: Order) => void;

  // Coupons
  appliedCoupon: string | null;
  discountAmount: number;
  couponError: string | null;
  applyCoupon: (code: string) => void;
  removeCoupon: () => void;
};

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function ShopProvider({ children , initialCustomData }: { children: ReactNode, initialCustomData?: any  }) {

  const symbolMap: Record<string, string> = {
    USD: "$", EUR: "€", GBP: "£", CAD: "C$", AUD: "A$", INR: "₹"
  };
  const initCurrency = initialCustomData?.formData?.currency || "USD";
  const [currencySymbol, setCurrencySymbol] = useState(symbolMap[initCurrency] || "$");

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "MONOLITH_CUSTOMIZATION") {
        const currency = event.data.data?.formData?.currency || "USD";
        setCurrencySymbol(symbolMap[currency] || "$");
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([
    {
      id: "ORD-NEXUS-001",
      date: "Jan 12, 2024",
      status: "Delivered",
      total: 349.00,
      items: [
        { name: "Aero X1 Tech Jacket", quantity: 1, price: 349.00, image: NEXUS_PRODUCTS[0].image }
      ]
    }
  ]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("nexus_cart");
      const savedWishlist = localStorage.getItem("nexus_wishlist");
      const savedOrders = localStorage.getItem("nexus_orders");
      
      if (savedCart) setCartItems(JSON.parse(savedCart));
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
      if (savedOrders) setOrders(JSON.parse(savedOrders));
    } catch (e) {
      console.error("Failed to parse local storage for Nexus shop");
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("nexus_cart", JSON.stringify(cartItems));
      localStorage.setItem("nexus_wishlist", JSON.stringify(wishlist));
      localStorage.setItem("nexus_orders", JSON.stringify(orders));
    }
  }, [cartItems, wishlist, orders, mounted]);

  // Cart logic
  const addToCart = (product: Product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { product, quantity }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return removeFromCart(productId);
    setCartItems((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => setCartItems([]);

  const totalPrice = cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  let discountAmount = 0;
  if (appliedCoupon === 'DISCOUNT20') {
    discountAmount = (totalPrice || 0) * 0.2;
  } else if (appliedCoupon === 'SAVE50') {
    discountAmount = Math.min(50, totalPrice || 0);
  } else if (appliedCoupon) {
    discountAmount = (totalPrice || 0) * 0.1; 
  }

  const applyCoupon = async (code: string) => {
    setCouponError(null);
    if (code.toUpperCase() === 'DISCOUNT20' || code.toUpperCase() === 'SAVE50') {
      setAppliedCoupon(code.toUpperCase());
    } else {
      setCouponError("Invalid coupon code");
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  // Wishlist logic
  const toggleWishlist = (product: Product) => {
    setWishlist((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) return prev.filter((p) => p.id !== product.id);
      return [...prev, product];
    });
  };

  const isInWishlist = (productId: string) => wishlist.some((p) => p.id === productId);

  // Order logic
  const placeOrder = (order: Order) => {
    setOrders((prev) => [order, ...prev]);
    clearCart();
  };

  return (
    <ShopContext.Provider
      value={{
        currencySymbol,
        cartItems,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        totalPrice,
        cartCount,
        isCartOpen,
        setIsCartOpen,
        wishlist,
        toggleWishlist,
        isInWishlist,
        orders,
        placeOrder,
        appliedCoupon,
        discountAmount,
        couponError,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error("useShop must be used within a ShopProvider");
  }
  return context;
}
