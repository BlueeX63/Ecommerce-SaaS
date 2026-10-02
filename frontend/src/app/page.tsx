import { cookies } from "next/headers";
import { getMerchantContext } from "@/lib/api";
import LandingPageClient from "./LandingPageClient";

export default async function Page() {
  const context = await getMerchantContext();

  const cookieStore = await cookies();
  const needsNameSetup = cookieStore.get("needs_name_setup")?.value === "true";

  const user = context
    ? { first_name: context.user.first_name, last_name: context.user.last_name, email: context.user.email }
    : null;

  return (
    <LandingPageClient
      initialIsLoggedIn={!!context}
      initialHasStore={!!context?.hasStore}
      user={user}
      needsNameSetup={needsNameSetup}
    />
  );
}
