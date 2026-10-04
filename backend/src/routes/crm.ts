import { Router } from 'express';
import { requireMerchant } from '../middleware/auth.js';
import * as customersController from '../controllers/customers.controller.js';
import * as dealersController from '../controllers/dealers.controller.js';

export const customersRouter = Router();
export const dealersRouter = Router();
customersRouter.use(requireMerchant);
dealersRouter.use(requireMerchant);

customersRouter.get('/', customersController.list);
customersRouter.post('/', customersController.create);
customersRouter.put('/:id', customersController.update);
customersRouter.delete('/:id', customersController.remove);

dealersRouter.get('/', dealersController.list);
dealersRouter.post('/', dealersController.create);
dealersRouter.put('/:id', dealersController.update);
dealersRouter.delete('/:id', dealersController.remove);
