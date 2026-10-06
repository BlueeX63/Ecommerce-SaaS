import { createHmac } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import { env } from '../config/env.js';

/**
 * Each token type gets its own signing key (derived from JWT_SECRET) and audience, so a token issued for one
 * purpose (e.g. a password-reset link) can never be replayed as another (e.g. a session cookie).
 */
export type TokenPurpose =
  | 'merchant-session'
  | 'store-session'
  | 'password-reset'
  | 'team-invite'
  | 'super-admin-session'
  | 'impersonation-ticket';

const keyCache = new Map<TokenPurpose, Uint8Array>();

function keyFor(purpose: TokenPurpose): Uint8Array {
  let key = keyCache.get(purpose);
  if (!key) {
    key = new Uint8Array(createHmac('sha256', env.JWT_SECRET).update(`monolith:${purpose}`).digest());
    keyCache.set(purpose, key);
  }
  return key;
}

export async function signToken(purpose: TokenPurpose, payload: Record<string, unknown>, expiresIn: string) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer('monolith')
    .setAudience(purpose)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(keyFor(purpose));
}

export async function verifyToken<T>(
  purpose: TokenPurpose,
  token: string | undefined,
): Promise<T | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, keyFor(purpose), {
      algorithms: ['HS256'],
      issuer: 'monolith',
      audience: purpose,
    });
    return payload as unknown as T;
  } catch {
    return null;
  }
}
