import { Router } from 'express';
import { requireMerchant } from '../middleware/auth.js';
import * as categoriesController from '../controllers/categories.controller.js';

export const categoriesRouter = Router();
categoriesRouter.use(requireMerchant);

categoriesRouter.get('/', categoriesController.list);
categoriesRouter.post('/', categoriesController.create);
