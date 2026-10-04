import { Router, raw } from 'express';
import { limit } from '../lib/rate-limit.js';
import { requireMerchant } from '../middleware/auth.js';
import * as billingController from '../controllers/billing.controller.js';

// ---------------------------------------------------------------------------------------------
// Plan catalog   GET /api/v1/billing/plans   (public: pricing must be visible before login)
// ---------------------------------------------------------------------------------------------
export const billingV1Router = Router();
billingV1Router.get('/plans', billingController.listPlans);
billingV1Router.post('/confirm', requireMerchant, limit('billing-confirm', 20, 10 * 60_000), billingController.confirmCheckout);

// ---------------------------------------------------------------------------------------------
// Merchant subscription checkout   POST /api/checkout
// ---------------------------------------------------------------------------------------------
export const billingRouter = Router();
billingRouter.post('/checkout', requireMerchant, limit('checkout', 10, 10 * 60_000), billingController.checkout);

// ---------------------------------------------------------------------------------------------
// Stripe webhook   POST /api/webhooks/stripe   (signature verified, raw body required)
// ---------------------------------------------------------------------------------------------
export const webhookRouter = Router();
webhookRouter.post('/stripe', raw({ type: 'application/json', limit: '1mb' }), billingController.stripeWebhook);

/** DEV ONLY (ALLOW_MOCK_SUBSCRIBE=true, never in production): activates a fake yearly subscription. */
export const devBillingRouter = Router();
devBillingRouter.post('/mock-subscribe', requireMerchant, billingController.mockSubscribe);
