import { redirect } from "next/navigation";
import { getSuperAdminSession } from "@/lib/api";
import { SuperAdminShell } from "@/components/SuperAdminShell";

export default async function SuperAdminAppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSuperAdminSession();

  if (!session?.isLoggedIn) {
    redirect("/login");
  }

  return <SuperAdminShell email={session.email ?? ""}>{children}</SuperAdminShell>;
}
