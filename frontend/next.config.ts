import type { NextConfig } from "next";

// The Node.js API (see /backend). Browsers only ever talk to same-origin /api/* URLs; Next.js proxies them
// to the backend so session cookies stay first-party on the SaaS domain, every store subdomain and every
// merchant custom domain.
const BACKEND_URL = (process.env.BACKEND_URL || "http://localhost:4100").replace(/\/$/, "");

const isProd = process.env.NODE_ENV === "production";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(self), payment=(self)" },
  // Non-breaking CSP directives: no framing by other sites, no <base> hijacking, no plugins, forms only to self.
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'",
  },
  ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] : []),
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  compress: true,
  poweredByHeader: false,

  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` }];
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
