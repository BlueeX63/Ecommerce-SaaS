import { Redis } from '@upstash/redis';

// Initialize Redis only if the environment variables exist
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis = redisUrl && redisToken 
  ? new Redis({ url: redisUrl, token: redisToken }) 
  : null;

/**
 * A wrapper for fetching data with a Redis fallback
 * @param key The unique cache key
 * @param fetcher The function to fetch fresh data if there's a cache miss
 * @param ttl Time to live in seconds (default: 60s)
 */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 60
): Promise<T> {
  if (!redis) {
    // If Redis isn't configured, bypass cache and fetch directly
    return fetcher();
  }

  try {
    const cachedData = await redis.get<T>(key);
    
    if (cachedData) {
      return cachedData;
    }

    const freshData = await fetcher();
    
    // Do not block the return by waiting for the cache set
    redis.setex(key, ttl, freshData).catch(err => {
      console.warn(`Failed to set Redis cache for ${key}`, err);
    });

    return freshData;
  } catch (error) {
    console.warn(`Redis Cache Error for key ${key}:`, error);
    // Fallback to fetcher on Redis failure
    return fetcher();
  }
}
