"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
};

export const ALL_PRODUCTS: Product[] = [
  { id: "e1", name: "Ceramic Vase", price: 85.00, image: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?q=80&w=2000&auto=format&fit=crop", category: "Decor" },
  { id: "e2", name: "Linen Throw", price: 120.00, image: "https://images.unsplash.com/photo-1592078615290-033ee584e267?q=80&w=2000&auto=format&fit=crop", category: "Textiles" },
  { id: "e3", name: "Oak Side Table", price: 340.00, image: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?q=80&w=2000&auto=format&fit=crop", category: "Furniture" },
  { id: "e4", name: "Stoneware Mug", price: 35.00, image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=2000&auto=format&fit=crop", category: "Dining" },
  { id: "e5", name: "Artisan Candle", price: 45.00, image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?q=80&w=2000&auto=format&fit=crop", category: "Fragrance" },
  { id: "e6", name: "Minimalist Lamp", price: 215.00, image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=2000&auto=format&fit=crop", category: "Lighting" },
  { id: "e7", name: "Cotton Pillow", price: 65.00, image: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=2000&auto=format&fit=crop", category: "Textiles" },
  { id: "e8", name: "Woven Basket", price: 95.00, image: "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?q=80&w=2000&auto=format&fit=crop", category: "Storage" },
];

type CartItem = {
  product: Product;
  quantity: number;
};

export type Review = {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
};

type CartContextType = {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  toastMessage: string | null;
  clearToast: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Wishlist
  wishlist: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;

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

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const savedCart = localStorage.getItem("essence-preview-cart");
    const savedWishlist = localStorage.getItem("essence-preview-wishlist");
    const savedReviews = localStorage.getItem("essence-reviews");
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart data", e);
      }
    }
    if (savedWishlist) {
      try {
        setWishlist(JSON.parse(savedWishlist));
      } catch (e) {
        console.error("Failed to parse wishlist data", e);
      }
    }
    if (savedReviews) {
      try {
        setReviews(JSON.parse(savedReviews));
      } catch (e) {
        console.error("Failed to parse reviews data", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("essence-preview-cart", JSON.stringify(items));
    localStorage.setItem("essence-preview-wishlist", JSON.stringify(wishlist));
    localStorage.setItem("essence-reviews", JSON.stringify(reviews));
  }, [items, wishlist, reviews]);

  const addToCart = (product: Product) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setToastMessage(`Added ${product.name} to cart.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const clearToast = () => setToastMessage(null);

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Wishlist logic
  const toggleWishlist = (product: Product) => {
    setWishlist((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        setToastMessage(`Removed ${product.name} from wishlist.`);
        setTimeout(() => setToastMessage(null), 3000);
        return prev.filter((p) => p.id !== product.id);
      }
      setToastMessage(`Added ${product.name} to wishlist.`);
      setTimeout(() => setToastMessage(null), 3000);
      return [...prev, product];
    });
  };

  const isInWishlist = (productId: string) => wishlist.some((p) => p.id === productId);

  // Coupon logic
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

  const addReview = async (productId: string, rating: number, comment: string, userName: string) => {
    try {
      const res = await fetch('/api/v1/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          tenantId: '00000000-0000-0000-0000-000000000000',
          rating,
          comment,
          title: 'Review',
          customerId: null
        })
      });
      
      if (res.ok) {
        const newReview: Review = {
          id: Math.random().toString(36).substr(2, 9),
          productId,
          userName,
          rating,
          comment,
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        };
        setReviews(prev => [...prev, newReview]);
        // Call showToast if it exists in scope, else ignore
        try { if (typeof showToast !== 'undefined') showToast("Review submitted successfully"); } catch(e) {}
      }
    } catch(err) {
      console.error(err);
    }
  };;

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        toastMessage,
        clearToast,
        searchQuery,
        setSearchQuery,
        wishlist,
        toggleWishlist,
        isInWishlist,
        appliedCoupon,
        discountAmount,
        couponError,
        applyCoupon,
        removeCoupon,
        reviews,
        addReview,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
