"use client";

import { StoreCheckout, type CheckoutTheme } from "@/components/storefront/StoreCheckout";
import type { PaymentMethodDetails } from "@/components/storefront/PremiumPaymentSelector";
import { useVelocity } from "../VelocityContext";

const VELOCITY_THEME: CheckoutTheme = {
  page: "bg-[#0f0f11] text-[#e0e0e0] font-mono",
  topPad: "pt-28 lg:pt-32",
  panel: "bg-[#1a1a1f]",
  heading: "text-white",
  muted: "text-[#a0a0a0]",
  border: "border-white/10",
  accent: "text-[#00ffaa]",
  success: "text-[#00ffaa]",
  danger: "text-red-400",
  chip: "bg-white/[0.05]",
  label: "text-[#a0a0a0]",
  input: "rounded-md border border-white/15 bg-[#0f0f11] px-3.5 py-3 text-sm text-white placeholder:text-white/25 focus:border-[#00ffaa] focus:outline-none focus:ring-2 focus:ring-[#00ffaa]/25",
  primaryButton: "rounded-md bg-[#00ffaa] text-black hover:bg-[#33ffbb]",
  secondaryButton: "rounded-md border border-white/20 text-white hover:bg-white/10",
  payment: "dark",
  paymentRing: "ring-[#00ffaa]",
  paymentDot: "bg-[#00ffaa]",
  title: "text-3xl font-bold uppercase tracking-tight text-white sm:text-4xl",
};

export default function VelocityCheckoutPage({
  initialOnlinePaymentsEnabled,
  initialPaymentMethods,
  initialSlug,
}: { initialOnlinePaymentsEnabled?: boolean; initialPaymentMethods?: PaymentMethodDetails; initialSlug?: string } = {}) {
  const ctx = useVelocity();

  return (
    <StoreCheckout
      theme={VELOCITY_THEME}
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
