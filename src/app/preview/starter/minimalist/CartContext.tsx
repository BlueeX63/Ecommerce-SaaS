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
  { id: "1", name: "The Perfect Tee", price: 35.00, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=2000&auto=format&fit=crop", category: "Tops" },
  { id: "2", name: "Everyday Denim", price: 98.00, image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=2000&auto=format&fit=crop", category: "Bottoms" },
  { id: "3", name: "Minimalist Watch", price: 145.00, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=2000&auto=format&fit=crop", category: "Accessories" },
  { id: "4", name: "Leather Tote", price: 210.00, image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=2000&auto=format&fit=crop", category: "Bags" },
  { id: "5", name: "Linen Button-Down", price: 85.00, image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=2000&auto=format&fit=crop", category: "Tops" },
  { id: "6", name: "Classic Sneakers", price: 125.00, image: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=2000&auto=format&fit=crop", category: "Shoes" },
  { id: "7", name: "Cashmere Sweater", price: 195.00, image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=2000&auto=format&fit=crop", category: "Tops" },
  { id: "8", name: "Tailored Trousers", price: 115.00, image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=2000&auto=format&fit=crop", category: "Bottoms" },
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
  currencySymbol: string;

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
  const [currencySymbol, setCurrencySymbol] = useState("$");

  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "MONOLITH_CUSTOMIZATION") {
        const currency = event.data.data?.formData?.currency || "USD";
        const symbolMap: Record<string, string> = {
          USD: "$", EUR: "€", GBP: "£", CAD: "C$", AUD: "A$", INR: "₹"
        };
        setCurrencySymbol(symbolMap[currency] || "$");
      }
    };
    window.addEventListener("message", handleMessage);
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "MONOLITH_REQUEST_STATE" }, "*");
    }
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Load from local storage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("starter-preview-cart");
    const savedWishlist = localStorage.getItem("starter-preview-wishlist");
    const savedReviews = localStorage.getItem("minimalist-reviews");
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

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem("starter-preview-cart", JSON.stringify(items));
    localStorage.setItem("starter-preview-wishlist", JSON.stringify(wishlist));
    localStorage.setItem("minimalist-reviews", JSON.stringify(reviews));
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
        currencySymbol,
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
