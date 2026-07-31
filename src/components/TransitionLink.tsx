"use client";

import { useRouter } from "next/navigation";
import { usePageTransition } from "./TransitionProvider";

export function TransitionLink({ 
  href, 
  children, 
  className,
  text,
  onClick
}: { 
  href: string; 
  children?: React.ReactNode; 
  className?: string;
  text?: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const router = useRouter();
  const { startTransition } = usePageTransition();

  const handleClick = (e: React.MouseEvent) => {
    // Check if it's an anchor link for smooth scrolling on the same page
    if (href.startsWith("#") || (href.startsWith("/#") && typeof window !== "undefined" && window.location.pathname === "/")) {
      if (onClick) onClick(e);
      return; 
    }
    
    e.preventDefault();
    if (onClick) onClick(e);
    
    // User requested to ALWAYS show "Monolith" during transition
    startTransition("Monolith");
    
    setTimeout(() => {
      router.push(href);
    }, 1000); 
  };

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
