import { Router } from 'express';
import { limit } from '../lib/rate-limit.js';
import { requireSuperAdmin } from '../middleware/super-admin.js';
import * as authController from '../controllers/super-admin-auth.controller.js';
import * as superAdminController from '../controllers/super-admin.controller.js';

export const superAdminRouter = Router();

// --- Auth (no requireSuperAdmin - these ARE the login flow) ---------------------------------------
superAdminRouter.post('/auth/login', limit('super-admin-login-ip', 10, 15 * 60_000), authController.login);
superAdminRouter.post('/auth/logout', authController.logout);
superAdminRouter.get('/auth/session', authController.getCurrentSession);

// --- Impersonation ticket redemption - called from the MERCHANT dashboard's own origin, which has no
// super admin session at all. The single-use, 2-minute ticket itself is the authentication. ------------
superAdminRouter.post(
  '/impersonate/redeem',
  limit('super-admin-impersonate-redeem', 20, 10 * 60_000),
  superAdminController.redeemImpersonationTicket,
);

// --- Everything below requires a valid super admin session ----------------------------------------
superAdminRouter.use(requireSuperAdmin);

superAdminRouter.get('/overview', superAdminController.getOverview);
superAdminRouter.get('/audit-log', superAdminController.listAuditLog);
superAdminRouter.get('/orders', superAdminController.listOrders);
superAdminRouter.get('/system-status', superAdminController.getSystemStatus);

superAdminRouter.get('/tenants', superAdminController.listTenants);
superAdminRouter.get('/tenants/:id', superAdminController.getTenantDetail);
superAdminRouter.post('/tenants/:id/suspend', superAdminController.suspendTenant);
superAdminRouter.post('/tenants/:id/reactivate', superAdminController.reactivateTenant);
superAdminRouter.post('/tenants/:id/plan', superAdminController.changePlan);
superAdminRouter.post('/tenants/:id/revoke-sessions', superAdminController.revokeSessions);
superAdminRouter.patch('/tenants/:id/team/:userId', superAdminController.updateTeamMemberStatus);
superAdminRouter.post('/tenants/:id/delete', superAdminController.deleteTenant);
superAdminRouter.post(
  '/tenants/:id/impersonate',
  limit('super-admin-impersonate', 30, 60 * 60_000, (req) => req.superAdmin?.email),
  superAdminController.impersonate,
);
