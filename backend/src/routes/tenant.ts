import { Router } from 'express';
import { limit } from '../lib/rate-limit.js';
import { requireMerchant } from '../middleware/auth.js';
import * as tenantController from '../controllers/tenant.controller.js';
import * as storeAdminController from '../controllers/store-admin.controller.js';

/** /api/v1/tenant/* */
export const tenantRouter = Router();
/** /api/v1/store/create and /api/v1/store/delete (merchant-side; shopper routes share the /store prefix). */
export const storeAdminRouter = Router();

tenantRouter.use(requireMerchant);
// NOTE: no router-level guard on storeAdminRouter - it shares the /store prefix with the public shopper routes.

tenantRouter.get('/me', tenantController.getMe);
tenantRouter.put('/me', limit('tenant-update', 30, 10 * 60_000, (req) => req.merchant?.userId), tenantController.updateMe);
tenantRouter.get('/metrics', tenantController.getMetrics);
tenantRouter.get('/analytics', tenantController.getAnalytics);
tenantRouter.post('/provision', limit('provision', 10, 60 * 60_000, (req) => req.merchant?.userId), tenantController.provision);

// --- Dashboard "create another store" -----------------------------------------------------------
storeAdminRouter.post('/create', requireMerchant, limit('store-create', 10, 60 * 60_000, (req) => req.merchant?.userId), storeAdminController.create);
storeAdminRouter.post('/delete', requireMerchant, storeAdminController.remove);
