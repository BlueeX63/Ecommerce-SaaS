import type { CookieOptions, Request, Response } from 'express';
import { isProd } from '../config/env.js';
import { signToken, verifyToken } from './jwt.js';
import { db } from './supabase.js';

export const SESSION_COOKIE = 'session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface MerchantSession {
  sessionId: string;
  userId: string;
  tenantId: string | null;
  role: string;
}

function cookieOptions(expires?: Date): CookieOptions {
  return { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/', ...(expires ? { expires } : {}) };
}

async function writeCookie(res: Response, session: MerchantSession) {
  const expires = new Date(Date.now() + SESSION_TTL_MS);
  const token = await signToken('merchant-session', { ...session }, '7d');
  res.cookie(SESSION_COOKIE, token, cookieOptions(expires));
}

/** Creates a DB-backed (revocable) session and sets the signed cookie. */
export async function createSession(
  res: Response,
  params: { userId: string; tenantId: string | null; role?: string; ip?: string | null; userAgent?: string | null },
) {
  const { data, error } = await db
    .from('user_sessions')
    .insert({
      user_id: params.userId,
      ip_address: params.ip ? params.ip.slice(0, 45) : null,
      user_agent: params.userAgent ? params.userAgent.slice(0, 500) : null,
      is_active: true,
    })
    .select('session_id')
    .single();

  if (error || !data) {
    console.error('[session] failed to create DB session', error);
    throw new Error('Failed to create session');
  }

  await writeCookie(res, {
    sessionId: data.session_id,
    userId: params.userId,
    tenantId: params.tenantId || null,
    role: params.role ?? 'ADMIN',
  });
}

/** Re-issues the cookie for the same DB session with a different active tenant (store switch/create/delete). */
export async function setSessionTenant(res: Response, session: MerchantSession, tenantId: string | null) {
  await writeCookie(res, { ...session, tenantId });
}

/** Validates the cookie signature AND that the DB session and user are still active. */
export async function getSession(req: Request): Promise<MerchantSession | null> {
  const payload = await verifyToken<MerchantSession>('merchant-session', req.cookies?.[SESSION_COOKIE]);
  if (!payload?.sessionId || !payload.userId) return null;

  const { data, error } = await db
    .from('user_sessions')
    .select('is_active, users(status)')
    .eq('session_id', payload.sessionId)
    .eq('user_id', payload.userId)
    .maybeSingle();

  if (error || !data || !data.is_active) return null;

  const user = Array.isArray(data.users) ? data.users[0] : data.users;
  if (!user || user.status !== 'ACTIVE') return null;

  return {
    sessionId: payload.sessionId,
    userId: payload.userId,
    tenantId: payload.tenantId || null,
    role: payload.role || 'ADMIN',
  };
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, cookieOptions());
}

export async function destroySession(req: Request, res: Response) {
  const payload = await verifyToken<MerchantSession>('merchant-session', req.cookies?.[SESSION_COOKIE]);
  if (payload?.sessionId) {
    await db
      .from('user_sessions')
      .update({ is_active: false, logout_time: new Date().toISOString() })
      .eq('session_id', payload.sessionId);
  }
  clearSessionCookie(res);
}

/** Revokes every active session of a user (used after password changes). */
export async function revokeUserSessions(userId: string, exceptSessionId?: string) {
  let query = db
    .from('user_sessions')
    .update({ is_active: false, logout_time: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_active', true);
  if (exceptSessionId) query = query.neq('session_id', exceptSessionId);
  await query;
}
