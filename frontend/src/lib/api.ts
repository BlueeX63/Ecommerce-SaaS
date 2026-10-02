import { cache } from "react";
import { cookies } from "next/headers";

/**
 * Server-side client for the Node.js backend (see /backend).
 *
 * Browser code never calls this - it uses same-origin `/api/*` URLs, which next.config.ts proxies to the
 * backend so that cookies stay first-party on every storefront domain. Server Components use this helper
 * to call the backend directly, forwarding the visitor's cookies when `auth` is true.
 */
export const BACKEND_URL = (process.env.BACKEND_URL || "http://localhost:4100").replace(/\/$/, "");

export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string; code?: string };

export async function backendFetch<T = unknown>(path: string, options: { auth?: boolean } = {}): Promise<ApiResult<T>> {
  const headers: Record<string, string> = { accept: "application/json" };

  if (options.auth) {
    const cookieHeader = (await cookies()).toString();
    if (cookieHeader) headers.cookie = cookieHeader;
  }

  try {
    const res = await fetch(`${BACKEND_URL}${path}`, { headers, cache: "no-store" });
    const body: { error?: string; code?: string } | null = await res.json().catch(() => null);
    if (res.ok) return { ok: true, status: res.status, data: body as T };
    return { ok: false, status: res.status, error: body?.error ?? res.statusText, code: body?.code };
  } catch (error) {
    console.error(`[api] request to ${path} failed`, error);
    return { ok: false, status: 503, error: "Backend unavailable" };
  }
}

export interface MerchantContext {
  user: {
    userId: string;
    tenantId: string | null;
    first_name?: string;
    last_name?: string;
    email?: string;
    role?: string | null;
  };
  subscriptionActive: boolean;
  plan: { id: string; name: string; maxStores: number } | null;
  /** Purchased add-on ids, e.g. ["advanced_analytics", "custom_domain"]. */
  featureFlags: string[];
  hasStore: boolean;
  stores: Array<{ tenant_id: string; tenant_name: string; code: string; custom_domain: string | null }>;
  storesUsed: number;
  activeStore: { tenant_id: string; tenant_name: string; code: string; custom_domain: string | null } | null;
}

/** The logged-in merchant's context (deduplicated per request), or null when there is no valid session. */
export const getMerchantContext = cache(async (): Promise<MerchantContext | null> => {
  const result = await backendFetch<MerchantContext>("/api/v1/auth/context", { auth: true });
  return result.ok ? result.data : null;
});
