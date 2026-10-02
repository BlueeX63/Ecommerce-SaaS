import type { Request, RequestHandler } from 'express';
import { db } from '../lib/supabase.js';
import { forbidden, unauthorized } from '../lib/http.js';
import { getSession } from '../lib/session.js';
import { readShopperSession } from '../lib/store-session.js';

/** Requires a valid merchant (dashboard) session. */
export const requireMerchant: RequestHandler = async (req, _res, next) => {
  const session = await getSession(req);
  if (!session) return next(unauthorized());
  req.merchant = session;
  next();
};

/** Returns the merchant context, guaranteeing an active store is selected. */
export function tenantCtx(req: Request): { userId: string; tenantId: string; sessionId: string } {
  const session = req.merchant;
  if (!session) throw unauthorized();
  if (!session.tenantId) throw forbidden('No active store selected');
  return { userId: session.userId, tenantId: session.tenantId, sessionId: session.sessionId };
}

/** Only the store creator may perform this action. */
export async function assertTenantOwner(tenantId: string, userId: string) {
  const { data } = await db.from('tenant').select('created_by').eq('tenant_id', tenantId).maybeSingle();
  if (!data || data.created_by !== userId) throw forbidden('Only the store owner can perform this action');
}

async function loadShopper(req: Request) {
  const session = await readShopperSession(req);
  if (!session) return null;

  const { data: customer } = await db
    .from('customers')
    .select('customer_id, first_name, last_name, phone_number, email, status')
    .eq('customer_id', session.customerId)
    .eq('tenant_id', session.tenantId)
    .maybeSingle();

  if (!customer || (customer.status && customer.status !== 'ACTIVE')) return null;

  const { status: _status, ...safeCustomer } = customer;
  return { ...session, customer: safeCustomer };
}

/** Requires a valid shopper (storefront) session for an active customer. */
export const requireShopper: RequestHandler = async (req, _res, next) => {
  const shopper = await loadShopper(req);
  if (!shopper) return next(unauthorized());
  req.shopper = shopper;
  next();
};

/** Attaches the shopper if one is logged in, but never rejects. */
export const optionalShopper: RequestHandler = async (req, _res, next) => {
  const shopper = await loadShopper(req);
  if (shopper) req.shopper = shopper;
  next();
};
