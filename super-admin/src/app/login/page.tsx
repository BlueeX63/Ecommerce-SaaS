"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/super-admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Invalid credentials");
        setIsLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-11 h-11 rounded-lg bg-primary text-white flex items-center justify-center mb-4">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h1 className="font-heading text-2xl text-primary">Super Admin</h1>
          <p className="text-sm text-secondary mt-1">Platform operator sign-in</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface border border-black/10 rounded-lg p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-secondary uppercase tracking-wide">Email</label>
            <input
              required
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-black/10 rounded-md text-sm text-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-secondary uppercase tracking-wide">Password</label>
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-black/10 rounded-md text-sm text-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Sign in
          </button>
        </form>

        <p className="text-xs text-secondary text-center mt-6">Restricted access. All sign-ins are logged.</p>
      </div>
    </div>
  );
}
