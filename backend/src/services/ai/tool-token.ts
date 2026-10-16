import { signToken, verifyToken } from '../../lib/jwt.js';
import type { StoreToolContext } from './store-tools.js';

/**
 * The AI service never chooses whose cart a tool touches. For each assistant request this API mints a short-lived
 * token that binds one store and (optionally) one signed-in shopper; the service hands it back verbatim when the
 * model asks for a tool, and `/internal/ai/tools/:name` runs the tool only for what the token says. It has its own
 * audience, so it cannot be replayed as a session or any other token.
 */
const TTL = '10m';

interface ToolTokenPayload {
  tid: string;
  cid: string | null;
}

export function signToolToken(ctx: StoreToolContext): Promise<string> {
  return signToken('ai-tool', { tid: ctx.tenantId, cid: ctx.customerId }, TTL);
}

export async function verifyToolToken(token: string | undefined): Promise<StoreToolContext | null> {
  const payload = await verifyToken<ToolTokenPayload>('ai-tool', token);
  if (!payload || typeof payload.tid !== 'string' || (payload.cid !== null && typeof payload.cid !== 'string')) return null;
  return { tenantId: payload.tid, customerId: payload.cid };
}
