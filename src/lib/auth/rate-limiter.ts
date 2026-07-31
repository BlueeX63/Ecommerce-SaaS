// Simple in-memory rate limiter for Next.js API routes
// Note: In a production multi-instance environment, replace this with Redis (e.g. Upstash)

type RateLimitStore = {
  [key: string]: {
    count: number;
    resetTime: number;
  };
};

const store: RateLimitStore = {};

export function rateLimit(
  identifier: string,
  limit: number = 5,
  windowMs: number = 60000 // 1 minute default
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();
  
  if (!store[identifier]) {
    store[identifier] = {
      count: 1,
      resetTime: now + windowMs
    };
    return { success: true, remaining: limit - 1, reset: store[identifier].resetTime };
  }
  
  const record = store[identifier];
  
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    return { success: true, remaining: limit - 1, reset: record.resetTime };
  }
  
  record.count += 1;
  
  if (record.count > limit) {
    return { success: false, remaining: 0, reset: record.resetTime };
  }
  
  return { success: true, remaining: limit - record.count, reset: record.resetTime };
}
