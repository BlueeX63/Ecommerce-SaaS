"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PremiumAuthLayout } from "@/components/auth/PremiumAuthLayout";
import { PremiumInput } from "@/components/auth/PremiumInput";
import { PremiumMagneticButton } from "@/components/auth/PremiumMagneticButton";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { auth } from "@/lib/firebase";

import { Suspense } from "react";

function PremiumSignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const slug = params.slug as string;
  const next = searchParams?.get("next") || `/store/${slug}`;

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible'
      });
    }
  }, []);

  const sendOtp = async () => {
    if (!fullName || !phone || !password) {
      setError("Please fill all fields.");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`; // Fallback to +91 if no country code
      const appVerifier = (window as any).recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to send OTP. Please check the phone number.");
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSent) {
      return sendOtp();
    }

    if (!otp || !confirmationResult) {
      setError("Please enter the OTP.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      // Verify OTP
      const result = await confirmationResult.confirm(otp);
      const idToken = await result.user.getIdToken(true);

      const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;

      const res = await fetch("/api/v1/store/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, fullName, phoneNumber: formattedPhone, password, idToken }),
      });
      const data = await res.json();
      
      if (res.ok) {
        router.push(next);
        router.refresh();
      } else {
        setError(data.error || "Failed to sign up.");
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "Invalid OTP.");
      setIsLoading(false);
    }
  };

  return (
    <PremiumAuthLayout
      title="Join Us"
      subtitle="Create an account to track orders and save your details."
      backLink={`/store/${slug}`}
      visualUrl="https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2564&auto=format&fit=crop"
    >
      <div id="recaptcha-container"></div>
      
      {error && (
        <div className="mb-8 p-4 bg-red-500/10 text-red-600 text-sm font-medium border border-red-500/20">
          {error}
        </div>
      )}

      <form onSubmit={handleSignupSubmit} className="flex flex-col gap-8">
        {!otpSent ? (
          <>
            <PremiumInput
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
            />
            <PremiumInput
              label="Phone Number (e.g. +91...)"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
            <PremiumInput
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </>
        ) : (
          <PremiumInput
            label="Enter OTP"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            autoComplete="one-time-code"
          />
        )}
        
        <div className="pt-4">
          <PremiumMagneticButton type="submit" disabled={isLoading} className="w-full bg-black text-white py-5">
            {isLoading ? (otpSent ? "Verifying..." : "Sending OTP...") : (otpSent ? "Verify & Create Account" : "Create Account")}
          </PremiumMagneticButton>
        </div>
        
        <div className="text-center mt-6">
          <Link 
            href={`/store/${slug}/auth/login`} 
            className="text-xs font-bold uppercase tracking-widest text-black/50 hover:text-black transition-colors cursor-pointer"
          >
            Already have an account? <span className="text-black border-b border-black">Sign In</span>
          </Link>
        </div>
      </form>
    </PremiumAuthLayout>
  );
}

export default function PremiumSignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <PremiumSignupContent />
    </Suspense>
  );
}
