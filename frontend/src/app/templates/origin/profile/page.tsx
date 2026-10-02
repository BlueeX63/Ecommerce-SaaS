"use client";
import AccountCenter, { AccountTheme } from "@/components/storefront/AccountCenter";

const theme: AccountTheme = {
  pageBg: "bg-[#fdfbf7]",
  textPrimary: "text-[#402c21]",
  textMuted: "text-[#402c21]/55",
  cardBg: "bg-[#f5f1ea]",
  cardBorder: "border-[#402c21]/10",
  accentBg: "bg-[#402c21]",
  accentText: "text-[#fdfbf7]",
  headingFont: "font-serif",
  bodyFont: "font-sans",
  rounded: "rounded-2xl",
  copy: {
    pageTitle: "Your Account",
    pageSubtitle: "Orders and details",
    ordersTab: "Order History",
    profileTab: "My Details",
    logout: "Sign Out",
    emptyOrdersTitle: "No orders yet",
    emptyOrdersBody: "You haven't placed an order with us yet. Take a look at what we're making.",
    browseCta: "Browse Products",
  },
};

export default function OriginProfilePage({ basePath }: { basePath?: string } = {}) {
  return <AccountCenter basePath={basePath || "/templates/origin"} defaultTab="profile" theme={theme} />;
}
