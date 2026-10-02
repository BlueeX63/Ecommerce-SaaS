"use client";
import AccountCenter, { AccountTheme } from "@/components/storefront/AccountCenter";

const theme: AccountTheme = {
  pageBg: "bg-[#FAFAFA]",
  textPrimary: "text-[#111111]",
  textMuted: "text-[#111111]/45",
  cardBg: "bg-white",
  cardBorder: "border-black/10",
  accentBg: "bg-[#111111]",
  accentText: "text-white",
  headingFont: "font-cormorant",
  bodyFont: "font-outfit",
  rounded: "rounded-lg",
  tracked: true,
  copy: {
    pageTitle: "Account",
    pageSubtitle: "Orders & Details",
    ordersTab: "Order History",
    profileTab: "Personal Info",
    logout: "Sign Out",
    emptyOrdersTitle: "No orders yet",
    emptyOrdersBody: "You haven't placed an order yet. Explore the collection to find something you'll love.",
    browseCta: "Explore Collection",
  },
};

export default function HorizonProfilePage({ basePath }: { basePath?: string } = {}) {
  return <AccountCenter basePath={basePath || "/templates/horizon"} defaultTab="profile" theme={theme} />;
}
