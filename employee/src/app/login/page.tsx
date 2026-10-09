"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Warehouse } from "lucide-react";

export default function EmployeeLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/v1/employee/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Invalid email or password");
        setBusy(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setBusy(false);
    }
  };

  const field = "w-full px-4 py-3 bg-background border border-black/[0.08] rounded-xl text-sm text-primary focus:outline-none focus:border-accent/40 focus:ring-4 focus:ring-accent/5 transition-all";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-[480px] h-[480px] rounded-full bg-accent/10 blur-[120px] pointer-events-none" />
      <div className="w-full max-w-sm relative">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-accent text-white flex items-center justify-center mb-5 shadow-lg shadow-accent/20">
            <Warehouse className="w-6 h-6" />
          </div>
          <h1 className="font-heading text-3xl text-primary tracking-tight">Warehouse Panel</h1>
          <p className="text-sm text-secondary mt-2">Sign in with the details your store owner gave you.</p>
        </div>

        <form onSubmit={submit} className="bg-surface border border-black/[0.04] rounded-2xl p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-medium text-secondary uppercase tracking-wide">Email</label>
            <input id="email" required type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-medium text-secondary uppercase tracking-wide">Password</label>
            <input id="password" required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-xl text-sm font-medium hover:bg-black/90 transition-colors disabled:opacity-50">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            Sign in
          </button>
        </form>

        <p className="text-xs text-secondary text-center mt-6">Forgot your password? Ask your store owner to set a new one.</p>
      </div>
    </div>
  );
}
