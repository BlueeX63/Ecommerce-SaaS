"use client";

import { StoreCheckout, type CheckoutTheme } from "@/components/storefront/StoreCheckout";
import type { PaymentMethodDetails } from "@/components/storefront/PremiumPaymentSelector";
import { useHorizon } from "../HorizonContext";

const HORIZON_THEME: CheckoutTheme = {
  page: "bg-[#FAFAFA] text-[#111] font-outfit",
  topPad: "pt-28 lg:pt-32",
  panel: "bg-white",
  heading: "text-[#111]",
  muted: "text-black/50",
  border: "border-black/10",
  accent: "text-[#111]",
  success: "text-green-700",
  danger: "text-red-600",
  chip: "bg-black/[0.04]",
  label: "text-black/70",
  input: "border border-black/15 bg-white px-3.5 py-3 text-sm text-[#111] placeholder:text-black/30 focus:border-black focus:outline-none focus:ring-1 focus:ring-black/30",
  primaryButton: "bg-[#111] text-white hover:bg-[#333]",
  secondaryButton: "border border-black text-[#111] hover:bg-black hover:text-white",
  payment: "light",
  paymentRing: "ring-[#111]",
  paymentDot: "bg-[#111]",
  title: "font-cormorant text-4xl font-light italic text-[#111] sm:text-5xl",
};

export default function HorizonCheckoutPage({
  initialOnlinePaymentsEnabled,
  initialPaymentMethods,
  initialSlug,
}: { initialOnlinePaymentsEnabled?: boolean; initialPaymentMethods?: PaymentMethodDetails; initialSlug?: string } = {}) {
  const ctx = useHorizon();

  return (
    <StoreCheckout
      theme={HORIZON_THEME}
      basePath={ctx.basePath}
      slug={initialSlug}
      lines={ctx.cart.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, image: i.image }))}
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
