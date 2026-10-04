import { Router } from 'express';
import { limit } from '../lib/rate-limit.js';
import { requireMerchant } from '../middleware/auth.js';
import * as dashboardController from '../controllers/dashboard.controller.js';

export const dashboardRouter = Router();
dashboardRouter.use(requireMerchant);

dashboardRouter.get('/settings', dashboardController.getSettings);
dashboardRouter.post('/settings', limit('settings', 60, 10 * 60_000, (req) => req.merchant?.userId), dashboardController.saveSettings);

// --- delivery options ---------------------------------------------------------------------------
dashboardRouter.get('/delivery-options', dashboardController.listDeliveryOptions);
dashboardRouter.post('/delivery-options', dashboardController.createDeliveryOption);
dashboardRouter.patch('/delivery-options/:id', dashboardController.updateDeliveryOption);
dashboardRouter.delete('/delivery-options/:id', dashboardController.removeDeliveryOption);

// --- payment methods (manual/display-only, no gateway) -----------------------------------------
dashboardRouter.get('/payment-methods', dashboardController.getPaymentMethods);
dashboardRouter.post('/payment-methods', limit('settings', 60, 10 * 60_000, (req) => req.merchant?.userId), dashboardController.savePaymentMethods);
