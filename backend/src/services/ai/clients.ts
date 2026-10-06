import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { env } from '../../config/env.js';
import { ApiError } from '../../lib/http.js';

/**
 * Lazily-created provider clients. They are only built when a key is configured, so the API still boots (and
 * every other feature keeps working) on a machine without AI credentials. Keys are read from the server
 * environment only and are never returned to the browser.
 */
let anthropic: Anthropic | null = null;
let openai: OpenAI | null = null;

export function textClient(): Anthropic {
  if (!env.ANTHROPIC_API_KEY) throw new ApiError(503, 'AI text features are not configured on this server.');
  anthropic ??= new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, timeout: 30_000, maxRetries: 2 });
  return anthropic;
}

export function openaiClient(): OpenAI {
  if (!env.OPENAI_API_KEY) throw new ApiError(503, 'AI image and voice features are not configured on this server.');
  openai ??= new OpenAI({ apiKey: env.OPENAI_API_KEY, timeout: 120_000, maxRetries: 2 });
  return openai;
}

/** Logs a provider failure without leaking request content or keys, then returns a safe, generic error. */
export function providerFailure(scope: string, error: unknown): ApiError {
  const status = typeof (error as { status?: unknown })?.status === 'number' ? (error as { status: number }).status : undefined;
  console.error(`[ai:${scope}] provider error`, { status, name: (error as Error)?.name });
  return new ApiError(502, 'The AI service is temporarily unavailable. Please try again.');
}
