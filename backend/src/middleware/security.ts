import type { RequestHandler } from 'express';
import { env } from '../config/env.js';
import { ApiError } from '../lib/http.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function hostOf(value: string): string | null {
  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * CSRF protection for cookie-authenticated requests.
 *
 * SameSite=Lax is not sufficient here: every storefront lives on a sibling subdomain of the SaaS domain, so
 * a malicious store would be "same-site" to the dashboard. We therefore require browsers to tell us the request
 * is same-origin, using Fetch Metadata (`Sec-Fetch-Site`) and falling back to the `Origin` header.
 * Non-browser clients (no such headers, no ambient cookies) and Stripe webhooks (signature verified) pass through.
 */
export const csrfGuard: RequestHandler = (req, _res, next) => {
  if (SAFE_METHODS.has(req.method) || req.path.startsWith('/api/webhooks/')) return next();

  const site = req.get('sec-fetch-site');
  if (site) {
    if (site === 'same-origin' || site === 'none') return next();
    return next(new ApiError(403, 'Cross-site request blocked'));
  }

  const origin = req.get('origin');
  if (!origin) return next();

  const originHost = hostOf(origin);
  const forwardedHost = req.get('x-forwarded-host')?.split(',')[0]?.trim().toLowerCase();
  if (originHost) {
    if (forwardedHost) {
      if (originHost === forwardedHost) return next();
    } else {
      const allowed = [hostOf(env.FRONTEND_URL)];
      if (env.ROOT_DOMAIN) allowed.push(env.ROOT_DOMAIN.toLowerCase());
      if (allowed.includes(originHost)) return next();
      if (env.ROOT_DOMAIN && originHost.endsWith(`.${env.ROOT_DOMAIN.toLowerCase()}`)) return next();
    }
  }
  return next(new ApiError(403, 'Cross-site request blocked'));
};

/** API responses can contain private data and must never be cached by browsers or intermediaries. */
export const noStore: RequestHandler = (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
};
