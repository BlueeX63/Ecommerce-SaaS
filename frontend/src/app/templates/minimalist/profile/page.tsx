"use client";
import AccountCenter, { AccountTheme } from "@/components/storefront/AccountCenter";

const theme: AccountTheme = {
  pageBg: "bg-white",
  textPrimary: "text-[#111111]",
  textMuted: "text-black/50",
  cardBg: "bg-black/[0.02]",
  cardBorder: "border-black/10",
  accentBg: "bg-[#111111]",
  accentText: "text-white",
  headingFont: "font-heading",
  bodyFont: "font-sans",
  rounded: "rounded-lg",
  copy: {
    pageTitle: "Account",
    pageSubtitle: "Manage your orders and details",
    ordersTab: "Order History",
    profileTab: "Personal Info",
    logout: "Log Out",
    emptyOrdersTitle: "No orders yet",
    emptyOrdersBody: "Your order history is empty. Start shopping to see your orders here.",
    browseCta: "Continue Shopping",
  },
};

export default function ProfilePage({ basePath }: { basePath?: string } = {}) {
  return <AccountCenter basePath={basePath ?? "/templates/minimalist"} defaultTab="profile" theme={theme} />;
}
