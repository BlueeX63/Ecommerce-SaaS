import { Router } from 'express';
import { requireMerchant } from '../middleware/auth.js';
import * as ordersController from '../controllers/orders.controller.js';

export const ordersRouter = Router();
ordersRouter.use(requireMerchant);

ordersRouter.get('/', ordersController.list);
ordersRouter.get('/:id', ordersController.getById);
ordersRouter.post('/', ordersController.create);
ordersRouter.put('/:id', ordersController.update);
ordersRouter.post('/:id/fulfillments', ordersController.createFulfillment);
