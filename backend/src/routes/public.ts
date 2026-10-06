import { Router } from 'express';
import { optionalShopper } from '../middleware/auth.js';
import { limit } from '../lib/rate-limit.js';
import * as publicController from '../controllers/public.controller.js';
import * as storeAiController from '../controllers/store-ai.controller.js';

/**
 * Read-only endpoints used by the Next.js server to render storefronts.
 * Mounted at /api/v1/public. Never returns internal fields (cost price, audit columns, tenant ids of products).
 */
export const publicRouter = Router();

publicRouter.get('/stores/:slug', publicController.getStore);
publicRouter.get('/stores/:slug/products', publicController.listStoreProducts);
publicRouter.get('/stores/:slug/products/:id', publicController.getStoreProduct);
publicRouter.get('/stores/:slug/catalogs/:catalogSlug', optionalShopper, publicController.getStoreCatalog);

// Storefront AI assistant (add-on owned by the store). Chat streams text; the voice agent mints a session token
// and executes its tool calls through /tools, which runs the same allowlisted actions as the chat.
publicRouter.post('/stores/:slug/ai/chat', optionalShopper, limit('store-ai-chat', 20, 60_000), storeAiController.chat);
publicRouter.post('/stores/:slug/ai/voice-session', limit('store-ai-voice', 6, 60_000), storeAiController.voiceSession);
publicRouter.post('/stores/:slug/ai/tools/:name', optionalShopper, limit('store-ai-tools', 60, 60_000), storeAiController.tool);
