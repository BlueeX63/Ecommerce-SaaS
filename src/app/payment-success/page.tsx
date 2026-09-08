"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 2500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden font-body">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-green-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full relative z-10 flex flex-col items-center text-center"
      >
        <div className="relative mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
            className="w-24 h-24 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full flex items-center justify-center relative z-10"
          >
            <CheckCircle2 className="w-10 h-10" />
          </motion.div>
          <motion.div 
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-green-500/20 rounded-full z-0"
          />
        </div>
        
        <h1 className="font-heading text-4xl md:text-5xl uppercase tracking-tighter text-white mb-4">
          Payment <span className="text-green-500">Secured.</span>
        </h1>
        
        <p className="text-white/50 mb-12 text-lg max-w-[300px] leading-relaxed">
          Your infrastructure is now fully provisioned and ready for deployment.
        </p>

        <div className="flex flex-col items-center gap-3">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full"
          />
          <p className="font-accent text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">
            Navigating to Dashboard...
          </p>
        </div>

        {sessionId && (
          <p className="text-white/20 text-[10px] mt-12 font-mono uppercase tracking-widest">
            TX: {sessionId.slice(0, 16)}...
          </p>
        )}
      </motion.div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
