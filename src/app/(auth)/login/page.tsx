"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FloatingLabelInput } from "@/components/auth/FloatingLabelInput";
import { SubmitButton, GoogleButton } from "@/components/auth/Buttons";
import { createClient } from "@/lib/supabase/client";

import { Suspense } from "react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';
  
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    if (!email || !email.includes("@")) {
      setErrors(prev => ({ ...prev, email: "Please enter a valid email address" }));
      return;
    }
    if (password.length < 8) {
      setErrors(prev => ({ ...prev, password: "Password must be at least 8 characters" }));
      return;
    }

    setIsLoading(true);
    
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setErrors({ general: data.error || "Invalid login credentials." });
      } else {
        router.push(next);
        router.refresh();
      }
    } catch (error) {
      setErrors({ general: "An error occurred during login." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-full flex flex-col justify-center"
    >
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
          Sign In
        </h2>
      </div>

      {errors.general && (
        <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col">
        <FloatingLabelInput
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
        />
        
        <div className="relative">
          <FloatingLabelInput
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete="current-password"
          />
        </div>
        
        <div className="flex justify-end mb-6 -mt-2">
          <Link href="/forgot-password" className="text-xs text-[#F04438] hover:text-[#d93b2f] font-medium transition-colors">
            Forgot password ?
          </Link>
        </div>

        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="h-[1px] w-12 bg-gray-200"></div>
          <span className="text-xs text-gray-400 font-medium">or</span>
          <div className="h-[1px] w-12 bg-gray-200"></div>
        </div>

        <GoogleButton />

        <SubmitButton isLoading={isLoading} type="submit">
          Login
        </SubmitButton>
      </form>

      <div className="mt-8 text-center">
        <p className="text-gray-500 font-medium text-xs">
          Don't have an account?{" "}
          <Link href="/signup" className="text-[#F04438] hover:text-[#d93b2f] transition-colors ml-1">
            Sign up
          </Link>
        </p>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
