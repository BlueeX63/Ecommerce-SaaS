"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { FloatingLabelInput } from "@/components/auth/FloatingLabelInput";
import { SubmitButton } from "@/components/auth/Buttons";
import Link from "next/link";

export default function SetPasswordPage() {
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string; password?: string; confirmPassword?: string; general?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    if (!firstName || firstName.length < 2) {
      setErrors(prev => ({ ...prev, firstName: "First name must be at least 2 characters" }));
      return;
    }

    if (!lastName || lastName.length < 2) {
      setErrors(prev => ({ ...prev, lastName: "Last name must be at least 2 characters" }));
      return;
    }
    
    if (password.length < 8) {
      setErrors(prev => ({ ...prev, password: "Password must be at least 8 characters" }));
      return;
    }
    
    if (!/[A-Z]/.test(password)) {
      setErrors(prev => ({ ...prev, password: "Password must contain at least one uppercase letter" }));
      return;
    }
    
    if (!/[0-9]/.test(password)) {
      setErrors(prev => ({ ...prev, password: "Password must contain at least one number" }));
      return;
    }

    if (password !== confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }));
      return;
    }

    setIsLoading(true);
    
    try {
      const res = await fetch("/api/v1/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, firstName, lastName })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setErrors({ general: data.error || "Failed to set password." });
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      setErrors({ general: "An error occurred." });
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
          Complete Your Profile
        </h2>
        <p className="mt-3 text-sm text-gray-500 max-w-sm mx-auto">
          You signed in with Google! Please complete your profile and set a password so you can also log in with your email in the future.
        </p>
      </div>

      {errors.general && (
        <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-1">
        <div className="flex gap-4">
          <div className="w-1/2">
            <FloatingLabelInput
              label="First Name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              error={errors.firstName}
              autoComplete="given-name"
            />
          </div>
          <div className="w-1/2">
            <FloatingLabelInput
              label="Last Name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              error={errors.lastName}
              autoComplete="family-name"
            />
          </div>
        </div>

        <FloatingLabelInput
          label="New Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="new-password"
        />
        
        <FloatingLabelInput
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />
        
        <div className="mt-6 flex flex-col gap-4">
          <SubmitButton isLoading={isLoading} type="submit">
            Complete Profile
          </SubmitButton>
        </div>
      </form>
    </motion.div>
  );
}
