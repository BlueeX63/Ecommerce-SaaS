"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { PremiumAuthLayout } from "./PremiumAuthLayout";
import { PremiumInput } from "./PremiumInput";
import { PremiumMagneticButton } from "./PremiumMagneticButton";

export function FirebasePhoneSignup({
  title,
  subtitle,
  backLink,
  visualUrl,
  loginLink,
  slug,
}: {
  title: string;
  subtitle: string;
  backLink: string;
  visualUrl: string;
  loginLink: string;
  slug: string;
}) {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    // Initialize reCAPTCHA when component mounts
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
      });
    }
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !password) {
      setError("Please fill all fields.");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      const appVerifier = (window as any).recaptchaVerifier;
      // Format phone if necessary, Firebase requires E.164 format (+1234567890)
      let formattedPhone = phone;
      if (!formattedPhone.startsWith('+')) {
        // Assume US if no country code provided for demo, ideally we validate this
        formattedPhone = `+1${formattedPhone.replace(/\D/g, '')}`; 
      }
      
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setIsOtpSent(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to send OTP. Is your number in E.164 format (e.g., +1...)?");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !confirmationResult) return;
    setError("");
    setIsLoading(true);

    try {
      const result = await confirmationResult.confirm(otp);
      const idToken = await result.user.getIdToken();

      // Send to our backend to create customer and session
      const res = await fetch('/api/v1/store/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, idToken, fullName, password, phoneNumber: result.user.phoneNumber })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to verify account");

      router.push(`/${slug}`); // Navigate to store home
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Invalid code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PremiumAuthLayout
      title={title}
      subtitle={subtitle}
      backLink={backLink}
      visualUrl={visualUrl}
    >
      <div id="recaptcha-container"></div>
      
      {error && (
        <div className="mb-8 p-4 bg-red-500/10 text-red-600 text-sm font-medium border border-red-500/20">
          {error}
        </div>
      )}

      {!isOtpSent ? (
        <form onSubmit={handleSendOtp} className="flex flex-col gap-8">
          <PremiumInput
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
          />
          <PremiumInput
            label="Phone Number (Include Country Code, e.g. +1)"
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
          
          <div className="pt-4">
            <PremiumMagneticButton type="submit" disabled={isLoading} className="w-full bg-black text-white py-5">
              {isLoading ? "Sending OTP..." : "Continue"}
            </PremiumMagneticButton>
          </div>
          
          <div className="text-center mt-6">
            <Link 
              href={loginLink}
              className="text-xs font-bold uppercase tracking-widest text-black/50 hover:text-black transition-colors cursor-pointer"
            >
              Already have an account? <span className="text-black border-b border-black">Sign In</span>
            </Link>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-8">
          <p className="text-sm text-black/60">
            We've sent a 6-digit code to {phone}. Please enter it below.
          </p>
          <PremiumInput
            label="6-Digit OTP"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            autoComplete="one-time-code"
          />
          
          <div className="pt-4">
            <PremiumMagneticButton type="submit" disabled={isLoading} className="w-full bg-black text-white py-5">
              {isLoading ? "Verifying..." : "Verify & Create Account"}
            </PremiumMagneticButton>
          </div>
        </form>
      )}
    </PremiumAuthLayout>
  );
}
