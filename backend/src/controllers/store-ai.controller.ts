import type { Request, Response } from 'express';
import { z } from 'zod';
import { ApiError, parse } from '../lib/http.js';
import { requireStoreTenant } from '../services/tenants.js';
import { assertStoreAiEnabled } from '../middleware/ai.js';
import { consumeAiQuota } from '../services/ai/quota.js';
import { createVoiceSession, streamStoreChat, type ChatEvent } from '../services/ai/store-assistant.js';
import { runStoreTool } from '../services/ai/store-tools.js';
import type { StoreToolContext } from '../services/ai/store-tools.js';

/**
 * Shared guard for every storefront AI route: the store must exist, its owner must have the AI add-on, and the
 * shopper's session (if any) must belong to this very store - a cookie from store A never acts on store B.
 */
async function storeAiContext(req: Request): Promise<{ ctx: StoreToolContext; storeName: string }> {
  const tenant = await requireStoreTenant(String(req.params.slug));
  await assertStoreAiEnabled(tenant.tenant_id);

  const shopper = req.shopper;
  const customerId = shopper && shopper.tenantId === tenant.tenant_id ? shopper.customerId : null;
  return { ctx: { tenantId: tenant.tenant_id, customerId }, storeName: tenant.tenant_name };
}

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(1000),
      }),
    )
    .min(1)
    .max(20)
    .refine((m) => m[m.length - 1].role === 'user', 'The last message must be from the shopper'),
});

/** Streams the assistant's reply as server-sent events. */
export async function chat(req: Request, res: Response) {
  const { ctx, storeName } = await storeAiContext(req);
  const body = parse(chatSchema, req.body);
  await consumeAiQuota(ctx.tenantId, 'text');

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const controller = new AbortController();
  res.on('close', () => controller.abort());

  const send = (event: ChatEvent) => {
    if (!controller.signal.aborted) res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  await streamStoreChat({ ctx, storeName, history: body.messages, signal: controller.signal, send });
  res.end();
}

/** Mints a short-lived voice session token for the browser. */
export async function voiceSession(req: Request, res: Response) {
  const { ctx, storeName } = await storeAiContext(req);
  await consumeAiQuota(ctx.tenantId, 'voice');
  const session = await createVoiceSession(ctx, storeName);
  res.json(session);
}

const TOOL_NAME = /^[a-z_]{1,40}$/;

/**
 * Runs one store action on behalf of the voice agent (the browser executes the tool calls the realtime model
 * requests). Same allowlist and checks as the text chat.
 */
export async function tool(req: Request, res: Response) {
  const { ctx } = await storeAiContext(req);
  const name = String(req.params.name);
  if (!TOOL_NAME.test(name)) throw new ApiError(404, 'Unknown action');

  const output = await runStoreTool(ctx, name, req.body ?? {});
  res.json(output);
}
