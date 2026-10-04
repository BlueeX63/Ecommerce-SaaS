import { randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../lib/supabase.js';
import { badRequest, notFound, parse, uuid } from '../lib/http.js';
import { isSafeExternalUrl } from '../lib/ssrf.js';
import { assertTenantOwner, tenantCtx } from '../middleware/auth.js';
import { WEBHOOK_EVENT_TYPES, dispatchWebhookEvent } from '../services/webhooks.js';

const LIST_COLUMNS = 'webhook_id, webhook_url, event_type, is_active, created_date';

export async function list(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const { data, error } = await db
    .from('webhooks')
    .select(LIST_COLUMNS)
    .eq('tenant_id', tenantId)
    .order('created_date', { ascending: false });
  if (error) throw error;
  res.json({ data });
}

export async function create(req: Request, res: Response) {
  const { tenantId, userId } = tenantCtx(req);
  await assertTenantOwner(tenantId, userId);

  const body = parse(
    z.object({
      url: z.string().trim().max(2048).refine(isSafeExternalUrl, 'Enter a public https:// URL (not localhost or a private address)'),
      eventType: z.enum(WEBHOOK_EVENT_TYPES),
    }),
    req.body,
  );

  const secret = `whsec_${randomBytes(24).toString('base64url')}`;

  const { data, error } = await db
    .from('webhooks')
    .insert({ tenant_id: tenantId, webhook_url: body.url, event_type: body.eventType, secret_key: secret })
    .select(LIST_COLUMNS)
    .single();
  if (error) throw error;

  // The signing secret is only ever available at creation - store it now, it can't be shown again.
  res.status(201).json({ message: 'Webhook created successfully', data: { ...data, secret } });
}

export async function toggleActive(req: Request, res: Response) {
  const { tenantId, userId } = tenantCtx(req);
  await assertTenantOwner(tenantId, userId);
  const id = uuid(req.params.id);
  const { isActive } = parse(z.object({ isActive: z.boolean() }), req.body);

  const { data, error } = await db
    .from('webhooks')
    .update({ is_active: isActive })
    .eq('webhook_id', id)
    .eq('tenant_id', tenantId)
    .select(LIST_COLUMNS)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound('Webhook not found');

  res.json({ data });
}

export async function remove(req: Request, res: Response) {
  const { tenantId, userId } = tenantCtx(req);
  await assertTenantOwner(tenantId, userId);
  const id = uuid(req.params.id);

  const { data, error } = await db.from('webhooks').delete().eq('webhook_id', id).eq('tenant_id', tenantId).select('webhook_id');
  if (error) throw error;
  if (!data?.length) throw notFound('Webhook not found');

  res.json({ success: true });
}

export async function sendTest(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const id = uuid(req.params.id);
  const { data: hook } = await db.from('webhooks').select('event_type').eq('webhook_id', id).eq('tenant_id', tenantId).maybeSingle();
  if (!hook) throw notFound('Webhook not found');
  if (!(WEBHOOK_EVENT_TYPES as readonly string[]).includes(hook.event_type)) throw badRequest('Unknown event type');

  dispatchWebhookEvent(tenantId, hook.event_type as (typeof WEBHOOK_EVENT_TYPES)[number], {
    test: true,
    message: 'This is a test event from Monolith.',
  });
  res.json({ message: 'Test event queued for delivery' });
}
