"use client";

import { StoreCheckout, type CheckoutTheme } from "@/components/storefront/StoreCheckout";
import type { PaymentMethodDetails } from "@/components/storefront/PremiumPaymentSelector";
import { useShop } from "../ShopContext";

const NEXUS_PRO_THEME: CheckoutTheme = {
  page: "bg-[#0a0a0a] text-[#ededed]",
  topPad: "pt-28 lg:pt-32",
  panel: "bg-white/[0.04]",
  heading: "text-white",
  muted: "text-white/55",
  border: "border-white/10",
  accent: "text-[#d4af37]",
  success: "text-emerald-400",
  danger: "text-red-400",
  chip: "bg-white/[0.06]",
  label: "text-white/70",
  input: "rounded-lg border border-white/15 bg-white/5 px-3.5 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/25",
  primaryButton: "rounded-lg bg-[#d4af37] text-black hover:bg-[#e6c24f]",
  secondaryButton: "rounded-lg border border-white/25 text-white hover:bg-white/10",
  payment: "dark",
  paymentRing: "ring-[#d4af37]",
  paymentDot: "bg-[#d4af37]",
  title: "text-3xl font-black tracking-tight text-white sm:text-4xl",
};

export default function NexusProCheckoutPage({
  initialOnlinePaymentsEnabled,
  initialPaymentMethods,
  initialSlug,
}: { initialOnlinePaymentsEnabled?: boolean; initialPaymentMethods?: PaymentMethodDetails; initialSlug?: string } = {}) {
  const ctx = useShop();

  return (
    <StoreCheckout
      theme={NEXUS_PRO_THEME}
      basePath={ctx.basePath}
      slug={initialSlug}
      lines={ctx.cartItems.map((i) => ({ id: i.product.id, name: i.product.name, price: i.product.price, quantity: i.quantity, image: i.product.image }))}
      currencySymbol={ctx.currencySymbol}
      clearCart={ctx.clearCart}
      appliedCoupon={ctx.appliedCoupon}
      applyCoupon={ctx.applyCoupon}
      removeCoupon={ctx.removeCoupon}
      couponError={ctx.couponError}
      initialOnlinePaymentsEnabled={initialOnlinePaymentsEnabled}
      initialPaymentMethods={initialPaymentMethods}
      onOrderPlaced={(o) => ctx.placeOrder({ id: o.orderNumber, date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }), total: o.total, status: 'Processing', items: ctx.cartItems.map((i) => ({ name: i.product.name, quantity: i.quantity, price: i.product.price, image: i.product.image })) })}
    />
  );
}
