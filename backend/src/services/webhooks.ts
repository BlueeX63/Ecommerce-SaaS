import { createHmac } from 'node:crypto';
import { db } from '../lib/supabase.js';

/** Event types a merchant can subscribe a webhook to. Only 'order.created' is actually dispatched today -
 *  the others are reserved so the UI's event picker doesn't need to change when they're wired up. */
export const WEBHOOK_EVENT_TYPES = ['order.created', 'order.updated', 'product.created'] as const;
export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];

const DELIVERY_TIMEOUT_MS = 5000;

async function deliver(url: string, secret: string, body: string): Promise<boolean> {
  const signature = createHmac('sha256', secret).update(body).digest('hex');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Monolith-Signature': `sha256=${signature}` },
      body,
      redirect: 'manual', // never silently follow a redirect to an internal address
      signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
    });
    return res.ok;
  } catch (error) {
    console.warn(`[webhooks] delivery to ${url} failed`, error);
    return false;
  }
}

/**
 * Fire-and-forget dispatch to every active webhook a tenant has registered for this event. Never throws -
 * a slow or failing webhook endpoint must never affect the request that triggered it (e.g. checkout).
 */
export function dispatchWebhookEvent(tenantId: string, event: WebhookEventType, payload: Record<string, unknown>): void {
  (async () => {
    const { data: hooks } = await db
      .from('webhooks')
      .select('webhook_url, secret_key')
      .eq('tenant_id', tenantId)
      .eq('event_type', event)
      .eq('is_active', true);
    if (!hooks?.length) return;

    const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() });
    await Promise.all(hooks.map((hook) => deliver(hook.webhook_url, hook.secret_key, body)));
  })().catch((error) => console.warn(`[webhooks] dispatch failed for tenant ${tenantId}`, error));
}
