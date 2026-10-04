import { Router } from 'express';
import { requireMerchant } from '../middleware/auth.js';
import * as invoicesController from '../controllers/invoices.controller.js';
import * as paymentsController from '../controllers/payments.controller.js';

export const invoicesRouter = Router();
export const paymentsRouter = Router();
invoicesRouter.use(requireMerchant);
paymentsRouter.use(requireMerchant);

invoicesRouter.get('/', invoicesController.list);
invoicesRouter.post('/', invoicesController.create);
invoicesRouter.get('/:id', invoicesController.getById);
invoicesRouter.put('/:id', invoicesController.update);

paymentsRouter.get('/', paymentsController.list);
paymentsRouter.post('/', paymentsController.create);
