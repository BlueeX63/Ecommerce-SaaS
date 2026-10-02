import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = new Redis({ url: redisUrl, token: redisToken });

async function clearCache() {
  const tenantId = '40e5c335-95a9-40fb-8173-e204221be03f';
  await redis.del(`tenant_products:${tenantId}`);
  console.log('Cleared cache for products!');
}

clearCache();
