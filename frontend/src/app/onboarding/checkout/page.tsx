"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * This step was replaced by the plan configurator (`/onboarding/configure`), which asks which pack and
 * add-ons to buy before handing off to real Stripe checkout. Kept as a redirect so old links/bookmarks
 * still land somewhere useful.
 */
export default function OnboardingCheckoutRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/onboarding/configure");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#FF4D00] animate-spin" />
    </div>
  );
}
