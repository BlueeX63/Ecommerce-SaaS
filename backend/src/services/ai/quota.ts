import { ApiError } from '../../lib/http.js';
import { rateLimit } from '../../lib/rate-limit.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Per-store daily ceilings on paid AI calls. These bound cost even if a store's traffic (or a scripted client)
 * spikes; the short per-IP limits on each route handle abuse, these handle spend.
 */
export const AI_DAILY_LIMITS = {
  text: 1000,
  image: 100,
  voice: 200,
} as const;

export type AiQuota = keyof typeof AI_DAILY_LIMITS;

export async function consumeAiQuota(tenantId: string, quota: AiQuota): Promise<void> {
  const result = await rateLimit(`ai-quota:${quota}:${tenantId}`, AI_DAILY_LIMITS[quota], DAY_MS);
  if (!result.success) {
    throw new ApiError(429, 'Daily AI limit reached for this store. Please try again tomorrow.', undefined, 'AI_QUOTA_EXCEEDED');
  }
}
