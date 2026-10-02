import type { Request, RequestHandler } from 'express';
import { isProd } from '../config/env.js';
import { kvIncr } from './kv.js';
import { ApiError } from './http.js';

export interface RateLimitResult {
  success: boolean;
  remaining: number;
}

/** Fixed-window limiter. Fails closed in production if the store is unavailable. */
export async function rateLimit(identifier: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  try {
    const count = await kvIncr(`rl:${identifier}`, windowMs);
    return { success: count <= limit, remaining: Math.max(0, limit - count) };
  } catch (error) {
    console.error('[rate-limit] error', error);
    return { success: !isProd, remaining: 0 };
  }
}

/** Express middleware factory. `by` builds the bucket key (defaults to the client IP). */
export function limit(
  name: string,
  max: number,
  windowMs: number,
  by: (req: Request) => string | undefined = (req) => req.ip,
): RequestHandler {
  return async (req, _res, next) => {
    const result = await rateLimit(`${name}:${by(req) ?? 'unknown'}`, max, windowMs);
    if (!result.success) {
      return next(new ApiError(429, 'Too many requests. Please try again later.'));
    }
    next();
  };
}
