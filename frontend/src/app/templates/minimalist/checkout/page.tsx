"use client";

import { StoreCheckout, type CheckoutTheme } from "@/components/storefront/StoreCheckout";
import type { PaymentMethodDetails } from "@/components/storefront/PremiumPaymentSelector";
import { useCart } from "../CartContext";

const MINIMALIST_THEME: CheckoutTheme = {
  page: "bg-[#F8F7F5] text-[#111111] font-body",
  panel: "bg-white",
  heading: "text-[#111111]",
  muted: "text-black/50",
  border: "border-black/10",
  accent: "text-[#FF4D00]",
  success: "text-green-600",
  danger: "text-red-600",
  chip: "bg-black/[0.04]",
  label: "text-[#111111]",
  input: "rounded-lg border border-black/15 bg-white px-3.5 py-3 text-sm text-[#111111] placeholder:text-black/30 focus:border-[#FF4D00] focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20",
  primaryButton: "rounded-lg bg-[#111111] text-white hover:bg-[#FF4D00]",
  secondaryButton: "rounded-lg border border-[#111111] text-[#111111] hover:bg-black/5",
  payment: "light",
  paymentRing: "ring-[#111111]",
  paymentDot: "bg-[#111111]",
  title: "font-heading text-3xl tracking-tight text-[#111111] sm:text-4xl",
};

export default function MinimalistCheckoutPage({
  initialOnlinePaymentsEnabled,
  initialPaymentMethods,
  initialSlug,
}: { initialOnlinePaymentsEnabled?: boolean; initialPaymentMethods?: PaymentMethodDetails; initialSlug?: string } = {}) {
  const ctx = useCart();

  return (
    <StoreCheckout
      theme={MINIMALIST_THEME}
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
