import { Router } from 'express';
import { requireMerchant } from '../middleware/auth.js';
import * as warehousesController from '../controllers/warehouses.controller.js';
import * as inventoryController from '../controllers/inventory.controller.js';

export const warehousesRouter = Router();
export const inventoryRouter = Router();
warehousesRouter.use(requireMerchant);
inventoryRouter.use(requireMerchant);

warehousesRouter.get('/', warehousesController.list);
warehousesRouter.post('/', warehousesController.create);
warehousesRouter.put('/:id', warehousesController.update);

inventoryRouter.get('/', inventoryController.list);
inventoryRouter.post('/', inventoryController.adjust);
