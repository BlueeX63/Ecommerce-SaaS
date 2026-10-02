import { createHash, randomBytes } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { db } from '../lib/supabase.js';
import { badRequest, notFound, parse, uuid } from '../lib/http.js';
import { limit } from '../lib/rate-limit.js';
import { assertTenantOwner, requireMerchant, tenantCtx } from '../middleware/auth.js';

/**
 * Merchant-facing API key management.
 *
 * Keys are shown to the merchant exactly once, at creation. Only a SHA-256 hash is ever stored (in the
 * existing `api_keys.api_key` column) - not the raw secret - so a database read can never recover a usable
 * key, matching how GitHub/Stripe-style tokens are handled.
 *
 * Note: this issues and revokes keys, but nothing in this codebase yet authenticates incoming requests
 * against them - there is no public REST surface that accepts `X-API-Key`. Wiring that up (a versioned
 * public API + an auth middleware that hashes the presented key and looks it up here) is a separate,
 * larger feature than the key-management UI itself.
 */
export const apiKeysRouter = Router();
apiKeysRouter.use(requireMerchant);

const KEY_PREFIX = 'mono_live_';
const KEY_COLUMNS = 'api_key_id, key_name, is_active, created_date, expires_on';

function hashKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex');
}

apiKeysRouter.get('/', async (req, res) => {
  const { tenantId } = tenantCtx(req);
  const { data, error } = await db
    .from('api_keys')
    .select(KEY_COLUMNS)
    .eq('tenant_id', tenantId)
    .order('created_date', { ascending: false });
  if (error) throw error;
  res.json({ data });
});

const EXPIRY_DAYS = z.union([z.literal(30), z.literal(90), z.literal(365)]).optional();

apiKeysRouter.post('/', limit('api-key-create', 20, 60 * 60_000, (req) => req.merchant?.userId), async (req, res) => {
  const { tenantId, userId } = tenantCtx(req);
  await assertTenantOwner(tenantId, userId);

  const body = parse(z.object({ keyName: z.string().trim().min(1, 'A name is required').max(150), expiresInDays: EXPIRY_DAYS }), req.body);

  const rawKey = `${KEY_PREFIX}${randomBytes(24).toString('base64url')}`;
  const expiresOn = body.expiresInDays ? new Date(Date.now() + body.expiresInDays * 24 * 60 * 60 * 1000).toISOString() : null;

  const { data, error } = await db
    .from('api_keys')
    .insert({ tenant_id: tenantId, key_name: body.keyName, api_key: hashKey(rawKey), expires_on: expiresOn })
    .select(KEY_COLUMNS)
    .single();
  if (error) {
    if (error.code === '23505') throw badRequest('Please try again - that key collided, which should never happen.');
    throw error;
  }

  // The only time the raw key is ever available - the merchant must copy it now.
  res.status(201).json({ message: 'API key created successfully', data: { ...data, key: rawKey } });
});

apiKeysRouter.patch('/:id', async (req, res) => {
  const { tenantId, userId } = tenantCtx(req);
  await assertTenantOwner(tenantId, userId);
  const id = uuid(req.params.id);
  const { isActive } = parse(z.object({ isActive: z.boolean() }), req.body);

  const { data, error } = await db
    .from('api_keys')
    .update({ is_active: isActive })
    .eq('api_key_id', id)
    .eq('tenant_id', tenantId)
    .select(KEY_COLUMNS)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound('API key not found');

  res.json({ data });
});

apiKeysRouter.delete('/:id', async (req, res) => {
  const { tenantId, userId } = tenantCtx(req);
  await assertTenantOwner(tenantId, userId);
  const id = uuid(req.params.id);

  const { data, error } = await db.from('api_keys').delete().eq('api_key_id', id).eq('tenant_id', tenantId).select('api_key_id');
  if (error) throw error;
  if (!data?.length) throw notFound('API key not found');

  res.json({ success: true });
});
