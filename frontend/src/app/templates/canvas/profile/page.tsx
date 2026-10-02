"use client";
import AccountCenter, { AccountTheme } from "@/components/storefront/AccountCenter";

const theme: AccountTheme = {
  pageBg: "bg-black",
  textPrimary: "text-white",
  textMuted: "text-white/50",
  cardBg: "bg-white/5",
  cardBorder: "border-white/15",
  accentBg: "bg-white",
  accentText: "text-black",
  headingFont: "font-serif",
  bodyFont: "font-sans",
  rounded: "rounded-none",
  tracked: true,
  copy: {
    pageTitle: "Archive",
    pageSubtitle: "Account & Order Records",
    ordersTab: "Order Record",
    profileTab: "Identity",
    logout: "Exit",
    emptyOrdersTitle: "Null.",
    emptyOrdersBody: "No acquisitions on record. Enter the archive to begin.",
    browseCta: "Enter Archive",
  },
};

export default function CanvasProfilePage({ basePath }: { basePath?: string } = {}) {
  return <AccountCenter basePath={basePath || "/templates/canvas"} defaultTab="profile" theme={theme} />;
}
