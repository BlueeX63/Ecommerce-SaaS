import { env } from '../../config/env.js';
import { ApiError } from '../../lib/http.js';

/**
 * Client for the separate AI microservice (`ai-service/`, Python + LangGraph). That service owns every provider
 * call and key; this API keeps authentication, plans, quotas and tenant data, and authenticates to the service
 * with a shared bearer token. Responses are mapped to the same ApiError shapes the old in-process code threw, so
 * routes and the frontend behave exactly as before.
 */

const GENERIC = 'The AI service is temporarily unavailable. Please try again.';

export const TIMEOUT = {
  json: 45_000,
  image: 150_000,
  stream: 90_000,
} as const;

export function aiConfigured(): boolean {
  return Boolean(env.AI_SERVICE_URL && env.AI_SERVICE_TOKEN);
}

function notConfigured(kind: 'text' | 'image'): ApiError {
  return new ApiError(
    503,
    kind === 'text' ? 'AI text features are not configured on this server.' : 'AI image and voice features are not configured on this server.',
  );
}

async function call(
  path: string,
  init: { method?: 'GET' | 'POST'; body?: string | Uint8Array; headers?: Record<string, string>; timeoutMs: number; signal?: AbortSignal },
  kind: 'text' | 'image',
): Promise<Response> {
  if (!aiConfigured()) throw notConfigured(kind);

  const timeout = AbortSignal.timeout(init.timeoutMs);
  let response: Response;
  try {
    response = await fetch(`${env.AI_SERVICE_URL!.replace(/\/+$/, '')}${path}`, {
      method: init.method ?? 'POST',
      headers: { Authorization: `Bearer ${env.AI_SERVICE_TOKEN}`, ...init.headers },
      body: init.body,
      signal: init.signal ? AbortSignal.any([init.signal, timeout]) : timeout,
    });
  } catch (error) {
    if (init.signal?.aborted) throw error;
    console.error(`[ai-service] ${path} unreachable`, (error as Error)?.name);
    throw new ApiError(502, GENERIC);
  }

  if (response.ok) return response;

  const detail = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
  console.error(`[ai-service] ${path} failed`, { status: response.status, code: detail?.error });
  if (response.status === 503 && detail?.message) throw new ApiError(503, detail.message);
  if ((response.status === 413 || response.status === 415) && detail?.message) throw new ApiError(400, detail.message);
  throw new ApiError(502, GENERIC);
}

/** POSTs JSON and returns the parsed JSON reply. */
export async function aiJson<T>(
  path: string,
  body: unknown,
  opts: { signal?: AbortSignal; timeoutMs?: number; kind?: 'text' | 'image' } = {},
): Promise<T> {
  const response = await call(
    path,
    { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' }, timeoutMs: opts.timeoutMs ?? TIMEOUT.json, signal: opts.signal },
    opts.kind ?? 'text',
  );
  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError(502, GENERIC);
  }
}

/** POSTs JSON (or raw image bytes) and returns the PNG the service generated. */
export async function aiImage(path: string, body: unknown | { bytes: Buffer; type: string }): Promise<Buffer> {
  const raw = body as { bytes?: Buffer; type?: string };
  const isBytes = Buffer.isBuffer(raw?.bytes) && typeof raw.type === 'string';
  const response = await call(
    path,
    {
      body: isBytes ? new Uint8Array(raw.bytes!) : JSON.stringify(body),
      headers: { 'Content-Type': isBytes ? raw.type! : 'application/json' },
      timeoutMs: TIMEOUT.image,
    },
    'image',
  );
  const png = Buffer.from(await response.arrayBuffer());
  if (!png.length) throw new ApiError(502, GENERIC);
  return png;
}

/** Opens the assistant's SSE stream. Throws an ApiError (503/502) before any bytes are streamed if it cannot. */
export async function aiStream(path: string, body: unknown, signal: AbortSignal): Promise<ReadableStream<Uint8Array>> {
  const response = await call(
    path,
    { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' }, timeoutMs: TIMEOUT.stream, signal },
    'text',
  );
  if (!response.body) throw new ApiError(502, GENERIC);
  return response.body;
}

/** Which providers the AI service has keys for (booleans only). Used by the Super Admin system page. */
export async function aiStatus(): Promise<{ reachable: boolean; text: boolean; image: boolean; voice: boolean }> {
  const off = { reachable: false, text: false, image: false, voice: false };
  if (!aiConfigured()) return off;
  try {
    const response = await call('/v1/status', { method: 'GET', timeoutMs: 3_000 }, 'text');
    const body = (await response.json()) as { text?: boolean; image?: boolean; voice?: boolean };
    return { reachable: true, text: !!body.text, image: !!body.image, voice: !!body.voice };
  } catch {
    return off;
  }
}
