"use client";
import AccountCenter, { AccountTheme } from "@/components/storefront/AccountCenter";

const theme: AccountTheme = {
  pageBg: "bg-[#0a0a0a]",
  textPrimary: "text-[#ededed]",
  textMuted: "text-white/45",
  cardBg: "bg-white/5",
  cardBorder: "border-white/10",
  accentBg: "bg-[#d4af37]",
  accentText: "text-black",
  headingFont: "font-serif",
  bodyFont: "font-sans",
  rounded: "rounded-xl",
  copy: {
    pageTitle: "My Account",
    pageSubtitle: "Orders and details",
    ordersTab: "Order History",
    profileTab: "Profile",
    logout: "Sign Out",
    emptyOrdersTitle: "No orders yet",
    emptyOrdersBody: "You haven't placed an order yet. Discover the collection to get started.",
    browseCta: "Shop Now",
  },
};

export default function NexusProOrdersPage({ basePath }: { basePath?: string } = {}) {
  return <AccountCenter basePath={basePath || "/templates/nexus-pro"} defaultTab="orders" theme={theme} />;
}
