"use client";

import { useEffect, useRef } from "react";

/**
 * Slim banner pinned to the top of a storefront. It publishes its height as the CSS variable --announce-h and
 * pads the body by the same amount, so fixed/sticky headers (which use `top-[var(--announce-h,0px)]`) and page
 * content sit below it. Renders nothing - and releases the space - when `text` is empty.
 */
export function AnnouncementBar({ text, className = "bg-black text-white" }: { text?: string | null; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = !!text && text.trim() !== "";

  useEffect(() => {
    const root = document.documentElement;
    const release = () => {
      root.style.removeProperty("--announce-h");
      document.body.style.removeProperty("padding-top");
    };
    if (!visible || !ref.current) {
      release();
      return;
    }
    const el = ref.current;
    const apply = () => {
      const h = el.offsetHeight;
      root.style.setProperty("--announce-h", `${h}px`);
      document.body.style.paddingTop = `${h}px`;
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    return () => {
      observer.disconnect();
      release();
    };
  }, [visible, text]);

  if (!visible) return null;
  return (
    <div ref={ref} role="region" aria-label="Announcement" className={`fixed inset-x-0 top-0 z-[60] px-4 py-2 text-center text-[10px] font-medium uppercase tracking-widest sm:text-xs ${className}`}>
      {text}
    </div>
  );
}
