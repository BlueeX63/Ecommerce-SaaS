"use client";

import { Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FloatingLabelInput } from "@/components/auth/FloatingLabelInput";
import { SubmitButton } from "@/components/auth/Buttons";

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [isChecking, setIsChecking] = useState(true);
  const [inviteInfo, setInviteInfo] = useState<{ email: string; tenantName: string } | null>(null);
  const [inviteError, setInviteError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setIsChecking(false);
      return;
    }
    fetch(`/api/v1/auth/invite-info?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok) setInviteInfo(data);
        else setInviteError(data.error || "This invitation link is invalid or has expired.");
      })
      .catch(() => setInviteError("Something went wrong. Please try again."))
      .finally(() => setIsChecking(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, firstName, lastName, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not accept this invitation. The link may have expired.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-full flex flex-col justify-center"
    >
      {isChecking ? (
        <div className="text-center text-sm text-gray-500">Checking your invitation…</div>
      ) : !token || inviteError || !inviteInfo ? (
        <>
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Invitation Not Found</h2>
          </div>
          <div className="p-4 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
            {inviteError || "This invitation link is invalid."} If you believe this is a mistake, ask the store owner to send you a new invite.
          </div>
        </>
      ) : (
        <>
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Join {inviteInfo.tenantName}</h2>
            <p className="mt-3 text-sm text-gray-500">
              Create your account for <span className="font-medium text-gray-700">{inviteInfo.email}</span> to get started.
            </p>
          </div>

          {error && <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">{error}</div>}

          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="grid grid-cols-2 gap-4">
              <FloatingLabelInput label="First name" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" />
              <FloatingLabelInput label="Last name" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" />
            </div>
            <FloatingLabelInput label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
            <FloatingLabelInput label="Confirm password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
            <SubmitButton isLoading={isLoading} type="submit">
              Accept &amp; Join
            </SubmitButton>
          </form>
        </>
      )}

      <div className="mt-8 text-center">
        <Link href="/login" className="text-[#F04438] hover:text-[#d93b2f] transition-colors text-xs font-medium">
          Back to sign in
        </Link>
      </div>
    </motion.div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AcceptInviteContent />
    </Suspense>
  );
}
