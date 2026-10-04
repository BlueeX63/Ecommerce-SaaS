import { Router } from 'express';
import { requireMerchant } from '../middleware/auth.js';
import * as catalogsController from '../controllers/catalogs.controller.js';

export const catalogsRouter = Router();
catalogsRouter.use(requireMerchant);

catalogsRouter.get('/', catalogsController.list);
catalogsRouter.post('/', catalogsController.create);
catalogsRouter.delete('/:id', catalogsController.remove);

// --- products in a catalog (with optional negotiated prices) ---------------------------------------
catalogsRouter.get('/:id/products', catalogsController.listProducts);
catalogsRouter.post('/:id/products', catalogsController.addProduct);

// --- customers allowed into a SPECIAL catalog ------------------------------------------------------
catalogsRouter.get('/:id/customers', catalogsController.listCustomers);
catalogsRouter.post('/:id/customers', catalogsController.addCustomer);
