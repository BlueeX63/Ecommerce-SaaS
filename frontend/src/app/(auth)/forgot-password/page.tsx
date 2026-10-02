"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { FloatingLabelInput } from "@/components/auth/FloatingLabelInput";
import { SubmitButton } from "@/components/auth/Buttons";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.status === 429) {
        setError("Too many requests. Please try again later.");
      } else if (!res.ok) {
        setError("Something went wrong. Please try again.");
      } else {
        setSent(true);
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
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Reset Password</h2>
        <p className="mt-3 text-sm text-gray-500">
          Enter your account email and we&apos;ll send you a link to choose a new password.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">{error}</div>
      )}

      {sent ? (
        <div className="p-4 bg-green-50 text-green-700 text-sm rounded-md border border-green-100">
          If an account exists for <strong>{email}</strong>, a password reset link is on its way. The link can be used
          once and expires in 1 hour.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col">
          <FloatingLabelInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <SubmitButton isLoading={isLoading} type="submit">
            Send reset link
          </SubmitButton>
        </form>
      )}

      <div className="mt-8 text-center">
        <Link href="/login" className="text-[#F04438] hover:text-[#d93b2f] transition-colors text-xs font-medium">
          Back to sign in
        </Link>
      </div>
    </motion.div>
  );
}
