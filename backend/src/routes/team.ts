import { Router } from 'express';
import { limit } from '../lib/rate-limit.js';
import { requireMerchant } from '../middleware/auth.js';
import * as usersController from '../controllers/users.controller.js';
import * as rolesController from '../controllers/roles.controller.js';

export const usersRouter = Router();
export const rolesRouter = Router();
usersRouter.use(requireMerchant);
rolesRouter.use(requireMerchant);

usersRouter.get('/', usersController.list);

// --- Invitations - registered before '/:id' so 'invites' is never matched as a user id ---------
usersRouter.get('/invites', usersController.listInvites);
usersRouter.post('/invites', limit('team-invite', 20, 60 * 60_000, (req) => req.merchant?.userId), usersController.createInvite);
usersRouter.delete('/invites/:jti', usersController.revokeInvite);

usersRouter.get('/:id', usersController.getById);
usersRouter.put('/:id', usersController.update);
usersRouter.put('/:id/role', usersController.updateRole);
usersRouter.delete('/:id', usersController.remove);

// ---------------------------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------------------------

rolesRouter.get('/', rolesController.list);
rolesRouter.post('/', rolesController.create);

// Registered before '/:id' so 'permissions' is never matched as a role id.
rolesRouter.get('/permissions', rolesController.listPermissions);

rolesRouter.get('/:id', rolesController.getById);
rolesRouter.put('/:id', rolesController.update);
rolesRouter.delete('/:id', rolesController.remove);
