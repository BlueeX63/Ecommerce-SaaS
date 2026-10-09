"use client";

import { StoreCheckout, type CheckoutTheme } from "@/components/storefront/StoreCheckout";
import type { PaymentMethodDetails } from "@/components/storefront/PremiumPaymentSelector";
import { useCart } from "../CartContext";

const ORIGIN_THEME: CheckoutTheme = {
  page: "bg-[#fdfbf7] text-[#402c21]",
  panel: "bg-[#f5f1ea]",
  heading: "text-[#402c21]",
  muted: "text-[#402c21]/60",
  border: "border-[#402c21]/15",
  accent: "text-[#8c6a55]",
  success: "text-green-700",
  danger: "text-red-700",
  chip: "bg-[#402c21]/[0.05]",
  label: "text-[#402c21]",
  input: "rounded-sm border border-[#402c21]/25 bg-white/80 px-3.5 py-3 text-sm text-[#402c21] placeholder:text-[#402c21]/35 focus:border-[#402c21] focus:outline-none focus:ring-2 focus:ring-[#402c21]/15",
  primaryButton: "rounded-sm bg-[#402c21] text-[#fdfbf7] hover:bg-[#a38c7f]",
  secondaryButton: "rounded-sm border border-[#402c21] text-[#402c21] hover:bg-[#402c21]/5",
  payment: "light",
  paymentRing: "ring-[#402c21]",
  paymentDot: "bg-[#402c21]",
  title: "font-serif text-3xl font-bold text-[#402c21] sm:text-4xl",
};

export default function OriginCheckoutPage({
  initialOnlinePaymentsEnabled,
  initialPaymentMethods,
  initialSlug,
}: { initialOnlinePaymentsEnabled?: boolean; initialPaymentMethods?: PaymentMethodDetails; initialSlug?: string } = {}) {
  const ctx = useCart();

  return (
    <StoreCheckout
      theme={ORIGIN_THEME}
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
