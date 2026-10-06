import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { z } from 'zod';
import { env } from '../config/env.js';
import { db } from '../lib/supabase.js';
import { ApiError, badRequest, escapeLike, forbidden, notFound, pageMeta, pagination, parse, uuid } from '../lib/http.js';
import { fetchWithCache, kvDel, kvGet, kvSet } from '../lib/kv.js';
import { signToken, verifyToken } from '../lib/jwt.js';
import { createSession, revokeUserSessions } from '../lib/session.js';
import { getEntitlements, invalidateEntitlements } from '../services/entitlements.js';
import { decodePlanId, encodePlanId, FEATURE_ADDONS, isValidPlanTier, PLAN_TIERS } from '../services/plans.js';
import type { PlanTierId } from '../services/plans.js';
import { getAuditLog, listActivityPage, listRecentActivity, logSuperAdminAction } from '../services/super-admin-audit.js';

const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;

function actorEmail(req: Request): string {
  return req.superAdmin!.email;
}

// ---------------------------------------------------------------------------------------------
// Platform overview
// ---------------------------------------------------------------------------------------------

const OVERVIEW_CACHE_KEY = 'super-admin:overview';
const OVERVIEW_CACHE_TTL_SECONDS = 20;

/** Cleared after every curated action so an operator's own change never looks stale to them. */
async function invalidateOverviewCache() {
  await kvDel(OVERVIEW_CACHE_KEY);
}

async function computeOverview() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

  // All six reads are independent of one another - previously three of these ran in a second,
  // sequential round trip after the rest for no reason. One batch, one round trip.
  const [{ count: totalTenants }, { count: activeTenants }, { data: subs }, { data: orderTotals }, { count: totalCustomers }, { count: newTenants30d }, recentActivity] =
    await Promise.all([
      db.from('tenant').select('*', { count: 'exact', head: true }),
      db.from('tenant').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
      db.from('subscriptions').select('plan_id, status, created_date').eq('status', 'active'),
      db.from('orders').select('grand_total, status'),
      db.from('customers').select('*', { count: 'exact', head: true }),
      db.from('tenant').select('*', { count: 'exact', head: true }).gte('created_date', thirtyDaysAgo.toISOString()),
      listRecentActivity(20),
    ]);

  const planCounts: Record<string, number> = {};
  let mrr = 0;
  for (const sub of subs ?? []) {
    const { tier, featureFlags } = decodePlanId(sub.plan_id);
    if (!tier) continue;
    planCounts[tier] = (planCounts[tier] ?? 0) + 1;
    mrr += PLAN_TIERS[tier].priceMonthly;
    for (const flag of featureFlags) mrr += FEATURE_ADDONS[flag].priceMonthly;
  }

  const excluded = new Set(['CANCELLED', 'REFUNDED', 'RETURNED', 'RETURN_REQUESTED']);
  const totalGmv = (orderTotals ?? [])
    .filter((o) => !excluded.has(o.status))
    .reduce((sum, o) => sum + (Number(o.grand_total) || 0), 0);

  return {
    totalTenants: totalTenants ?? 0,
    activeTenants: activeTenants ?? 0,
    suspendedTenants: (totalTenants ?? 0) - (activeTenants ?? 0),
    totalCustomers: totalCustomers ?? 0,
    newTenantsLast30Days: newTenants30d ?? 0,
    activeSubscriptions: subs?.length ?? 0,
    planBreakdown: Object.entries(PLAN_TIERS).map(([id, tier]) => ({ id, name: tier.name, count: planCounts[id] ?? 0 })),
    estimatedMrr: mrr,
    totalGmv,
    recentActivity,
  };
}

export async function getOverview(_req: Request, res: Response) {
  const data = await fetchWithCache(OVERVIEW_CACHE_KEY, computeOverview, OVERVIEW_CACHE_TTL_SECONDS);
  res.json(data);
}

// ---------------------------------------------------------------------------------------------
// Tenant list
// ---------------------------------------------------------------------------------------------

export async function listTenants(req: Request, res: Response) {
  // Search is applied client-side against the fetched page, same as every other list page in this
  // codebase (orders/products/customers) - deliberately not server-side, so no user-controlled string
  // is ever interpolated into a PostgREST filter expression.
  const page = pagination(req.query, 25, 100);

  const { data: tenants, error, count } = await db
    .from('tenant')
    .select('tenant_id, tenant_name, code, status, custom_domain, created_by, created_date', { count: 'exact' })
    .order('created_date', { ascending: false })
    .range(page.offset, page.offset + page.limit - 1);
  if (error) throw error;

  const ownerIds = [...new Set((tenants ?? []).map((t) => t.created_by).filter(Boolean))] as string[];

  const [{ data: owners }, { data: allSubs }] = await Promise.all([
    ownerIds.length
      ? db.from('users').select('user_id, first_name, last_name, email, last_login, status').in('user_id', ownerIds)
      : Promise.resolve({ data: [] as any[] }),
    ownerIds.length
      ? db.from('subscriptions').select('user_id, plan_id, status, updated_date').in('user_id', ownerIds).order('updated_date', { ascending: false })
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const ownerById = new Map((owners ?? []).map((o) => [o.user_id, o]));
  const latestSubByUser = new Map<string, { plan_id: string; status: string; updated_date: string }>();
  for (const sub of allSubs ?? []) {
    if (!latestSubByUser.has(sub.user_id)) latestSubByUser.set(sub.user_id, sub);
  }

  const data = (tenants ?? []).map((t) => {
    const owner = t.created_by ? ownerById.get(t.created_by) : null;
    const sub = t.created_by ? latestSubByUser.get(t.created_by) : null;
    const { tier } = decodePlanId(sub?.plan_id);
    return {
      tenant_id: t.tenant_id,
      tenant_name: t.tenant_name,
      code: t.code,
      status: t.status,
      custom_domain: t.custom_domain,
      created_date: t.created_date,
      owner: owner ? { user_id: owner.user_id, name: `${owner.first_name} ${owner.last_name}`.trim(), email: owner.email, last_login: owner.last_login, status: owner.status } : null,
      plan: tier ? { id: tier, name: PLAN_TIERS[tier].name } : null,
      subscriptionStatus: sub?.status ?? null,
    };
  });

  res.json({ data, meta: pageMeta(count, page) });
}

// ---------------------------------------------------------------------------------------------
// Tenant detail
// ---------------------------------------------------------------------------------------------

export async function getTenantDetail(req: Request, res: Response) {
  const tenantId = uuid(req.params.id);

  // Stage 1: the tenant row itself and everything keyed only by tenantId (i.e. nothing here actually
  // needs tenant.created_by) run in ONE batch - the tenant fetch used to block all five of these for no
  // reason, adding a full extra round trip to every page load.
  const [{ data: tenant, error }, { data: teamUsers }, { count: productCount }, { count: customerCount }, { data: orderStats }, auditLog] =
    await Promise.all([
      db.from('tenant').select('*').eq('tenant_id', tenantId).maybeSingle(),
      db.from('users').select('user_id, first_name, last_name, email, status, last_login, created_date').eq('tenant_id', tenantId),
      db.from('products').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      db.from('customers').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      db.from('orders').select('grand_total, status').eq('tenant_id', tenantId),
      getAuditLog(tenantId),
    ]);
  if (error) throw error;
  if (!tenant) throw notFound('Store not found');

  // Stage 2: depends on tenant.created_by, so it can only start once stage 1 resolves - but the three
  // reads here are independent of EACH OTHER, so they still run as one batch rather than three.
  const [{ data: owner }, { data: subHistory }, entitlements] = await Promise.all([
    tenant.created_by ? db.from('users').select('user_id, first_name, last_name, email, last_login, created_date, status').eq('user_id', tenant.created_by).maybeSingle() : Promise.resolve({ data: null }),
    tenant.created_by ? db.from('subscriptions').select('*').eq('user_id', tenant.created_by).order('created_date', { ascending: false }) : Promise.resolve({ data: [] as any[] }),
    tenant.created_by ? getEntitlements(tenant.created_by) : Promise.resolve(null),
  ]);

  const excluded = new Set(['CANCELLED', 'REFUNDED', 'RETURNED', 'RETURN_REQUESTED']);
  const orders = orderStats ?? [];
  const revenue = orders.filter((o) => !excluded.has(o.status)).reduce((sum, o) => sum + (Number(o.grand_total) || 0), 0);

  // Live Stripe invoice history - the authoritative record of what the merchant has actually paid us.
  // Never persisted locally; fetched fresh, and failure here must not break the rest of the page.
  let payments: Array<{ id: string; amount: number; currency: string; status: string; date: string; description: string | null }> = [];
  const stripeCustomerId = subHistory?.[0]?.stripe_customer_id;
  if (stripe && stripeCustomerId) {
    try {
      const invoices = await stripe.invoices.list({ customer: stripeCustomerId, limit: 15 });
      payments = invoices.data.map((inv) => ({
        id: inv.id ?? '',
        amount: (inv.amount_paid ?? 0) / 100,
        currency: inv.currency,
        status: inv.status ?? 'unknown',
        date: inv.created ? new Date(inv.created * 1000).toISOString() : '',
        description: inv.description,
      }));
    } catch (err) {
      console.error('[super-admin] failed to fetch Stripe invoices', err);
    }
  }

  res.json({
    tenant,
    owner,
    entitlements,
    subscriptionHistory: (subHistory ?? []).map((s) => ({ ...s, decoded: decodePlanId(s.plan_id) })),
    payments,
    team: teamUsers ?? [],
    stats: { productCount: productCount ?? 0, customerCount: customerCount ?? 0, orderCount: orders.length, revenue },
    auditLog,
  });
}

// ---------------------------------------------------------------------------------------------
// Curated actions - every one is explicit, validated, and audit-logged. No generic table editor.
// ---------------------------------------------------------------------------------------------

async function requireTenant(tenantId: string) {
  const { data: tenant } = await db.from('tenant').select('tenant_id, created_by, status').eq('tenant_id', tenantId).maybeSingle();
  if (!tenant) throw notFound('Store not found');
  return tenant;
}

export async function suspendTenant(req: Request, res: Response) {
  const tenantId = uuid(req.params.id);
  const tenant = await requireTenant(tenantId);

  const { error } = await db.from('tenant').update({ status: 'SUSPENDED' }).eq('tenant_id', tenantId);
  if (error) throw error;

  if (tenant.created_by) await revokeUserSessions(tenant.created_by);

  await logSuperAdminAction(tenantId, actorEmail(req), 'SUSPEND_TENANT');
  res.json({ message: 'Store suspended. Its live storefront is now offline and the owner has been signed out.' });
}

export async function reactivateTenant(req: Request, res: Response) {
  const tenantId = uuid(req.params.id);
  await requireTenant(tenantId);

  const { error } = await db.from('tenant').update({ status: 'ACTIVE' }).eq('tenant_id', tenantId);
  if (error) throw error;

  await logSuperAdminAction(tenantId, actorEmail(req), 'REACTIVATE_TENANT');
  res.json({ message: 'Store reactivated.' });
}

const changePlanSchema = z.object({
  planTier: z.string().refine(isValidPlanTier, 'Unknown plan'),
  addons: z.array(z.string()).max(20).optional().default([]),
  status: z.enum(['active', 'past_due', 'canceled', 'incomplete']).optional().default('active'),
});

export async function changePlan(req: Request, res: Response) {
  const tenantId = uuid(req.params.id);
  const tenant = await requireTenant(tenantId);
  if (!tenant.created_by) throw badRequest('This store has no owner account to attach a subscription to');

  const body = parse(changePlanSchema, req.body);
  const encodedPlanId = encodePlanId(body.planTier as PlanTierId, body.addons);

  const { data: existing } = await db
    .from('subscriptions')
    .select('subscription_id')
    .eq('user_id', tenant.created_by)
    .order('created_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { error } = await db
      .from('subscriptions')
      .update({ plan_id: encodedPlanId, status: body.status, updated_date: new Date().toISOString() })
      .eq('subscription_id', existing.subscription_id);
    if (error) throw error;
  } else {
    const { error } = await db.from('subscriptions').insert({ user_id: tenant.created_by, plan_id: encodedPlanId, status: body.status });
    if (error) throw error;
  }

  await invalidateEntitlements(tenant.created_by);
  await logSuperAdminAction(tenantId, actorEmail(req), 'CHANGE_PLAN', { planTier: body.planTier, addons: body.addons, status: body.status });
  res.json({ message: 'Plan updated successfully' });
}

export async function revokeSessions(req: Request, res: Response) {
  const tenantId = uuid(req.params.id);
  const tenant = await requireTenant(tenantId);
  if (tenant.created_by) await revokeUserSessions(tenant.created_by);

  await logSuperAdminAction(tenantId, actorEmail(req), 'REVOKE_SESSIONS');
  res.json({ message: 'All sessions revoked for this store\'s owner.' });
}

export async function updateTeamMemberStatus(req: Request, res: Response) {
  const tenantId = uuid(req.params.id);
  const userId = uuid(req.params.userId, 'userId');
  const { status } = parse(z.object({ status: z.enum(['ACTIVE', 'INACTIVE']) }), req.body);

  const { data, error } = await db
    .from('users')
    .update({ status })
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .select('user_id')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound('User not found in this store');

  if (status === 'INACTIVE') await revokeUserSessions(userId);
  await logSuperAdminAction(tenantId, actorEmail(req), 'UPDATE_TEAM_MEMBER_STATUS', { userId, status });
  res.json({ message: 'User updated successfully' });
}

export async function deleteTenant(req: Request, res: Response) {
  const tenantId = uuid(req.params.id);
  const tenant = await requireTenant(tenantId);

  const { confirmCode } = parse(z.object({ confirmCode: z.string() }), req.body);
  if (confirmCode !== tenant.tenant_id.slice(0, 8)) {
    throw badRequest('Confirmation code does not match. Copy the code shown in the dialog exactly.');
  }

  // Unlink users first so ON DELETE CASCADE on users.tenant_id doesn't delete the accounts themselves.
  await db.from('users').update({ tenant_id: null }).eq('tenant_id', tenantId);
  const { error } = await db.from('tenant').delete().eq('tenant_id', tenantId);
  if (error) throw error;

  // Logged against the no-longer-existent tenant id is fine - it's still a valid, queryable record
  // until the row itself (and its cascaded tenant_settings) are gone; best-effort only past this point.
  await logSuperAdminAction(tenantId, actorEmail(req), 'DELETE_TENANT', { tenantName: tenant.tenant_id });
  res.json({ message: 'Store permanently deleted' });
}

// ---------------------------------------------------------------------------------------------
// Impersonation - issues a REAL merchant session for the store's owner. Every start is audit-logged
// against the tenant being entered; the frontend shows a persistent "return to Super Admin" banner for
// as long as the super-admin session cookie is also present.
// ---------------------------------------------------------------------------------------------

const IMPERSONATION_TICKET_TTL_SECONDS = 120;

interface ImpersonationTicketPayload {
  jti: string;
  tenantId: string;
  ownerId: string;
  superAdminEmail: string;
}

/**
 * The Super Admin panel is a separate app on its own origin (see lib/super-admin-session.ts), so it can
 * never set a cookie on the merchant dashboard's origin directly - cookies don't cross origins. Instead this
 * issues a short-lived, single-use ticket; the browser is redirected to the merchant dashboard's own origin,
 * which redeems it (via redeemImpersonationTicket below) and creates the real session there, same-origin.
 */
export async function impersonate(req: Request, res: Response) {
  const tenantId = uuid(req.params.id);
  const tenant = await requireTenant(tenantId);
  if (!tenant.created_by) throw badRequest('This store has no owner account to sign in as');

  const { data: owner } = await db.from('users').select('user_id, status').eq('user_id', tenant.created_by).maybeSingle();
  if (!owner) throw notFound('Store owner account not found');
  if (owner.status !== 'ACTIVE') throw forbidden('This account is disabled and cannot be signed into');

  const jti = randomUUID();
  const payload: ImpersonationTicketPayload = { jti, tenantId, ownerId: owner.user_id, superAdminEmail: actorEmail(req) };
  await kvSet(`impersonation-ticket:${jti}`, payload, IMPERSONATION_TICKET_TTL_SECONDS);
  const ticket = await signToken('impersonation-ticket', { ...payload }, `${IMPERSONATION_TICKET_TTL_SECONDS}s`);

  await logSuperAdminAction(tenantId, actorEmail(req), 'IMPERSONATE_START', { targetUserId: owner.user_id });

  const redeemUrl = `${env.FRONTEND_URL.replace(/\/$/, '')}/impersonate?ticket=${encodeURIComponent(ticket)}`;
  res.json({ redeemUrl });
}

/**
 * Called from the merchant dashboard's own origin (never from the Super Admin app) with the ticket from the
 * redirect above. Verifies the signature AND that the ticket hasn't already been redeemed, then creates a
 * real, normal merchant session exactly as a login would - same-origin, so the cookie lands correctly.
 */
export async function redeemImpersonationTicket(req: Request, res: Response) {
  const { ticket } = parse(z.object({ ticket: z.string().min(1).max(4096) }), req.body);

  const payload = await verifyToken<ImpersonationTicketPayload>('impersonation-ticket', ticket);
  if (!payload?.jti) throw badRequest('This sign-in link is invalid or has expired.');

  const stored = await kvGet<ImpersonationTicketPayload>(`impersonation-ticket:${payload.jti}`);
  if (!stored) throw badRequest('This sign-in link is invalid or has expired.');
  await kvDel(`impersonation-ticket:${payload.jti}`); // single use

  const { data: owner } = await db.from('users').select('user_id, status').eq('user_id', stored.ownerId).maybeSingle();
  if (!owner || owner.status !== 'ACTIVE') throw forbidden('This account can no longer be signed into');

  await createSession(res, {
    userId: owner.user_id,
    tenantId: stored.tenantId,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    impersonatedBy: stored.superAdminEmail,
  });

  res.json({ message: 'Signed in as store owner' });
}

// ---------------------------------------------------------------------------------------------
// Audit log - the full platform-wide trail (the Overview page only shows the most recent 20).
// ---------------------------------------------------------------------------------------------

export async function listAuditLog(req: Request, res: Response) {
  const page = pagination(req.query, 50, 200);
  const { data, total } = await listActivityPage(page.page, page.limit);

  const tenantIds = [...new Set(data.map((e) => e.tenantId))];
  const { data: tenants } = tenantIds.length
    ? await db.from('tenant').select('tenant_id, tenant_name, code').in('tenant_id', tenantIds)
    : { data: [] as Array<{ tenant_id: string; tenant_name: string; code: string }> };
  const tenantById = new Map((tenants ?? []).map((t) => [t.tenant_id, t]));

  res.json({
    data: data.map((entry) => ({ ...entry, tenant: tenantById.get(entry.tenantId) ?? null })),
    meta: pageMeta(total, page),
  });
}

// ---------------------------------------------------------------------------------------------
// Cross-tenant order lookup - read-only. For support: "a shopper quotes an order number or email,
// which store does it belong to and what's its status?" Search is either an order number substring or,
// when it looks like an email, a customer email - never a raw interpolated filter (see listTenants).
// ---------------------------------------------------------------------------------------------

export async function listOrders(req: Request, res: Response) {
  const page = pagination(req.query, 25, 100);
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

  let query = db
    .from('orders')
    .select(
      'order_id, order_number, status, payment_status, grand_total, created_date, tenant_id, customer_id, customers(first_name, last_name, email)',
      { count: 'exact' },
    );

  if (search) {
    if (search.includes('@')) {
      const { data: matchingCustomers } = await db.from('customers').select('customer_id').ilike('email', `%${escapeLike(search)}%`);
      const customerIds = (matchingCustomers ?? []).map((c) => c.customer_id);
      if (customerIds.length === 0) return void res.json({ data: [], meta: pageMeta(0, page) });
      query = query.in('customer_id', customerIds);
    } else {
      query = query.ilike('order_number', `%${escapeLike(search)}%`);
    }
  }

  const { data: orders, error, count } = await query.order('created_date', { ascending: false }).range(page.offset, page.offset + page.limit - 1);
  if (error) throw error;

  const tenantIds = [...new Set((orders ?? []).map((o) => o.tenant_id))];
  const { data: tenants } = tenantIds.length
    ? await db.from('tenant').select('tenant_id, tenant_name, code').in('tenant_id', tenantIds)
    : { data: [] as Array<{ tenant_id: string; tenant_name: string; code: string }> };
  const tenantById = new Map((tenants ?? []).map((t) => [t.tenant_id, t]));

  res.json({
    data: (orders ?? []).map((o) => ({ ...o, tenant: tenantById.get(o.tenant_id) ?? null })),
    meta: pageMeta(count, page),
  });
}

// ---------------------------------------------------------------------------------------------
// System status - which integrations are configured. Booleans only, never a secret value.
// ---------------------------------------------------------------------------------------------

export function getSystemStatus(_req: Request, res: Response) {
  res.json({
    environment: env.NODE_ENV,
    rootDomain: env.ROOT_DOMAIN ?? null,
    integrations: {
      stripe: Boolean(env.STRIPE_SECRET_KEY),
      stripeWebhook: Boolean(env.STRIPE_WEBHOOK_SECRET),
      redis: Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN),
      cloudinary: Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET),
      smtp: Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS),
      firebase: Boolean(env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY),
      ai: Boolean(env.ANTHROPIC_API_KEY && env.OPENAI_API_KEY),
    },
    devFlags: {
      allowDummyOtp: Boolean(env.ALLOW_DUMMY_OTP),
      allowMockSubscribe: Boolean(env.ALLOW_MOCK_SUBSCRIBE),
    },
  });
}
