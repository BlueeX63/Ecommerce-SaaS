import { Router } from 'express';
import { limit } from '../lib/rate-limit.js';
import { requireMerchant } from '../middleware/auth.js';
import { requireAiTools } from '../middleware/ai.js';
import * as aiController from '../controllers/ai.controller.js';

/** Merchant-side AI tools. Every route requires the AI Product Tools add-on. */
export const aiRouter = Router();

aiRouter.use(requireMerchant, requireAiTools);

const byMerchant = (req: { merchant?: { userId: string } }) => req.merchant?.userId;

aiRouter.post('/product-listing', limit('ai-listing', 30, 60_000, byMerchant), aiController.productListing);
aiRouter.post('/product-image/generate', limit('ai-image', 10, 60_000, byMerchant), aiController.generateImage);
aiRouter.post('/product-image/clean', limit('ai-image', 10, 60_000, byMerchant), aiController.cleanImage);
