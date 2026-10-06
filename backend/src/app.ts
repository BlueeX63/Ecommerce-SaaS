import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './lib/http.js';
import { csrfGuard, noStore } from './middleware/security.js';
import { aiRouter } from './routes/ai.js';
import { apiKeysRouter } from './routes/api-keys.js';
import { authRouter } from './routes/auth.js';
import { billingRouter, billingV1Router, devBillingRouter, webhookRouter } from './routes/billing.js';
import { catalogsRouter } from './routes/catalogs.js';
import { categoriesRouter } from './routes/categories.js';
import { couponsRouter } from './routes/coupons.js';
import { customersRouter, dealersRouter } from './routes/crm.js';
import { dashboardRouter } from './routes/dashboard.js';
import { invoicesRouter, paymentsRouter } from './routes/finance.js';
import { inventoryRouter, warehousesRouter } from './routes/inventory.js';
import { oauthRouter } from './routes/oauth.js';
import { ordersRouter } from './routes/orders.js';
import { productsRouter } from './routes/products.js';
import { publicRouter } from './routes/public.js';
import { reviewsRouter, storeRouter } from './routes/store.js';
import { storeAuthRouter } from './routes/store-auth.js';
import { rolesRouter, usersRouter } from './routes/team.js';
import { superAdminRouter } from './routes/super-admin.js';
import { storeAdminRouter, tenantRouter } from './routes/tenant.js';
import { uploadRouter } from './routes/upload.js';
import { webhooksRouter } from './routes/webhooks.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  // The Next.js server (and any load balancer in front of it) are trusted proxies; req.ip is the real client.
  app.set('trust proxy', env.TRUST_PROXY_HOPS);

  app.use(helmet());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Stripe needs the untouched raw body for signature verification, so it is mounted before the JSON parser.
  app.use('/api/webhooks', webhookRouter);

  app.use(cookieParser());
  app.use(express.json({ limit: '2mb' }));
  app.use('/api', noStore, csrfGuard);

  // Auth & billing
  app.use('/api/auth', oauthRouter);
  app.use('/api', billingRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/billing', billingV1Router);
  if (env.ALLOW_MOCK_SUBSCRIBE) {
    console.warn('[security] ALLOW_MOCK_SUBSCRIBE is enabled - the fake subscription endpoint is exposed (dev only).');
    app.use('/api/v1', devBillingRouter);
  }

  // Merchant dashboard
  app.use('/api/v1/tenant', tenantRouter);
  app.use('/api/v1/dashboard', dashboardRouter);
  app.use('/api/v1/products', productsRouter);
  app.use('/api/v1/ai', aiRouter);
  app.use('/api/v1/categories', categoriesRouter);
  app.use('/api/v1/catalogs', catalogsRouter);
  app.use('/api/v1/coupons', couponsRouter);
  app.use('/api/v1/customers', customersRouter);
  app.use('/api/v1/dealers', dealersRouter);
  app.use('/api/v1/orders', ordersRouter);
  app.use('/api/v1/invoices', invoicesRouter);
  app.use('/api/v1/payments', paymentsRouter);
  app.use('/api/v1/warehouses', warehousesRouter);
  app.use('/api/v1/inventory', inventoryRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/roles', rolesRouter);
  app.use('/api/v1/upload', uploadRouter);
  app.use('/api/v1/api-keys', apiKeysRouter);
  app.use('/api/v1/webhooks', webhooksRouter);

  // Storefront (shoppers)
  app.use('/api/v1/store/auth', storeAuthRouter);
  app.use('/api/v1/store', storeAdminRouter);
  app.use('/api/v1/store', storeRouter);
  app.use('/api/v1/reviews', reviewsRouter);
  app.use('/api/v1/public', publicRouter);

  // Super Admin (platform operators) - entirely separate identity from merchants/shoppers above.
  app.use('/api/v1/super-admin', superAdminRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
