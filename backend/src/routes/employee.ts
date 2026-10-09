import { Router } from 'express';
import { limit } from '../lib/rate-limit.js';
import { requireEmployee } from '../middleware/employee.js';
import * as employee from '../controllers/employee.controller.js';

/** /api/v1/employee/* - the warehouse employee panel. Entirely separate identity from merchants and shoppers. */
export const employeeRouter = Router();

employeeRouter.post('/auth/login', limit('employee-login-ip', 20, 15 * 60_000), employee.login);
employeeRouter.post('/auth/logout', employee.logout);

employeeRouter.use(requireEmployee);

employeeRouter.get('/auth/session', employee.session);
employeeRouter.get('/overview', employee.overview);
employeeRouter.get('/products', employee.listProducts);
employeeRouter.post('/stock', limit('employee-stock', 120, 10 * 60_000, (req) => req.employee?.employeeId), employee.updateStock);
employeeRouter.patch('/warehouse', employee.updateWarehouse);
employeeRouter.get('/orders', employee.listOrders);
employeeRouter.patch('/orders/:id', limit('employee-order', 200, 10 * 60_000, (req) => req.employee?.employeeId), employee.updateOrderStatus);
