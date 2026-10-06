"use client";

import { useState } from "react";
import { Eye, Loader2 } from "lucide-react";

export function ImpersonationBanner({ superAdminEmail }: { superAdminEmail: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleReturn = async () => {
    setIsLoading(true);
    await fetch("/api/v1/auth/logout", { method: "POST" });
    const superAdminUrl = process.env.NEXT_PUBLIC_SUPER_ADMIN_URL || "http://localhost:3001";
    window.location.href = `${superAdminUrl}/tenants`;
  };

  return (
    <div className="flex items-center justify-between gap-4 px-6 py-2.5 bg-primary text-white text-sm">
      <div className="flex items-center gap-2">
        <Eye className="w-4 h-4" />
        <span>
          Viewing as the store owner &middot; signed in by <span className="font-medium">{superAdminEmail}</span>
        </span>
      </div>
      <button
        onClick={handleReturn}
        disabled={isLoading}
        className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-md text-xs font-medium transition-colors disabled:opacity-50 shrink-0"
      >
        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
        Return to Super Admin
      </button>
    </div>
  );
}
