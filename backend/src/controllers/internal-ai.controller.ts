import type { Request, Response } from 'express';
import { ApiError } from '../lib/http.js';
import { runStoreTool } from '../services/ai/store-tools.js';
import { verifyToolToken } from '../services/ai/tool-token.js';

const TOOL_NAME = /^[a-z_]{1,40}$/;

/**
 * Runs one store tool for the AI service. The store and shopper come from the signed token the backend issued for
 * this assistant request, never from the body, so the AI service cannot act on any other store or shopper. The
 * tool allowlist, input validation and shopper-safe output are the same as for the voice agent's route.
 */
export async function runTool(req: Request, res: Response) {
  const header = req.get('authorization') ?? '';
  const ctx = await verifyToolToken(header.startsWith('Bearer ') ? header.slice(7).trim() : undefined);
  if (!ctx) throw new ApiError(401, 'Unauthorized');

  const name = String(req.params.name);
  if (!TOOL_NAME.test(name)) throw new ApiError(404, 'Unknown action');

  res.setHeader('Cache-Control', 'no-store');
  res.json(await runStoreTool(ctx, name, req.body ?? {}));
}
