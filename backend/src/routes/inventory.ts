import { Router } from 'express';
import { requireMerchant } from '../middleware/auth.js';
import * as warehousesController from '../controllers/warehouses.controller.js';
import * as inventoryController from '../controllers/inventory.controller.js';
import * as teamController from '../controllers/warehouse-team.controller.js';
import * as activityController from '../controllers/warehouse-activity.controller.js';

export const warehousesRouter = Router();
export const inventoryRouter = Router();
warehousesRouter.use(requireMerchant);
inventoryRouter.use(requireMerchant);

warehousesRouter.get('/', warehousesController.list);
// Monitoring: what employees changed (registered before the :id routes).
warehousesRouter.get('/activity', activityController.activity);
warehousesRouter.get('/activity/summary', activityController.summary);
warehousesRouter.post('/', warehousesController.create);
warehousesRouter.put('/:id', warehousesController.update);
warehousesRouter.get('/:id/employees', teamController.listEmployees);
warehousesRouter.post('/:id/employees', teamController.createEmployee);
warehousesRouter.patch('/:id/employees/:employeeId', teamController.updateEmployee);
warehousesRouter.delete('/:id/employees/:employeeId', teamController.removeEmployee);
warehousesRouter.get('/:id/routes', teamController.listRoutes);
warehousesRouter.put('/:id/routes', teamController.saveRoutes);

inventoryRouter.get('/', inventoryController.list);
inventoryRouter.get('/history', activityController.stockHistory);
inventoryRouter.post('/', inventoryController.adjust);
