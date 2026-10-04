import { createHash, randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../lib/supabase.js';
import { badRequest, notFound, parse, uuid } from '../lib/http.js';
import { assertTenantOwner, tenantCtx } from '../middleware/auth.js';

const KEY_PREFIX = 'mono_live_';
const KEY_COLUMNS = 'api_key_id, key_name, is_active, created_date, expires_on';
const EXPIRY_DAYS = z.union([z.literal(30), z.literal(90), z.literal(365)]).optional();

function hashKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex');
}

export async function list(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const { data, error } = await db
    .from('api_keys')
    .select(KEY_COLUMNS)
    .eq('tenant_id', tenantId)
    .order('created_date', { ascending: false });
  if (error) throw error;
  res.json({ data });
}

export async function create(req: Request, res: Response) {
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
}

export async function toggleActive(req: Request, res: Response) {
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
}

export async function remove(req: Request, res: Response) {
  const { tenantId, userId } = tenantCtx(req);
  await assertTenantOwner(tenantId, userId);
  const id = uuid(req.params.id);

  const { data, error } = await db.from('api_keys').delete().eq('api_key_id', id).eq('tenant_id', tenantId).select('api_key_id');
  if (error) throw error;
  if (!data?.length) throw notFound('API key not found');

  res.json({ success: true });
}
