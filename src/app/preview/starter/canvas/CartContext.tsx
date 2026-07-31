"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
};

// Editorial / Brutalist dummy products
export const ALL_PRODUCTS: Product[] = [
  { id: "c1", name: "Structural Tote Bag", price: 120.00, image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=2000&auto=format&fit=crop", category: "Apparel" },
  { id: "c2", name: "Type Specimen Zine", price: 35.00, image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=2000&auto=format&fit=crop", category: "Print" },
  { id: "c3", name: "Steel Bookend", price: 85.00, image: "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?q=80&w=2000&auto=format&fit=crop", category: "Object" },
  { id: "c4", name: "Monospace Poster", price: 40.00, image: "https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?q=80&w=2000&auto=format&fit=crop", category: "Print" },
  { id: "c5", name: "Clear Acetate Frame", price: 65.00, image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=2000&auto=format&fit=crop", category: "Object" },
  { id: "c6", name: "Industrial Chair", price: 320.00, image: "https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=2000&auto=format&fit=crop", category: "Furniture" },
  { id: "c7", name: "Brutalist Ashtray", price: 55.00, image: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?q=80&w=2000&auto=format&fit=crop", category: "Object" },
  { id: "c8", name: "Archive Box", price: 45.00, image: "https://images.unsplash.com/photo-1544457070-4cd773b4d71e?q=80&w=2000&auto=format&fit=crop", category: "Storage" },
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
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  
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
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const savedCart = localStorage.getItem("canvas_cart");
    const savedWishlist = localStorage.getItem("canvas_wishlist");
    const savedReviews = localStorage.getItem("canvas_reviews");
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart");
      }
    }
    if (savedWishlist) {
      try {
        setWishlist(JSON.parse(savedWishlist));
      } catch (e) {
        console.error("Failed to parse wishlist");
      }
    }
    if (savedReviews) {
      try {
        setReviews(JSON.parse(savedReviews));
      } catch (e) {
        console.error("Failed to parse reviews");
      }
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("canvas_cart", JSON.stringify(items));
      localStorage.setItem("canvas_wishlist", JSON.stringify(wishlist));
      localStorage.setItem("canvas_reviews", JSON.stringify(reviews));
    }
  }, [items, wishlist, reviews, mounted]);

  const addToCart = (product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return removeFromCart(productId);
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const cartTotal = items.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  const cartCount = items.reduce((count, item) => count + item.quantity, 0);

  const clearCart = () => {
    setItems([]);
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

  // Coupon logic
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
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        isCartOpen,
        setIsCartOpen,
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
