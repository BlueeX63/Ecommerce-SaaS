import { Router } from 'express';
import { limit } from '../lib/rate-limit.js';
import { requireMerchant } from '../middleware/auth.js';
import * as productsController from '../controllers/products.controller.js';

export const productsRouter = Router();
productsRouter.use(requireMerchant);

// AI Product Tools is a paid add-on.
productsRouter.post('/ai-assist', limit('ai-assist', 30, 60_000, (req) => req.merchant?.userId), productsController.aiAssist);

productsRouter.get('/', productsController.list);
productsRouter.get('/:id', productsController.getById);
productsRouter.post('/', productsController.create);
productsRouter.put('/:id', productsController.update);
productsRouter.delete('/:id', productsController.remove);
