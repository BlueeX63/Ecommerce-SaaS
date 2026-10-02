"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { PlanConfigurator } from "@/components/pricing/PlanConfigurator";

export default function ConfigurePlanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#FF4D00] animate-spin" />
        </div>
      }
    >
      <PlanConfigurator />
    </Suspense>
  );
}
