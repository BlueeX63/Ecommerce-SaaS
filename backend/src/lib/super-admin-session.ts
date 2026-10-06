import type { CookieOptions, Request, Response } from 'express';
import { isProd } from '../config/env.js';
import { signToken, verifyToken } from './jwt.js';

export const SUPER_ADMIN_COOKIE = 'super_admin_session';
// Short-lived on purpose: this cookie can't be revoked server-side (there's no session table for it, by
// design - see lib/super-admins.ts), so re-authentication is the only way to end a stale one.
const TTL_MS = 8 * 60 * 60 * 1000;

export interface SuperAdminSession {
  email: string;
}

function cookieOptions(expires?: Date): CookieOptions {
  return { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/', ...(expires ? { expires } : {}) };
}

export async function issueSuperAdminSession(res: Response, email: string) {
  const token = await signToken('super-admin-session', { email }, '8h');
  res.cookie(SUPER_ADMIN_COOKIE, token, cookieOptions(new Date(Date.now() + TTL_MS)));
}

export async function getSuperAdminSession(req: Request): Promise<SuperAdminSession | null> {
  const payload = await verifyToken<SuperAdminSession>('super-admin-session', req.cookies?.[SUPER_ADMIN_COOKIE]);
  if (!payload?.email) return null;
  return { email: payload.email };
}

export function clearSuperAdminCookie(res: Response) {
  res.clearCookie(SUPER_ADMIN_COOKIE, cookieOptions());
}
