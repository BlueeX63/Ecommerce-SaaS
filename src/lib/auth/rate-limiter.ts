import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export async function rateLimit(
  identifier: string,
  limit: number = 5,
  windowMs: number = 60000 // 1 minute default
): Promise<{ success: boolean; remaining: number; reset: number }> {
  try {
    // If Redis is not configured, bypass rate limiting (fail open)
    // This is helpful for local development if the user hasn't set up Upstash yet
    if (!process.env.UPSTASH_REDIS_REST_URL) {
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
    // Fail open if Redis is down or error occurs
    return { success: true, remaining: 1, reset: Date.now() + windowMs };
  }
}
