"use client";

import { Suspense, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FloatingLabelInput } from "@/components/auth/FloatingLabelInput";
import { SubmitButton } from "@/components/auth/Buttons";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Could not reset your password. The link may have expired.");
      } else {
        setDone(true);
        setTimeout(() => router.push("/login"), 2000);
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
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Choose a new password</h2>
        <p className="mt-3 text-sm text-gray-500">
          At least 8 characters with an uppercase letter, a lowercase letter, a number and a special character.
        </p>
      </div>

      {!token ? (
        <div className="p-4 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
          This reset link is invalid. Please{" "}
          <Link href="/forgot-password" className="underline">
            request a new one
          </Link>
          .
        </div>
      ) : done ? (
        <div className="p-4 bg-green-50 text-green-700 text-sm rounded-md border border-green-100">
          Your password has been reset. Redirecting you to sign in…
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col">
            <FloatingLabelInput
              label="New password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            <FloatingLabelInput
              label="Confirm new password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
            <SubmitButton isLoading={isLoading} type="submit">
              Reset password
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
