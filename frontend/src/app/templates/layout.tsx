"use client";

import Link from "next/link";
import { ArrowLeft, Edit2 } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

import { Suspense } from "react";

function PreviewModeButton() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isPreviewMode = searchParams?.get("mode") === "preview";

  if (!isPreviewMode || pathname !== "/templates") return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.5 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-4 bg-[#0A0A0A]/80 backdrop-blur-xl p-2 rounded-full border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
    >
      <Link 
        href="/onboarding/template-selection" 
        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-full transition-all text-sm font-medium tracking-wide"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Selection
      </Link>
    </motion.div>
  );
}

export default function TemplatesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full h-full">
      {children}
      <Suspense fallback={null}>
        <PreviewModeButton />
      </Suspense>
    </div>
  );
}
