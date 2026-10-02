import { Redis } from '@upstash/redis';
import { env, isProd } from '../config/env.js';

/**
 * Small key/value layer: Upstash Redis when configured, otherwise an in-memory
 * store (development only - production requires Redis, see config/env.ts).
 */
const redis =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN })
    : null;

if (!redis && !isProd) {
  console.warn('[kv] Redis is not configured - using in-memory store (development only).');
}

type Entry = { value: unknown; expiresAt: number };
const memory = new Map<string, Entry>();

function memGet(key: string): Entry | undefined {
  const entry = memory.get(key);
  if (entry && entry.expiresAt <= Date.now()) {
    memory.delete(key);
    return undefined;
  }
  return entry;
}

export async function kvGet<T = unknown>(key: string): Promise<T | null> {
  if (redis) return (await redis.get<T>(key)) ?? null;
  return (memGet(key)?.value as T | undefined) ?? null;
}

export async function kvSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  if (redis) {
    await redis.set(key, value, { ex: ttlSeconds });
    return;
  }
  memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function kvDel(...keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  if (redis) {
    await redis.del(...keys);
    return;
  }
  keys.forEach((k) => memory.delete(k));
}

/** Atomically increments a counter; the TTL is set when the counter is created. */
export async function kvIncr(key: string, ttlMs: number): Promise<number> {
  if (redis) {
    const count = await redis.incr(key);
    if (count === 1) await redis.pexpire(key, ttlMs);
    return count;
  }
  const entry = memGet(key);
  const count = ((entry?.value as number | undefined) ?? 0) + 1;
  memory.set(key, { value: count, expiresAt: entry?.expiresAt ?? Date.now() + ttlMs });
  return count;
}

/** Read-through cache. Falls back to the fetcher when the cache is unavailable. Nulls are never cached. */
export async function fetchWithCache<T>(key: string, fetcher: () => Promise<T>, ttlSeconds = 60): Promise<T> {
  try {
    const cached = await kvGet<T>(key);
    if (cached !== null && cached !== undefined) return cached;
  } catch (error) {
    console.warn(`[kv] cache read failed for ${key}`, error);
  }

  const fresh = await fetcher();

  if (fresh !== null && fresh !== undefined) {
    kvSet(key, fresh, ttlSeconds).catch((error) => console.warn(`[kv] cache write failed for ${key}`, error));
  }
  return fresh;
}

// Periodically drop expired in-memory entries (no-op with Redis).
if (!redis) {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memory) if (entry.expiresAt <= now) memory.delete(key);
  }, 60_000).unref();
}
