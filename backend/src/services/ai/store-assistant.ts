import { db } from '../../lib/supabase.js';
import { fetchWithCache } from '../../lib/kv.js';
import { aiJson, aiStream } from './ai-service.js';
import { signToolToken } from './tool-token.js';
import { toolManifest, type StoreToolContext } from './store-tools.js';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

/** Shopper-facing event stream. The browser never sees the AI service's or the provider's raw payloads. */
export type ChatEvent =
  | { type: 'delta'; text: string }
  | { type: 'tool'; name: string }
  | { type: 'done' }
  | { type: 'error'; message: string };

const GENERIC_ERROR = 'The AI service is temporarily unavailable. Please try again.';

/** Public, shopper-visible store facts only. Never plans, costs, staff, orders or payment secrets. */
async function loadStoreFacts(tenantId: string): Promise<string[]> {
  return fetchWithCache(
    `ai-store-facts:${tenantId}`,
    async () => {
      const { data, error } = await db
        .from('delivery_options')
        .select('name, price, estimated_days')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('price', { ascending: true })
        .limit(10);
      if (error) throw error;
      return (data ?? []).map((d) => {
        const price = Number(d.price) === 0 ? 'free' : `₹${Number(d.price)}`;
        const eta = d.estimated_days ? `, ${d.estimated_days}` : '';
        return `${String(d.name).slice(0, 60)} (${price}${eta})`;
      });
    },
    120,
  );
}

async function storePayload(ctx: StoreToolContext, storeName: string) {
  return {
    store: { name: storeName.slice(0, 80) || 'this store', delivery_options: await loadStoreFacts(ctx.tenantId) },
    tools: toolManifest(),
  };
}

/**
 * Starts the assistant run on the AI service and returns its event stream. Failures to start (not configured,
 * unreachable) throw an ApiError here, before the controller has sent any streaming headers, so the shopper gets
 * a normal error response.
 */
export async function openStoreChat(opts: {
  ctx: StoreToolContext;
  storeName: string;
  history: ChatTurn[];
  signal: AbortSignal;
}): Promise<ReadableStream<Uint8Array>> {
  const [payload, toolToken] = await Promise.all([storePayload(opts.ctx, opts.storeName), signToolToken(opts.ctx)]);
  return aiStream('/v1/chat/stream', { ...payload, messages: opts.history, tool_token: toolToken }, opts.signal);
}

/**
 * Relays the AI service's server-sent events to the shopper, re-validating each one so only the four known event
 * shapes ever reach the browser. Always ends with exactly one `done` or `error`, even if the service dies midway.
 */
export async function relayChatEvents(stream: ReadableStream<Uint8Array>, send: (event: ChatEvent) => void, signal: AbortSignal): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finished = false;

  const forward = (block: string) => {
    if (finished || !block.startsWith('data: ')) return;
    let event: unknown;
    try {
      event = JSON.parse(block.slice(6));
    } catch {
      return;
    }
    const e = event as { type?: string; text?: unknown; name?: unknown; message?: unknown };
    if (e.type === 'delta' && typeof e.text === 'string') send({ type: 'delta', text: e.text });
    else if (e.type === 'tool' && typeof e.name === 'string') send({ type: 'tool', name: e.name.slice(0, 40) });
    else if (e.type === 'done') {
      finished = true;
      send({ type: 'done' });
    } else if (e.type === 'error') {
      finished = true;
      send({ type: 'error', message: typeof e.message === 'string' ? e.message : GENERIC_ERROR });
    }
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let end: number;
      while ((end = buffer.indexOf('\n\n')) !== -1) {
        forward(buffer.slice(0, end));
        buffer = buffer.slice(end + 2);
      }
    }
    if (buffer) forward(buffer.trim());
  } catch (error) {
    if (signal.aborted) return;
    console.error('[ai:store-chat] stream failed', (error as Error)?.name);
  } finally {
    reader.cancel().catch(() => undefined);
  }

  if (!finished && !signal.aborted) send({ type: 'error', message: GENERIC_ERROR });
}

/**
 * Creates a short-lived Realtime client secret for the browser to open a voice session with. The AI service pins
 * the session to this store's instructions and tool set; the browser cannot change either, and the long-lived
 * provider key never leaves the AI service.
 */
export async function createVoiceSession(ctx: StoreToolContext, storeName: string) {
  return aiJson<{ clientSecret: string; expiresAt: number | null; model: string }>(
    '/v1/voice/session',
    await storePayload(ctx, storeName),
    { kind: 'image' },
  );
}
