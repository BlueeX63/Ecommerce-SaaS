import { cache } from "react";
import { cookies } from "next/headers";

/**
 * Server-side client for the Node.js backend (see /backend).
 *
 * Browser code never calls this - it uses same-origin `/api/*` URLs, which next.config.ts proxies to the backend
 * so the employee_session cookie stays first-party to this app's origin. Server Components use this helper to call
 * the backend directly, forwarding the visitor's cookies when `auth` is true.
 */
export const BACKEND_URL = (process.env.BACKEND_URL || "http://localhost:4100").replace(/\/$/, "");

export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string };

export async function backendFetch<T = unknown>(path: string, options: { auth?: boolean } = {}): Promise<ApiResult<T>> {
  const headers: Record<string, string> = { accept: "application/json" };

  if (options.auth) {
    const cookieHeader = (await cookies()).toString();
    if (cookieHeader) headers.cookie = cookieHeader;
  }

  try {
    const res = await fetch(`${BACKEND_URL}${path}`, { headers, cache: "no-store" });
    const body: { error?: string } | null = await res.json().catch(() => null);
    if (res.ok) return { ok: true, status: res.status, data: body as T };
    return { ok: false, status: res.status, error: body?.error ?? res.statusText };
  } catch (error) {
    console.error(`[api] request to ${path} failed`, error);
    return { ok: false, status: 503, error: "Backend unavailable" };
  }
}

export interface Warehouse {
  warehouse_id: string;
  warehouse_name: string;
  address_line_1: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  dispatch_hours: number | null;
  daily_capacity: number | null;
  is_active: boolean;
}

export interface EmployeeSession {
  isLoggedIn: boolean;
  employee: { name: string; email: string };
  store: { name: string };
  warehouse: Warehouse;
}

/** The signed-in employee (deduplicated per request), or null when there is no valid session. */
export const getEmployeeSession = cache(async (): Promise<EmployeeSession | null> => {
  const result = await backendFetch<EmployeeSession>("/api/v1/employee/auth/session", { auth: true });
  return result.ok ? result.data : null;
});
