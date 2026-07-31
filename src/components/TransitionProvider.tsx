"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState, createContext, useContext } from "react";

type TransitionContextType = {
  startTransition: (text: string) => void;
};

export const TransitionContext = createContext<TransitionContextType>({
  startTransition: () => { },
});

export function usePageTransition() {
  return useContext(TransitionContext);
}

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [text, setText] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => {
        setIsActive(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  const startTransition = (newText: string) => {
    setText(newText);
    setIsActive(true);
  };

  return (
    <TransitionContext.Provider value={{ startTransition }}>
      <div className="fixed inset-0 z-[100] flex pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: "-100%" }}
            animate={{ y: isActive ? "0%" : "-100%" }}
            transition={{
              duration: 0.6,
              delay: isActive ? 0.06 * i : 0.06 * (7 - i),
              ease: [0.76, 0, 0.24, 1],
            }}
            className="flex-1 h-screen bg-[#FF4D00] border-r border-white/10 relative flex items-center justify-center z-10"
          >
            {text[i] && (
              <span className="font-heading text-4xl md:text-6xl text-black uppercase tracking-tighter absolute">
                {text[i]}
              </span>
            )}
          </motion.div>
        ))}
      </div>

      {children}
    </TransitionContext.Provider>
  );
}
