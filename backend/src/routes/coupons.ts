import { Router } from 'express';
import { limit } from '../lib/rate-limit.js';
import { requireMerchant } from '../middleware/auth.js';
import * as couponsController from '../controllers/coupons.controller.js';

export const couponsRouter = Router();

// --- public (legacy) validation: POST /api/v1/coupons/validate --------------------------------------
couponsRouter.post('/validate', limit('coupon-validate', 20, 60_000), couponsController.validate);

// --- merchant management -------------------------------------------------------------------------
couponsRouter.get('/', requireMerchant, couponsController.list);
couponsRouter.post('/', requireMerchant, couponsController.create);
couponsRouter.patch('/:id', requireMerchant, couponsController.update);
couponsRouter.delete('/:id', requireMerchant, couponsController.remove);
