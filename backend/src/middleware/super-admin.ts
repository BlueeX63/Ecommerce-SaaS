import type { RequestHandler } from 'express';
import { unauthorized } from '../lib/http.js';
import { getSuperAdminSession } from '../lib/super-admin-session.js';

/** Requires a valid super admin session. Entirely separate identity from requireMerchant/requireShopper. */
export const requireSuperAdmin: RequestHandler = async (req, _res, next) => {
  const session = await getSuperAdminSession(req);
  if (!session) return next(unauthorized());
  req.superAdmin = session;
  next();
};
