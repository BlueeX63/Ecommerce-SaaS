import { Router } from 'express';
import { requireMerchant } from '../middleware/auth.js';
import * as ordersController from '../controllers/orders.controller.js';
import * as assignment from '../controllers/order-assignment.controller.js';

export const ordersRouter = Router();
ordersRouter.use(requireMerchant);

ordersRouter.get('/', ordersController.list);
ordersRouter.get('/summary', ordersController.summary);
ordersRouter.get('/:id', ordersController.getById);
ordersRouter.get('/:id/related', ordersController.relatedSummary);
ordersRouter.post('/', ordersController.create);
ordersRouter.put('/:id', ordersController.update);
ordersRouter.post('/:id/fulfillments', ordersController.createFulfillment);

// Which warehouse fulfils an order, and who is handling it.
ordersRouter.get('/:id/assignment', assignment.getAssignment);
ordersRouter.post('/:id/assign', assignment.assign);
ordersRouter.post('/:id/claim/clear', assignment.clearOrderClaim);
