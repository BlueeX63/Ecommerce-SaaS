import type { Request, Response } from 'express';
import { db } from '../lib/supabase.js';
import { ApiError, pageMeta, pagination, uuid } from '../lib/http.js';
import { fetchWithCache, kvDel } from '../lib/kv.js';
import { revokeUserSessions } from '../lib/session.js';
import { decodePlanId, PLAN_TIERS } from '../services/plans.js';
import { logSuperAdminAction } from '../services/super-admin-audit.js';

/**
 * Super Admin view of every merchant account (rows in `users`): who they are, how many stores they own, which
 * plan they are on, and whether they can sign in. Strictly read-only except for the three account actions at
 * the bottom, and no password hash or other secret is ever selected here.
 */

const INDEX_KEY = 'super-admin:merchant-index';
const INDEX_TTL_SECONDS = 60;

export interface MerchantRow {
  user_id: string;
  name: string;
  email: string;
  status: string;
  email_verified: boolean;
  last_login: string | null;
  joined_at: string;
  store_count: number;
  plan: { id: string; name: string } | null;
  subscription_status: string | null;
}

/**
 * The full merchant list, derived from three queries and cached briefly. Search and pagination run over this
 * in memory, so searching finds a merchant on any page and a page costs no database work.
 */
async function buildMerchantIndex(): Promise<MerchantRow[]> {
  const [{ data: users, error: usersError }, { data: tenants, error: tenantsError }, { data: subs, error: subsError }] =
    await Promise.all([
      db
        .from('users')
        .select('user_id, first_name, last_name, email, status, email_verified, last_login, created_date')
        .order('created_date', { ascending: false })
        .limit(5000),
      db.from('tenant').select('created_by').not('created_by', 'is', null).limit(20000),
      db.from('subscriptions').select('user_id, plan_id, status, updated_date').order('updated_date', { ascending: false }).limit(20000),
    ]);
  if (usersError) throw usersError;
  if (tenantsError) throw tenantsError;
  if (subsError) throw subsError;

  const storeCount = new Map<string, number>();
  for (const t of tenants ?? []) storeCount.set(t.created_by, (storeCount.get(t.created_by) ?? 0) + 1);

  // Subscriptions are ordered newest-first, so the first row per user is their current one.
  const latestSub = new Map<string, { plan_id: string; status: string }>();
  for (const s of subs ?? []) if (!latestSub.has(s.user_id)) latestSub.set(s.user_id, s);

  return (users ?? []).map((u) => {
    const sub = latestSub.get(u.user_id);
    const { tier } = decodePlanId(sub?.plan_id);
    return {
      user_id: u.user_id,
      name: `${u.first_name} ${u.last_name}`.trim(),
      email: u.email,
      status: u.status,
      email_verified: !!u.email_verified,
      last_login: u.last_login,
      joined_at: u.created_date,
      store_count: storeCount.get(u.user_id) ?? 0,
      plan: tier ? { id: tier, name: PLAN_TIERS[tier].name } : null,
      subscription_status: sub?.status ?? null,
    };
  });
}

function loadIndex(): Promise<MerchantRow[]> {
  return fetchWithCache(INDEX_KEY, buildMerchantIndex, INDEX_TTL_SECONDS);
}

export async function listMerchants(req: Request, res: Response) {
  const page = pagination(req.query, 25, 100);
  const rawSearch = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase().slice(0, 100) : '';

  const index = await loadIndex();
  const matches = rawSearch
    ? index.filter((m) => m.name.toLowerCase().includes(rawSearch) || m.email.toLowerCase().includes(rawSearch))
    : index;

  const data = matches.slice(page.offset, page.offset + page.limit);
  res.json({ data, meta: pageMeta(matches.length, page) });
}

export async function getMerchantDetail(req: Request, res: Response) {
  const userId = uuid(req.params.id);

  const [{ data: user, error: userError }, { data: stores, error: storesError }, { data: subs, error: subsError }, { count: sessionCount }] =
    await Promise.all([
      db
        .from('users')
        .select('user_id, first_name, last_name, email, phone_number, status, email_verified, last_login, created_date')
        .eq('user_id', userId)
        .maybeSingle(),
      db
        .from('tenant')
        .select('tenant_id, tenant_name, code, status, custom_domain, created_date')
        .eq('created_by', userId)
        .order('created_date', { ascending: false }),
      db
        .from('subscriptions')
        .select('plan_id, status, current_period_end, created_date, updated_date')
        .eq('user_id', userId)
        .order('updated_date', { ascending: false })
        .limit(10),
      db.from('user_sessions').select('session_id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_active', true),
    ]);
  if (userError) throw userError;
  if (storesError) throw storesError;
  if (subsError) throw subsError;
  if (!user) throw new ApiError(404, 'Merchant not found');

  const subscriptions = (subs ?? []).map((s) => {
    const { tier, featureFlags } = decodePlanId(s.plan_id);
    return {
      plan: tier ? { id: tier, name: PLAN_TIERS[tier].name } : null,
      add_ons: featureFlags,
      status: s.status,
      current_period_end: s.current_period_end,
      started_at: s.created_date,
      updated_at: s.updated_date,
    };
  });

  res.json({
    data: {
      user,
      stores: stores ?? [],
      subscriptions,
      active_sessions: sessionCount ?? 0,
    },
  });
}

// ---------------------------------------------------------------------------------------------
// Account actions
// ---------------------------------------------------------------------------------------------

async function requireMerchant(userId: string) {
  const { data, error } = await db.from('users').select('user_id, status').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(404, 'Merchant not found');
  return data;
}

/** Every store the merchant owns gets the action in its own audit trail, since audit entries live per store. */
async function auditForOwnedStores(userId: string, actor: string, action: string) {
  const { data: stores } = await db.from('tenant').select('tenant_id').eq('created_by', userId);
  await Promise.all((stores ?? []).map((s) => logSuperAdminAction(s.tenant_id, actor, action)));
}

function actorEmail(req: Request): string {
  return req.superAdmin?.email ?? 'unknown';
}

export async function setMerchantStatus(req: Request, res: Response, status: 'ACTIVE' | 'SUSPENDED') {
  const userId = uuid(req.params.id);
  await requireMerchant(userId);

  const { error } = await db.from('users').update({ status }).eq('user_id', userId);
  if (error) throw error;

  // A suspended account is signed out everywhere immediately, and cannot sign in again until reactivated.
  if (status === 'SUSPENDED') await revokeUserSessions(userId);

  await auditForOwnedStores(userId, actorEmail(req), status === 'SUSPENDED' ? 'SUSPEND_MERCHANT' : 'REACTIVATE_MERCHANT');
  await kvDel(INDEX_KEY);

  res.json({ message: status === 'SUSPENDED' ? 'Account suspended and signed out everywhere.' : 'Account reactivated.' });
}

export const suspendMerchant = (req: Request, res: Response) => setMerchantStatus(req, res, 'SUSPENDED');
export const reactivateMerchant = (req: Request, res: Response) => setMerchantStatus(req, res, 'ACTIVE');

export async function revokeMerchantSessions(req: Request, res: Response) {
  const userId = uuid(req.params.id);
  await requireMerchant(userId);

  await revokeUserSessions(userId);
  await auditForOwnedStores(userId, actorEmail(req), 'REVOKE_MERCHANT_SESSIONS');
  await kvDel(INDEX_KEY);

  res.json({ message: 'All of this merchant’s sessions were ended.' });
}
