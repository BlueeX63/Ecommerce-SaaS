import { Router } from 'express';
import { requireMerchant } from '../middleware/auth.js';
import * as productsController from '../controllers/products.controller.js';

export const productsRouter = Router();
productsRouter.use(requireMerchant);

productsRouter.get('/', productsController.list);
productsRouter.get('/:id', productsController.getById);
productsRouter.post('/', productsController.create);
productsRouter.put('/:id', productsController.update);
productsRouter.patch('/:id', productsController.update);
productsRouter.delete('/:id', productsController.remove);
