import { cache } from "react";
import { cookies } from "next/headers";

/**
 * Server-side client for the Node.js backend (see /backend).
 *
 * Browser code never calls this - it uses same-origin `/api/*` URLs, which next.config.ts proxies to the
 * backend so the super_admin_session cookie stays first-party to this app's own origin. Server Components
 * use this helper to call the backend directly, forwarding the visitor's cookies when `auth` is true.
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

export interface SuperAdminSession {
  isLoggedIn: boolean;
  email?: string;
}

/** The logged-in super admin's session (deduplicated per request), or null when there is none. */
export const getSuperAdminSession = cache(async (): Promise<SuperAdminSession | null> => {
  const result = await backendFetch<SuperAdminSession>("/api/v1/super-admin/auth/session", { auth: true });
  return result.ok ? result.data : null;
});
