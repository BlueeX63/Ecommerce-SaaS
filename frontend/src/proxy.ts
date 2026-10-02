import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: [
    /*
     * Run on page requests only. Skipped on purpose:
     * - /api/*        proxied straight to the Node.js backend by the rewrites in next.config.ts, so request
     *                 bodies (e.g. file uploads, Stripe webhooks) are never buffered or touched here
     * - /_next/*      framework assets
     * - anything with a file extension (images, fonts, 3D models, favicon, ...)
     */
    "/((?!api/|_next/|.*\\..*).*)",
  ],
};

const SESSION_COOKIE = "session";
const IPV4_HOST = /^\d{1,3}(\.\d{1,3}){3}(:\d+)?$/;
const LOCALHOST_SUFFIX = /(?:^|\.)(localhost(?::\d+)?)$/;

/** The SaaS site's own domain. In development this follows whatever localhost port is being used. */
function resolveBaseDomain(hostname: string): string {
  if (process.env.NEXT_PUBLIC_ROOT_DOMAIN) return process.env.NEXT_PUBLIC_ROOT_DOMAIN.toLowerCase();
  const local = hostname.match(LOCALHOST_SUFFIX);
  if (local) return local[1]; // "localhost:3000" for both "localhost:3000" and "shop.localhost:3000"
  if (IPV4_HOST.test(hostname)) return hostname;
  return "your-saas.com";
}

/**
 * Host-based multi-tenancy.
 *
 *  - <slug>.<root-domain>  -> storefront of the store with code <slug>
 *  - any other hostname    -> a merchant's custom domain (the whole hostname is the store key)
 *  - <root-domain>         -> the SaaS site (marketing, auth, dashboard)
 *
 * Authentication is NOT decided here: the backend validates the session on every API call and the dashboard
 * layouts re-validate it against the backend. This proxy only avoids rendering the dashboard for visitors that
 * obviously have no session cookie.
 */
export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = (request.headers.get("host") || "").toLowerCase();
  const baseDomain = resolveBaseDomain(hostname);

  let storeKey = "";
  if (hostname !== baseDomain && hostname !== `www.${baseDomain}`) {
    storeKey = hostname.endsWith(`.${baseDomain}`) ? hostname.slice(0, -(baseDomain.length + 1)) : hostname;
  }

  if (storeKey) {
    // Already addressing a store route directly (path-based access): leave it alone.
    if (url.pathname.startsWith("/store")) return NextResponse.next();
    return NextResponse.rewrite(new URL(`/store/${storeKey}${url.pathname}${url.search}`, request.url));
  }

  if (url.pathname.startsWith("/dashboard") && !request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}
