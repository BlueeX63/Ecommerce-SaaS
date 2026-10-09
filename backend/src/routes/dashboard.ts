import { Router } from 'express';
import { limit } from '../lib/rate-limit.js';
import { requireMerchant } from '../middleware/auth.js';
import * as dashboardController from '../controllers/dashboard.controller.js';
import * as supportController from '../controllers/support.controller.js';

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

// --- tax + delivery charge rules ---------------------------------------------------------------
dashboardRouter.get('/checkout-settings', dashboardController.getCheckoutSettingsHandler);
dashboardRouter.post('/checkout-settings', limit('settings', 60, 10 * 60_000, (req) => req.merchant?.userId), dashboardController.saveCheckoutSettings);

// --- support requests (AI-escalated order help) + refunds ------------------------------------------
dashboardRouter.get('/support/counts', supportController.counts);
dashboardRouter.get('/support-requests', supportController.listRequests);
dashboardRouter.post('/support-requests/:id/respond', limit('support-respond', 120, 10 * 60_000, (req) => req.merchant?.userId), supportController.respondToRequest);
dashboardRouter.get('/refunds', supportController.listRefunds);
dashboardRouter.post('/refunds/:id/action', limit('refund-action', 120, 10 * 60_000, (req) => req.merchant?.userId), supportController.actOnRefund);
dashboardRouter.patch('/orders/:id/shipping', supportController.updateShipping);

// --- notifications -----------------------------------------------------------------------------------
dashboardRouter.get('/notifications', dashboardController.listNotifications);
dashboardRouter.post('/notifications/read', dashboardController.markNotificationsRead);
