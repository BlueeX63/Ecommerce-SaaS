// Dev helper: clears a tenant's cached product list. Run from backend/ with:
//   node scripts/clear_cache.mjs <tenant-id>
import 'dotenv/config';
import { Redis } from '@upstash/redis';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!redisUrl || !redisToken) {
  console.error('Missing UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN. Run this from backend/ with a .env file present.');
  process.exit(1);
}

const tenantId = process.argv[2];
if (!tenantId) {
  console.error('Usage: node scripts/clear_cache.mjs <tenant-id>');
  process.exit(1);
}

const redis = new Redis({ url: redisUrl, token: redisToken });

async function clearCache() {
  await redis.del(`tenant_products:${tenantId}`, `tenant_settings:${tenantId}`, `tenant:${tenantId}`);
  console.log(`Cleared cache for tenant ${tenantId}`);
}

clearCache();
