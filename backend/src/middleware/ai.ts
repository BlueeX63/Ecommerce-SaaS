import type { RequestHandler } from 'express';
import { ApiError } from '../lib/http.js';
import { tenantCtx } from './auth.js';
import { getEntitlements, getStoreEntitlements, hasFeature, upgradeMessage } from '../services/entitlements.js';

/** Merchant AI tools (product copy, product images) require the AI Product Tools add-on. */
export const requireAiTools: RequestHandler = async (req, _res, next) => {
  try {
    const { userId } = tenantCtx(req);
    const entitlements = await getEntitlements(userId);
    if (!hasFeature(entitlements, 'ai_tools')) {
      return next(new ApiError(403, upgradeMessage('ai_tools'), undefined, 'UPGRADE_REQUIRED'));
    }
    next();
  } catch (error) {
    next(error);
  }
};

/** Whether a store's owner has the AI add-on, which turns on the storefront assistant for that store. */
export async function assertStoreAiEnabled(tenantId: string): Promise<void> {
  const entitlements = await getStoreEntitlements(tenantId);
  if (!hasFeature(entitlements, 'ai_tools')) {
    throw new ApiError(403, 'The AI assistant is not enabled for this store.', undefined, 'FEATURE_NOT_ENABLED');
  }
}
