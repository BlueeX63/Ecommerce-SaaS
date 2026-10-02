import type { CookieOptions, Request, Response } from 'express';
import { isProd } from '../config/env.js';
import { signToken, verifyToken } from './jwt.js';

export const STORE_COOKIE = 'store_session';
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface ShopperSession {
  customerId: string;
  tenantId: string;
  slug: string;
}

function cookieOptions(expires?: Date): CookieOptions {
  return { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/', ...(expires ? { expires } : {}) };
}

export async function issueShopperSession(res: Response, session: ShopperSession) {
  const token = await signToken('store-session', { ...session }, '7d');
  res.cookie(STORE_COOKIE, token, cookieOptions(new Date(Date.now() + TTL_MS)));
}

export async function readShopperSession(req: Request): Promise<ShopperSession | null> {
  const payload = await verifyToken<ShopperSession>('store-session', req.cookies?.[STORE_COOKIE]);
  if (!payload?.customerId || !payload.tenantId) return null;
  return { customerId: payload.customerId, tenantId: payload.tenantId, slug: payload.slug };
}

export function clearShopperCookie(res: Response) {
  res.clearCookie(STORE_COOKIE, cookieOptions());
}
