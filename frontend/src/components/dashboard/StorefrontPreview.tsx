"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Monitor, Smartphone, X } from "lucide-react";

export interface PreviewTarget {
  path: string;
  scroll?: "top" | "bottom";
}

/** Ask the preview to scroll to and highlight an element. A new object each time, even for the same field. */
export interface FocusRequest {
  image?: string;
  text?: string;
}

/**
 * The live storefront in an iframe, driven by the same editor <-> preview messages as the onboarding editor:
 * it receives the in-progress content as it is typed, jumps to the page being edited when the merchant changes tab,
 * and scrolls to + highlights the element of the field they are working on. It owns its own loading state, so
 * mounting it (docked beside the form, or as an overlay on small screens) always starts from a clean slate.
 */
export function StorefrontPreview({
  storeCode,
  formData,
  tabLabel,
  target,
  focus,
  onClose,
  className = "",
}: {
  storeCode: string;
  formData: Record<string, string>;
  tabLabel?: string;
  target?: PreviewTarget;
  focus: FocusRequest | null;
  onClose?: () => void;
  className?: string;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [location, setLocation] = useState("/");

  const greeted = useRef(false);
  const targetRef = useRef(target);
  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  const post = useCallback((message: Record<string, unknown>) => {
    frame.current?.contentWindow?.postMessage(message, window.location.origin);
  }, []);

  // Content: sent whenever it changes, and whenever a page inside the preview asks for it (after it navigates).
  useEffect(() => {
    const push = () => post({ type: "MONOLITH_CUSTOMIZATION", data: { formData, step: tabLabel } });
    if (ready) push();
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      if (event.data?.type === "MONOLITH_REQUEST_STATE") push();
      if (event.data?.type === "MONOLITH_LOCATION" && typeof event.data.pathname === "string") {
        const m = event.data.pathname.match(/^\/store\/[^/]+(\/.*)?$/);
        setLocation(m ? m[1] || "/" : event.data.pathname);
        // The page inside the preview is now listening: this is the moment a "go to this page" request can't be lost.
        if (!greeted.current) {
          greeted.current = true;
          const t = targetRef.current;
          if (t) post({ type: "MONOLITH_NAVIGATE", path: t.path, scroll: t.scroll });
        }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [ready, formData, tabLabel, post]);

  // Navigation: show the page the merchant is editing.
  useEffect(() => {
    if (ready && target) post({ type: "MONOLITH_NAVIGATE", path: target.path, scroll: target.scroll });
  }, [ready, target?.path, target?.scroll, post]); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus: highlight the exact element for the field being edited.
  useEffect(() => {
    if (ready && focus) post({ type: "MONOLITH_FOCUS", ...focus });
  }, [ready, focus, post]);

  return (
    <aside className={`flex min-h-0 flex-col overflow-hidden bg-[#111] ${className}`} aria-label="Live preview">
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-white/10 px-4 text-white">
        <span className="text-sm font-medium">Live preview</span>
        <span className="min-w-0 truncate text-xs text-white/45">
          {tabLabel}
          {location !== "/" ? ` · ${location}` : ""}
        </span>
        <div className="ml-auto flex items-center gap-1 rounded-lg bg-black/40 p-1" role="group" aria-label="Preview size">
          <button type="button" onClick={() => setDevice("desktop")} aria-pressed={device === "desktop"} className={`rounded-md p-1.5 ${device === "desktop" ? "bg-white/15" : "text-white/50 hover:text-white"}`}>
            <Monitor className="h-3.5 w-3.5" />
            <span className="sr-only">Desktop</span>
          </button>
          <button type="button" onClick={() => setDevice("mobile")} aria-pressed={device === "mobile"} className={`rounded-md p-1.5 ${device === "mobile" ? "bg-white/15" : "text-white/50 hover:text-white"}`}>
            <Smartphone className="h-3.5 w-3.5" />
            <span className="sr-only">Mobile</span>
          </button>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Hide preview">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="relative flex min-h-0 flex-1 justify-center bg-[#1a1a1a]">
        {!ready && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#111]">
            <Loader2 className="h-6 w-6 animate-spin text-white/40" />
          </div>
        )}
        <iframe
          ref={frame}
          src={`/store/${encodeURIComponent(storeCode)}`}
          title="Storefront preview"
          className={`h-full border-none bg-white transition-all duration-300 ${device === "mobile" ? "w-[390px] max-w-full" : "w-full"}`}
          onLoad={() => setReady(true)}
        />
      </div>
    </aside>
  );
}
