"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Lives inside a storefront that is shown in the store editor's preview iframe. It lets the editor drive the
 * preview: jump to the page/section being edited, and scroll to + highlight the exact element for the field the
 * merchant is typing in. It does nothing when the page is not embedded in an iframe.
 *
 * Messages (editor -> preview, same origin only):
 *   MONOLITH_NAVIGATE { path: "/about", scroll?: "top" | "bottom" }
 *   MONOLITH_FOCUS    { text?: string, image?: string }
 * Messages (preview -> editor):
 *   MONOLITH_LOCATION { pathname: string }
 */

const HIGHLIGHT_ATTR = "data-monolith-highlight";
const STYLE_ID = "monolith-preview-style";

/** The part of the URL that identifies this storefront: /templates/<name> in the editor, /store/<slug> for a live store. */
function storefrontRoot(pathname: string): string {
  const m = pathname.match(/^\/(templates|store)\/([^/]+)/);
  return m ? `/${m[1]}/${m[2]}` : "";
}

const normalise = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    [${HIGHLIGHT_ATTR}] { outline: 2px solid #FF4D00 !important; outline-offset: 6px !important; border-radius: 4px; transition: outline-color .3s ease; }
    ::-webkit-scrollbar { display: none !important; } * { -ms-overflow-style: none !important; scrollbar-width: none !important; }
  `;
  document.head.appendChild(style);
}

function clearHighlight() {
  document.querySelectorAll(`[${HIGHLIGHT_ATTR}]`).forEach((el) => el.removeAttribute(HIGHLIGHT_ATTR));
}

/** Smallest element whose visible text contains `needle`. */
function findByText(needle: string): HTMLElement | null {
  // Multi-line copy is rendered across several elements, so look for its first line.
  const firstLine = needle.split(/\r?\n/).find((line) => line.trim()) ?? "";
  const target = normalise(firstLine).slice(0, 80);
  if (target.length < 2) return null;

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || ["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT"].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
      return node.nodeValue && node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });

  let best: HTMLElement | null = null;
  let bestLength = Infinity;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = normalise(node.nodeValue ?? "");
    if (text.includes(target) || (text.length >= 4 && target.startsWith(text))) {
      const el = node.parentElement as HTMLElement;
      if (text.length < bestLength) {
        best = el;
        bestLength = text.length;
      }
    }
  }
  return best;
}

function findByImage(src: string): HTMLElement | null {
  if (!src) return null;
  const tail = src.startsWith("data:") ? src : src.split("?")[0];
  for (const img of Array.from(document.images)) {
    if (img.src === src || img.currentSrc === src || (!src.startsWith("data:") && (img.src.split("?")[0] === tail || img.currentSrc.split("?")[0] === tail))) return img;
  }
  for (const el of Array.from(document.querySelectorAll<HTMLElement>("[style*='background']"))) {
    if (el.style.backgroundImage.includes(tail)) return el;
  }
  return null;
}

let highlightTimer: ReturnType<typeof setTimeout> | undefined;

type LenisLike = { scrollTo: (target: HTMLElement | number, options?: { offset?: number; duration?: number }) => void };
const lenisOf = () => (window as unknown as { lenis?: LenisLike }).lenis;

function focusElement(el: HTMLElement) {
  clearHighlight();
  el.setAttribute(HIGHLIGHT_ATTR, "");
  const lenis = lenisOf();
  if (lenis) {
    // The storefront uses Lenis smooth scrolling; drive it so the two never fight.
    lenis.scrollTo(el, { offset: -(window.innerHeight / 2 - el.getBoundingClientRect().height / 2), duration: 0.9 });
  } else {
    el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  }
  clearTimeout(highlightTimer);
  highlightTimer = setTimeout(clearHighlight, 3200);
}

function scrollTo(where: "top" | "bottom" | undefined) {
  const lenis = lenisOf();
  if (where === "bottom") {
    if (lenis) lenis.scrollTo(document.documentElement.scrollHeight, { duration: 0.9 });
    else {
      const footer = document.querySelector("footer");
      if (footer) footer.scrollIntoView({ behavior: "smooth", block: "end" });
      else window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
    }
  } else if (lenis) {
    lenis.scrollTo(0, { duration: 0.9 });
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

export function PreviewBridge() {
  const router = useRouter();
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  const pending = useRef<{ scroll?: "top" | "bottom"; focus?: { text?: string; image?: string } } | null>(null);
  const embedded = typeof window !== "undefined" && window.parent !== window;

  // Tell the editor where the preview currently is, and run whatever was queued for this page.
  useEffect(() => {
    pathRef.current = pathname;
    if (!embedded) return;
    ensureStyle();
    window.parent.postMessage({ type: "MONOLITH_LOCATION", pathname }, window.location.origin);

    const job = pending.current;
    if (!job) return;
    pending.current = null;
    // The new page needs a moment to render (and for its content to arrive from the editor).
    let attempts = 0;
    const run = () => {
      attempts += 1;
      if (job.focus) {
        const el = (job.focus.image ? findByImage(job.focus.image) : null) ?? (job.focus.text ? findByText(job.focus.text) : null);
        if (el) return focusElement(el);
      }
      if (job.scroll !== undefined || !job.focus) return scrollTo(job.scroll);
      if (attempts < 8) setTimeout(run, 250);
    };
    setTimeout(run, 350);
  }, [pathname, embedded]);

  useEffect(() => {
    if (!embedded) return;
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "MONOLITH_NAVIGATE" && typeof data.path === "string") {
        const root = storefrontRoot(pathRef.current);
        if (!root) return;
        const target = data.path === "/" ? root : `${root}${data.path.startsWith("/") ? data.path : `/${data.path}`}`;
        const scroll = data.scroll === "bottom" ? "bottom" : "top";
        if (pathRef.current.replace(/\/$/, "") === target) {
          scrollTo(scroll);
        } else {
          pending.current = { scroll };
          router.push(target);
        }
      }

      if (data.type === "MONOLITH_FOCUS") {
        const image = typeof data.image === "string" ? data.image : undefined;
        const text = typeof data.text === "string" ? data.text : undefined;
        const el = (image ? findByImage(image) : null) ?? (text ? findByText(text) : null);
        if (el) focusElement(el);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [embedded, router]);

  return null;
}
