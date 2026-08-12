import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const isProduction = process.env.NODE_ENV === 'production';

export async function rateLimit(
  identifier: string,
  limit: number = 5,
  windowMs: number = 60000 // 1 minute default
): Promise<{ success: boolean; remaining: number; reset: number }> {
  try {
    // If Redis is not configured
    if (!process.env.UPSTASH_REDIS_REST_URL) {
      if (isProduction) {
        // In production, DENY requests if rate limiter is not configured
        console.error('CRITICAL: Rate limiter Redis not configured in production. Denying request.');
        return { success: false, remaining: 0, reset: Date.now() + windowMs };
      }
      // In development, allow through (fail open)
      return { success: true, remaining: limit - 1, reset: Date.now() + windowMs };
    }

    const key = `rate_limit:${identifier}`;
    
    const currentCount = await redis.incr(key);
    
    // Set expiry on the first increment (new window)
    if (currentCount === 1) {
      await redis.pexpire(key, windowMs);
    }

    const remaining = Math.max(0, limit - currentCount);
    const reset = Date.now() + windowMs; // Approximate reset time
    
    return {
      success: currentCount <= limit,
      remaining,
      reset
    };
  } catch (error) {
    console.error('Rate limiting error:', error);
    if (isProduction) {
      // In production, deny requests when rate limiter fails (fail closed)
      return { success: false, remaining: 0, reset: Date.now() + windowMs };
    }
    // In development, fail open
    return { success: true, remaining: 1, reset: Date.now() + windowMs };
  }
}

