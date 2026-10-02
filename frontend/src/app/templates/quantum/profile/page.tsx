"use client";
import AccountCenter, { AccountTheme } from "@/components/storefront/AccountCenter";

const theme: AccountTheme = {
  pageBg: "bg-[#F9F9FB]",
  textPrimary: "text-[#111111]",
  textMuted: "text-[#111111]/45",
  cardBg: "bg-white",
  cardBorder: "border-gray-200",
  accentBg: "bg-[#111111]",
  accentText: "text-white",
  headingFont: "font-playfair",
  bodyFont: "font-inter",
  rounded: "rounded-xl",
  copy: {
    pageTitle: "Account",
    pageSubtitle: "Orders and details",
    ordersTab: "Order History",
    profileTab: "Personal Info",
    logout: "Sign Out",
    emptyOrdersTitle: "No orders yet",
    emptyOrdersBody: "You haven't placed an order yet. Return to the gallery to find something new.",
    browseCta: "Return to Gallery",
  },
};

export default function QuantumProfilePage({ basePath }: { basePath?: string } = {}) {
  return <AccountCenter basePath={basePath || "/templates/quantum"} defaultTab="profile" theme={theme} />;
}
