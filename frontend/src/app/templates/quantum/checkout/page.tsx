"use client";

import { StoreCheckout, type CheckoutTheme } from "@/components/storefront/StoreCheckout";
import type { PaymentMethodDetails } from "@/components/storefront/PremiumPaymentSelector";
import { useQuantum } from "../QuantumContext";

const QUANTUM_THEME: CheckoutTheme = {
  page: "bg-[#F9F9FB] text-[#121212] font-inter",
  topPad: "pt-28 lg:pt-32",
  panel: "bg-white",
  heading: "text-[#111111]",
  muted: "text-gray-500",
  border: "border-gray-200",
  accent: "text-[#111111]",
  success: "text-green-600",
  danger: "text-red-600",
  chip: "bg-gray-100",
  label: "text-gray-600",
  input: "rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#111111] placeholder:text-gray-400 focus:border-[#111111] focus:outline-none focus:ring-2 focus:ring-black/10",
  primaryButton: "rounded-xl bg-[#111111] text-white hover:bg-black/80",
  secondaryButton: "rounded-xl border border-gray-300 text-[#111111] hover:bg-gray-100",
  payment: "light",
  paymentRing: "ring-[#111111]",
  paymentDot: "bg-[#111111]",
  title: "font-playfair text-4xl font-bold text-[#111111] sm:text-5xl",
};

export default function QuantumCheckoutPage({
  initialOnlinePaymentsEnabled,
  initialPaymentMethods,
  initialSlug,
}: { initialOnlinePaymentsEnabled?: boolean; initialPaymentMethods?: PaymentMethodDetails; initialSlug?: string } = {}) {
  const ctx = useQuantum();

  return (
    <StoreCheckout
      theme={QUANTUM_THEME}
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
