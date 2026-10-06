"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";

/**
 * Landing page for a Super Admin "sign in as owner" handoff. The Super Admin app runs on a separate
 * origin and can never set a cookie here directly, so it redirects the browser to this page with a
 * short-lived, single-use ticket in the URL; this page's own fetch (same-origin to this app) exchanges
 * it for a real session, so the resulting cookie lands correctly on THIS origin.
 */
function ImpersonateRedeemContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ticket = searchParams?.get("ticket");
    if (!ticket) {
      setError("Missing sign-in link.");
      return;
    }
    fetch("/api/v1/super-admin/impersonate/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticket }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error || "This sign-in link is invalid or has expired.");
          return;
        }
        router.replace("/dashboard");
      })
      .catch(() => setError("Something went wrong. Please try again."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="flex flex-col items-center text-center max-w-sm">
        {error ? (
          <>
            <ShieldAlert className="w-6 h-6 text-red-500 mb-3" />
            <p className="text-sm text-primary font-medium mb-1">Could not sign in</p>
            <p className="text-sm text-secondary">{error}</p>
          </>
        ) : (
          <>
            <Loader2 className="w-5 h-5 animate-spin text-secondary mb-3" />
            <p className="text-sm text-secondary">Signing you in...</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function ImpersonateRedeemPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ImpersonateRedeemContent />
    </Suspense>
  );
}
