"use client";
import AccountCenter, { AccountTheme } from "@/components/storefront/AccountCenter";

const theme: AccountTheme = {
  pageBg: "bg-[#0f0f11]",
  textPrimary: "text-[#e0e0e0]",
  textMuted: "text-[#e0e0e0]/45",
  cardBg: "bg-[#1a1a1f]",
  cardBorder: "border-[#00ffaa]/20",
  accentBg: "bg-[#00ffaa]",
  accentText: "text-black",
  headingFont: "font-mono",
  bodyFont: "font-mono",
  rounded: "rounded-none",
  tracked: true,
  copy: {
    pageTitle: "User_Profile",
    pageSubtitle: "Access account data",
    ordersTab: "Order Log",
    profileTab: "Identity",
    logout: "Disconnect",
    emptyOrdersTitle: "No records found",
    emptyOrdersBody: "Your order log is empty. Access the grid to make your first acquisition.",
    browseCta: "Access the Grid",
  },
};

export default function VelocityOrdersPage({ basePath }: { basePath?: string } = {}) {
  return <AccountCenter basePath={basePath || "/templates/velocity"} defaultTab="orders" theme={theme} />;
}
