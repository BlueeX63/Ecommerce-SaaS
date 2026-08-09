"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PremiumAuthLayout } from "@/components/auth/PremiumAuthLayout";
import { PremiumInput } from "@/components/auth/PremiumInput";
import { PremiumMagneticButton } from "@/components/auth/PremiumMagneticButton";

import { Suspense } from "react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = `/templates/essence`;

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      setError("Please enter phone and password.");
      return;
    }
    setError("");
    setIsLoading(true);

    
    // MOCK LOGIN FOR TEMPLATES
    setTimeout(() => {
      localStorage.setItem('mock_template_logged_in', 'true');
      router.push(next);
    }, 800);
    
  };

  return (
    <PremiumAuthLayout
      title="Welcome Back"
      subtitle="Enter your credentials to access your account."
      backLink={`/templates/essence`}
      visualUrl="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"
    >
      {error && (
        <div className="mb-8 p-4 bg-red-500/10 text-red-600 text-sm font-medium border border-red-500/20">
          {error}
        </div>
      )}

      <form onSubmit={handleLoginSubmit} className="flex flex-col gap-8">
        <PremiumInput
          label="Phone Number"
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
            {isLoading ? "Authenticating..." : "Sign In"}
          </PremiumMagneticButton>
        </div>
        
        <div className="text-center mt-6">
          <Link 
            href={`/templates/essence/auth/signup`} 
            className="text-xs font-bold uppercase tracking-widest text-black/50 hover:text-black transition-colors cursor-pointer"
          >
            Don't have an account? <span className="text-black border-b border-black">Create One</span>
          </Link>
        </div>
      </form>
    </PremiumAuthLayout>
  );
}

export default function PremiumLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
