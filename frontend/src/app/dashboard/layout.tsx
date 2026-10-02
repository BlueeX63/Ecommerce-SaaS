import { redirect } from "next/navigation";
import { getMerchantContext } from "@/lib/api";

export default async function RootDashboardLayout({ children }: { children: React.ReactNode }) {
  const context = await getMerchantContext();

  if (!context) {
    redirect("/login");
  }

  // The dashboard is a paid feature: an active subscription is required.
  if (!context.subscriptionActive) {
    redirect("/pricing");
  }

  return <>{children}</>;
}
