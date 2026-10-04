import { Router } from 'express';
import { limit } from '../lib/rate-limit.js';
import { requireMerchant } from '../middleware/auth.js';
import * as webhooksController from '../controllers/webhooks.controller.js';

/**
 * Merchant-facing outbound webhook management. Only `order.created` is actually fired today (from
 * services/orders.ts); the rest of WEBHOOK_EVENT_TYPES exist so this UI won't need to change once they are.
 */
export const webhooksRouter = Router();
webhooksRouter.use(requireMerchant);

webhooksRouter.get('/', webhooksController.list);
webhooksRouter.post('/', limit('webhook-create', 20, 60 * 60_000, (req) => req.merchant?.userId), webhooksController.create);
webhooksRouter.patch('/:id', webhooksController.toggleActive);
webhooksRouter.delete('/:id', webhooksController.remove);
webhooksRouter.post('/:id/test', limit('webhook-test', 10, 60_000, (req) => req.merchant?.userId), webhooksController.sendTest);
