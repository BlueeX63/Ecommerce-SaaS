"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
const steps = [
  { id: "brand_name", title: "What is the name of your brand?" },
  { id: "brand_tagline", title: "Describe your brand in one short sentence." },
  { id: "industry", title: "What industry are you in?" },
  { id: "completion", title: "Crafting your store..." }
];

export function OnboardingFlow() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState({ brandName: "", tagline: "", industry: "" });
  const [isBuilding, setIsBuilding] = useState(false);
  const router = useRouter();

  const handleNext = async () => {
    if (currentStepIndex === steps.length - 2) {
      // Move to completion step
      setCurrentStepIndex(currentStepIndex + 1);
      setIsBuilding(true);

      try {
        const response = await fetch('/api/v1/tenant/provision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            templateId: 'starter-minimalist', // Or fetch from query/localstorage
            formData: {
              brandName: formData.brandName,
              tagline: formData.tagline,
              industry: formData.industry,
            }
          })
        });

        if (!response.ok) {
          console.error("Failed to provision store");
        }

        // Wait for the cinematic wipe animation to mostly finish before redirecting
        setTimeout(() => {
          router.push("/dashboard");
        }, 4000);
      } catch (error) {
        console.error("Error provisioning store:", error);
        setTimeout(() => {
          router.push("/dashboard");
        }, 4000);
      }
    } else {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0 && !isBuilding) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const progress = ((currentStepIndex + 1) / (steps.length - 1)) * 100;

  if (isBuilding) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-surface relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center z-10"
        >
          <h1 className="font-heading text-5xl text-primary mb-8">We are crafting your store...</h1>
          
          <div className="space-y-4 max-w-sm mx-auto text-left">
            {["Provisioning server...", "Applying brand colors...", "Generating Awwwards-level template...", "Finalizing setup..."].map((stepText, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.8 + 0.5, duration: 0.5 }}
                className="flex items-center gap-3 font-body text-secondary"
              >
                <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center">
                  <Check className="w-3 h-3 text-accent" />
                </div>
                {stepText}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Cinematic Curtain Wipe */}
        <motion.div 
          className="absolute inset-0 bg-accent z-50 pointer-events-none"
          initial={{ clipPath: 'inset(100% 0 0 0)' }}
          animate={{ clipPath: ['inset(100% 0 0 0)', 'inset(0% 0 0 0)', 'inset(0 0 100% 0)'] }}
          transition={{ duration: 1.5, times: [0, 0.5, 1], delay: 3.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-surface flex flex-col relative overflow-hidden">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-black/5 z-50">
        <motion.div 
          className="h-full bg-accent"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {/* Header (Step Number) */}
      <div className="absolute top-12 left-12">
        <span className="font-accent text-accent text-2xl font-bold tracking-tighter">
          0{currentStepIndex + 1}
        </span>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center items-center px-6">
        <div className="w-full max-w-2xl relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepIndex}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              <h2 className="font-heading text-4xl md:text-5xl text-primary mb-8 leading-tight">
                {steps[currentStepIndex].title}
              </h2>

              {currentStepIndex === 0 && (
                <input
                  type="text"
                  placeholder="e.g. Acme Corp"
                  className="w-full text-3xl font-heading text-primary bg-transparent border-b-2 border-black/10 focus:border-accent focus:outline-none py-4 transition-colors placeholder:text-black/20"
                  value={formData.brandName}
                  onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && formData.brandName && handleNext()}
                  autoFocus
                />
              )}

              {currentStepIndex === 1 && (
                <textarea
                  placeholder="We make the best widgets in the world."
                  className="w-full text-2xl font-body text-primary bg-transparent border-b-2 border-black/10 focus:border-accent focus:outline-none py-4 transition-colors placeholder:text-black/20 resize-none h-32"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && formData.tagline && handleNext()}
                  autoFocus
                />
              )}

              {currentStepIndex === 2 && (
                <div className="flex flex-wrap gap-3">
                  {["Fashion", "Electronics", "Beauty", "Home Goods", "Digital Products", "Food & Beverage", "Other"].map((ind) => (
                    <button
                      key={ind}
                      onClick={() => {
                        setFormData({ ...formData, industry: ind });
                        setTimeout(handleNext, 300);
                      }}
                      className={cn(
                        "px-6 py-3 rounded-full font-body text-sm font-medium transition-all border",
                        formData.industry === ind 
                          ? "border-accent bg-accent/5 text-accent shadow-[0_0_0_1px_rgba(255,77,0,1)]" 
                          : "border-black/10 text-secondary hover:border-black/30 hover:text-primary"
                      )}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 w-full p-8 md:p-12 flex justify-between items-center z-40 bg-gradient-to-t from-surface via-surface to-transparent">
        <button 
          onClick={handleBack}
          className={cn(
            "font-accent text-sm font-medium tracking-wide transition-colors",
            currentStepIndex === 0 ? "opacity-0 pointer-events-none" : "text-secondary hover:text-primary"
          )}
        >
          Back
        </button>
        
        <button 
          onClick={handleNext}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-accent text-sm font-medium hover:bg-accent transition-colors hover:shadow-lg hover:-translate-y-0.5 active:scale-95 group"
        >
          Next Step 
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
