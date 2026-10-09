"use client";

import { StoreCheckout, type CheckoutTheme } from "@/components/storefront/StoreCheckout";
import type { PaymentMethodDetails } from "@/components/storefront/PremiumPaymentSelector";
import { useCart } from "../CartContext";

const ESSENCE_THEME: CheckoutTheme = {
  page: "bg-[#F3EDE2] text-[#4A3F35]",
  panel: "bg-[#fbf8f2]",
  heading: "text-[#4A3F35]",
  muted: "text-[#4A3F35]/60",
  border: "border-[#4A3F35]/15",
  accent: "text-[#8a5a2b]",
  success: "text-green-700",
  danger: "text-red-700",
  chip: "bg-[#E3D8C8]/50",
  label: "text-[#4A3F35]",
  input: "border border-[#4A3F35]/25 bg-white/70 px-3.5 py-3 text-sm text-[#4A3F35] placeholder:text-[#4A3F35]/35 focus:border-[#4A3F35] focus:outline-none focus:ring-2 focus:ring-[#4A3F35]/15",
  primaryButton: "bg-[#4A3F35] text-[#F3EDE2] hover:bg-[#332B25]",
  secondaryButton: "border border-[#4A3F35] text-[#4A3F35] hover:bg-[#4A3F35]/5",
  payment: "light",
  paymentRing: "ring-[#4A3F35]",
  paymentDot: "bg-[#4A3F35]",
  title: "font-serif text-3xl text-[#4A3F35] sm:text-4xl",
};

export default function EssenceCheckoutPage({
  initialOnlinePaymentsEnabled,
  initialPaymentMethods,
  initialSlug,
}: { initialOnlinePaymentsEnabled?: boolean; initialPaymentMethods?: PaymentMethodDetails; initialSlug?: string } = {}) {
  const ctx = useCart();

  return (
    <StoreCheckout
      theme={ESSENCE_THEME}
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
