"use client";
import AccountCenter, { AccountTheme } from "@/components/storefront/AccountCenter";

const theme: AccountTheme = {
  pageBg: "bg-[#F3EDE2]",
  textPrimary: "text-[#4A3F35]",
  textMuted: "text-[#4A3F35]/60",
  cardBg: "bg-white/60",
  cardBorder: "border-[#4A3F35]/10",
  accentBg: "bg-[#4A3F35]",
  accentText: "text-[#F3EDE2]",
  headingFont: "font-serif",
  bodyFont: "font-sans",
  rounded: "rounded-2xl",
  copy: {
    pageTitle: "Your Account",
    pageSubtitle: "Orders and details",
    ordersTab: "Order History",
    profileTab: "My Details",
    logout: "Sign Out",
    emptyOrdersTitle: "Nothing here yet",
    emptyOrdersBody: "You haven't placed an order with us yet. Explore the collection to find something you'll love.",
    browseCta: "Browse Collection",
  },
};

export default function EssenceOrdersPage({ basePath }: { basePath?: string } = {}) {
  return <AccountCenter basePath={basePath ?? "/templates/essence"} defaultTab="orders" theme={theme} />;
}
