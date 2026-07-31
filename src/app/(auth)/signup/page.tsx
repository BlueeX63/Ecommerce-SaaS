"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FloatingLabelInput } from "@/components/auth/FloatingLabelInput";
import { SubmitButton, GoogleButton } from "@/components/auth/Buttons";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; general?: string }>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    let hasError = false;
    const newErrors: any = {};

    if (!name || name.length < 2) {
      newErrors.name = "Please enter your full name";
      hasError = true;
    }
    if (!email || !email.includes("@")) {
      newErrors.email = "Please enter a valid email address";
      hasError = true;
    }
    if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
        emailRedirectTo: `${location.origin}/api/auth/callback`,
      },
    });

    setIsLoading(false);

    if (error) {
      setErrors({ general: error.message });
      return;
    }

    if (data?.user?.identities?.length === 0) {
      setErrors({ general: "User already exists. Please log in." });
      return;
    }

    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full flex flex-col justify-center items-center text-center space-y-6"
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Check your email</h2>
        <p className="text-gray-500">We've sent a verification link to <span className="font-medium text-gray-900">{email}</span>.</p>
        <p className="text-sm text-gray-400">Please verify your email to complete registration.</p>
        <Link href="/login" className="mt-8 text-[#F04438] hover:text-[#d93b2f] font-medium transition-colors">
          Return to login
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-full flex flex-col justify-center"
    >
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
          Sign Up
        </h2>
      </div>

      {errors.general && (
        <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col">
        <FloatingLabelInput
          label="Full Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          autoComplete="name"
        />

        <FloatingLabelInput
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
        />
        
        <FloatingLabelInput
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="new-password"
        />

        <div className="flex items-center justify-center gap-4 mb-6 mt-2">
          <div className="h-[1px] w-12 bg-gray-200"></div>
          <span className="text-xs text-gray-400 font-medium">or</span>
          <div className="h-[1px] w-12 bg-gray-200"></div>
        </div>

        <GoogleButton />

        <SubmitButton isLoading={isLoading} type="submit">
          Sign Up
        </SubmitButton>
      </form>

      <div className="mt-8 text-center">
        <p className="text-gray-500 font-medium text-xs">
          Already have an account?{" "}
          <Link href="/login" className="text-[#F04438] hover:text-[#d93b2f] transition-colors ml-1">
            Login
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
