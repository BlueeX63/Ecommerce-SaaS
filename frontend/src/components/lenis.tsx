"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

// The dashboard is a data-dense admin app (scrollable tables, sidebars, modals), not a marketing page -
// Lenis's global wheel hijacking fights those nested scroll areas, so it's disabled there entirely.
function isAppRoute(pathname: string | null) {
  return !!pathname && pathname.startsWith("/dashboard");
}

export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (isAppRoute(pathname)) return;

    const lenis = new Lenis({
      lerp: 0.05,
      duration: 1.5,
      smoothWheel: true,
      wheelMultiplier: 1,
    });
    (window as any).lenis = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      (window as any).lenis = undefined;
      lenis.destroy();
    };
  }, [pathname]);

  return null;
}
