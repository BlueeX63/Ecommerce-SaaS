import { Router } from 'express';
import { optionalShopper } from '../middleware/auth.js';
import * as publicController from '../controllers/public.controller.js';

/**
 * Read-only endpoints used by the Next.js server to render storefronts.
 * Mounted at /api/v1/public. Never returns internal fields (cost price, audit columns, tenant ids of products).
 */
export const publicRouter = Router();

publicRouter.get('/stores/:slug', publicController.getStore);
publicRouter.get('/stores/:slug/products', publicController.listStoreProducts);
publicRouter.get('/stores/:slug/products/:id', publicController.getStoreProduct);
publicRouter.get('/stores/:slug/catalogs/:catalogSlug', optionalShopper, publicController.getStoreCatalog);
