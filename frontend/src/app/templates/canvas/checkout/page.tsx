"use client";

import { StoreCheckout, type CheckoutTheme } from "@/components/storefront/StoreCheckout";
import type { PaymentMethodDetails } from "@/components/storefront/PremiumPaymentSelector";
import { useCart } from "../CartContext";

const CANVAS_THEME: CheckoutTheme = {
  page: "bg-black text-white font-mono",
  topPad: "pt-28 lg:pt-32",
  panel: "bg-white/[0.03]",
  heading: "text-white",
  muted: "text-white/50",
  border: "border-white/15",
  accent: "text-white",
  success: "text-emerald-400",
  danger: "text-red-400",
  chip: "bg-white/[0.06]",
  label: "text-white/80",
  input: "border border-white/20 bg-black px-3.5 py-3 text-sm text-white placeholder:text-white/25 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/40",
  primaryButton: "bg-white text-black hover:bg-white/80",
  secondaryButton: "border border-white/30 text-white hover:bg-white/10",
  payment: "dark",
  paymentRing: "ring-white",
  paymentDot: "bg-white",
  title: "font-serif text-4xl italic tracking-tighter text-white",
};

export default function CanvasCheckoutPage({
  initialOnlinePaymentsEnabled,
  initialPaymentMethods,
  initialSlug,
}: { initialOnlinePaymentsEnabled?: boolean; initialPaymentMethods?: PaymentMethodDetails; initialSlug?: string } = {}) {
  const ctx = useCart();

  return (
    <StoreCheckout
      theme={CANVAS_THEME}
      basePath={ctx.basePath}
      slug={initialSlug}
      lines={ctx.items.map((i) => ({ id: i.product.id, name: i.product.name, price: i.product.price, quantity: i.quantity, image: i.product.image }))}
      currencySymbol={ctx.currencySymbol}
      clearCart={ctx.clearCart}
      appliedCoupon={ctx.appliedCoupon}
      applyCoupon={ctx.applyCoupon}
      removeCoupon={ctx.removeCoupon}
      couponError={ctx.couponError}
      initialOnlinePaymentsEnabled={initialOnlinePaymentsEnabled}
      initialPaymentMethods={initialPaymentMethods}
      
    />
  );
}
