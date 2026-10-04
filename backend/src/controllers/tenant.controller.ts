import { randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { db } from '../lib/supabase.js';
import { ApiError, badRequest, notFound, parse } from '../lib/http.js';
import { fetchWithCache } from '../lib/kv.js';
import { sanitizeCustomization, slugify } from '../lib/sanitize.js';
import { setSessionTenant } from '../lib/session.js';
import { tenantCtx } from '../middleware/auth.js';
import { getEntitlements, hasFeature, upgradeMessage } from '../services/entitlements.js';
import { invalidateTenantCache } from '../services/tenants.js';
import { MAX_CUSTOMIZATION_BYTES, TEMPLATE_IDS } from '../services/templates.js';

export const templateSchema = z.enum(TEMPLATE_IDS);
export const brandNameSchema = z.string().trim().min(1, 'Store name is required').max(100);

export function assertCustomizationSize(value: unknown) {
  if (JSON.stringify(value).length > MAX_CUSTOMIZATION_BYTES) throw badRequest('Customization data is too large');
}

/** Throws unless the merchant has an active plan with room for another store; returns their entitlements. */
export async function assertStoreQuota(userId: string) {
  const entitlements = await getEntitlements(userId);
  if (!entitlements.active) throw new ApiError(402, 'An active subscription is required to create a store.');

  const { count } = await db.from('tenant').select('*', { count: 'exact', head: true }).eq('created_by', userId);
  if ((count ?? 0) >= entitlements.maxStores) {
    const noun = entitlements.maxStores === 1 ? 'store' : 'stores';
    throw new ApiError(403, `Your ${entitlements.planName} plan allows up to ${entitlements.maxStores} ${noun}. Upgrade your plan to create more.`);
  }
  return entitlements;
}

export async function getMe(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const { data: tenant } = await db
    .from('tenant')
    .select('tenant_id, tenant_name, code, description, status, custom_domain, created_date')
    .eq('tenant_id', tenantId)
    .maybeSingle();
  if (!tenant) throw notFound('Tenant not found');
  res.json({ tenant });
}

export async function updateMe(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const body = parse(z.object({ tenantName: brandNameSchema.optional() }), req.body);
  if (Object.keys(body).length === 0) throw badRequest('Nothing to update');

  const update: Record<string, unknown> = {};
  if (body.tenantName !== undefined) update.tenant_name = body.tenantName;

  const { data: tenant, error } = await db
    .from('tenant')
    .update(update)
    .eq('tenant_id', tenantId)
    .select('tenant_id, tenant_name, code, description, status, custom_domain, created_date')
    .maybeSingle();
  if (error) throw error;
  if (!tenant) throw notFound('Tenant not found');

  await invalidateTenantCache(tenantId, { keys: [tenant.code, tenant.custom_domain] });

  res.json({ message: 'Store updated successfully', tenant });
}

/**
 * Computing this means scanning every order the store has ever taken (there's no SQL-side aggregation
 * available over PostgREST without a DB function, which we have no way to create - see migrations). That's
 * fine for an occasional request but far too slow to redo on every overview page visit, so the result is
 * cached briefly; a dashboard metric being a few seconds stale is an entirely normal trade-off.
 */
async function computeMetrics(tenantId: string, userId: string) {
  const { data: allOrders, error } = await db
    .from('orders')
    .select('order_id, grand_total, created_date, order_number, status, customers(first_name, last_name), order_items(product_name, quantity, total_price)')
    .eq('tenant_id', tenantId);
  if (error) console.error('[metrics] failed to load orders', error);

  const orders = allOrders ?? [];
  const excluded = new Set(['CANCELLED', 'REFUNDED', 'RETURNED', 'RETURN_REQUESTED']);
  const revenueOrders = orders.filter((o) => !excluded.has(o.status));
  const sum = (list: typeof orders) => list.reduce((total, o) => total + (Number(o.grand_total) || 0), 0);

  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    const isoDay = day.toISOString().split('T')[0];
    chartData.push({
      name: day.toLocaleDateString('en-US', { weekday: 'short' }),
      revenue: sum(revenueOrders.filter((o) => o.created_date?.startsWith(isoDay))),
    });
  }

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime())
    .slice(0, 5)
    .map((o: any) => {
      const customer = Array.isArray(o.customers) ? o.customers[0] : o.customers;
      const name = customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : '';
      return {
        id: o.order_id,
        orderNumber: o.order_number,
        customerName: name || 'Guest Customer',
        amount: Number(o.grand_total) || 0,
        date: o.created_date,
      };
    });

  const [{ count: customers }, { count: products }] = await Promise.all([
    db.from('customers').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    db.from('products').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
  ]);

  const basic = {
    totalRevenue: sum(revenueOrders),
    totalOrders: orders.length,
    totalCustomers: customers ?? 0,
    totalProducts: products ?? 0,
    chartData,
    recentOrders,
  };

  // Advanced Analytics is a paid add-on - only computed (and only billed for, in terms of query cost) when
  // the merchant's plan includes it. Everyone still gets the metrics above.
  const entitlements = await getEntitlements(userId);
  if (!hasFeature(entitlements, 'advanced_analytics')) {
    return basic;
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  const trend30d: Array<{ date: string; revenue: number }> = [];
  for (let i = 29; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    const isoDay = day.toISOString().split('T')[0];
    trend30d.push({ date: isoDay, revenue: sum(revenueOrders.filter((o) => o.created_date?.startsWith(isoDay))) });
  }

  const averageOrderValue = revenueOrders.length ? basic.totalRevenue / revenueOrders.length : 0;

  const productTotals = new Map<string, { name: string; revenue: number; unitsSold: number }>();
  for (const order of revenueOrders as any[]) {
    for (const item of order.order_items ?? []) {
      const key = item.product_name;
      const entry = productTotals.get(key) ?? { name: key, revenue: 0, unitsSold: 0 };
      entry.revenue += Number(item.total_price) || 0;
      entry.unitsSold += Number(item.quantity) || 0;
      productTotals.set(key, entry);
    }
  }
  const topProducts = [...productTotals.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const { count: newCustomers30d } = await db
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('created_date', thirtyDaysAgo.toISOString());

  return {
    ...basic,
    advanced: {
      averageOrderValue,
      newCustomersLast30Days: newCustomers30d ?? 0,
      trend30d,
      topProducts,
    },
  };
}

export async function getMetrics(req: Request, res: Response) {
  const { tenantId, userId } = tenantCtx(req);
  const data = await fetchWithCache(`metrics:${tenantId}:${userId}`, () => computeMetrics(tenantId, userId), 45);
  res.json(data);
}

// ---------------------------------------------------------------------------------------------
// Advanced Analytics - a paid add-on. Every number here is computed fresh from orders scoped to this
// tenant alone (never another tenant's data, regardless of what range/query params are supplied), and the
// whole endpoint 403s before touching the database at all unless the merchant's own subscription includes
// the add-on - the frontend's "locked" UI is just a courtesy, this check is the real gate.
// ---------------------------------------------------------------------------------------------

const ANALYTICS_RANGES = { '7d': 7, '30d': 30, '90d': 90 } as const;
type AnalyticsRange = keyof typeof ANALYTICS_RANGES;
const analyticsRangeSchema = z.enum(['7d', '30d', '90d']).default('30d');

async function computeAnalytics(tenantId: string, range: AnalyticsRange) {
  const days = ANALYTICS_RANGES[range];
  const rangeStart = new Date();
  rangeStart.setDate(rangeStart.getDate() - (days - 1));
  rangeStart.setHours(0, 0, 0, 0);

  const { data: rangeOrders, error } = await db
    .from('orders')
    .select(
      'order_id, grand_total, created_date, status, customer_id, customers(first_name, last_name), order_items(product_name, quantity, total_price)',
    )
    .eq('tenant_id', tenantId)
    .gte('created_date', rangeStart.toISOString());
  if (error) throw error;

  const orders = rangeOrders ?? [];
  const excluded = new Set(['CANCELLED', 'REFUNDED', 'RETURNED', 'RETURN_REQUESTED']);
  const revenueOrders = orders.filter((o) => !excluded.has(o.status));
  const sum = (list: typeof orders) => list.reduce((total, o) => total + (Number(o.grand_total) || 0), 0);

  const revenueTrend: Array<{ name: string; revenue: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    const isoDay = day.toISOString().split('T')[0];
    revenueTrend.push({
      name: day.toLocaleDateString('en-US', days > 30 ? { month: 'short', day: 'numeric' } : { weekday: 'short' }),
      revenue: sum(revenueOrders.filter((o) => o.created_date?.startsWith(isoDay))),
    });
  }

  const statusBreakdown = new Map<string, number>();
  for (const order of orders) statusBreakdown.set(order.status, (statusBreakdown.get(order.status) ?? 0) + 1);

  const productTotals = new Map<string, { name: string; revenue: number; unitsSold: number }>();
  for (const order of revenueOrders as any[]) {
    for (const item of order.order_items ?? []) {
      const entry = productTotals.get(item.product_name) ?? { name: item.product_name, revenue: 0, unitsSold: 0 };
      entry.revenue += Number(item.total_price) || 0;
      entry.unitsSold += Number(item.quantity) || 0;
      productTotals.set(item.product_name, entry);
    }
  }
  const topProducts = [...productTotals.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  const customerTotals = new Map<string, { name: string; revenue: number; orders: number }>();
  for (const order of revenueOrders as any[]) {
    if (!order.customer_id) continue;
    const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;
    const name = customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : 'Guest';
    const entry = customerTotals.get(order.customer_id) ?? { name: name || 'Guest', revenue: 0, orders: 0 };
    entry.revenue += Number(order.grand_total) || 0;
    entry.orders += 1;
    customerTotals.set(order.customer_id, entry);
  }
  const topCustomers = [...customerTotals.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  const { count: newCustomers } = await db
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('created_date', rangeStart.toISOString());

  const totalRevenue = sum(revenueOrders);

  return {
    range,
    totalRevenue,
    totalOrders: orders.length,
    averageOrderValue: revenueOrders.length ? totalRevenue / revenueOrders.length : 0,
    newCustomers: newCustomers ?? 0,
    revenueTrend,
    statusBreakdown: [...statusBreakdown.entries()].map(([status, count]) => ({ status, count })),
    topProducts,
    topCustomers,
  };
}

export async function getAnalytics(req: Request, res: Response) {
  const { tenantId, userId } = tenantCtx(req);
  const { range } = parse(z.object({ range: analyticsRangeSchema }), req.query);

  const entitlements = await getEntitlements(userId);
  if (!hasFeature(entitlements, 'advanced_analytics')) {
    throw new ApiError(403, upgradeMessage('advanced_analytics'), undefined, 'UPGRADE_REQUIRED');
  }

  const data = await fetchWithCache(`analytics:${tenantId}:${range}`, () => computeAnalytics(tenantId, range), 60);
  res.json(data);
}

// ---------------------------------------------------------------------------------------------
// Onboarding provisioning: creates a NEW store for the logged-in user and makes it the active one.
// ---------------------------------------------------------------------------------------------

export async function provision(req: Request, res: Response) {
  const session = req.merchant!;
  const { templateId, formData } = parse(
    z.object({
      templateId: templateSchema,
      formData: z.object({ brandName: brandNameSchema }).catchall(z.unknown()),
    }),
    req.body,
  );
  assertCustomizationSize(formData);
  await assertStoreQuota(session.userId);

  const customization: Record<string, any> = sanitizeCustomization(formData);
  const brandName = String(customization.brandName).trim();
  const base = slugify(brandName, 40) || 'store';

  let tenant: { tenant_id: string; code: string } | null = null;
  for (let attempt = 0; attempt < 5 && !tenant; attempt++) {
    const code = `${base}-${randomBytes(2).toString('hex')}`;
    const { data, error } = await db
      .from('tenant')
      .insert({ tenant_name: brandName, code, description: `Tenant for ${brandName}`, created_by: session.userId })
      .select('tenant_id, code')
      .single();
    if (data) tenant = data;
    else if (error?.code !== '23505') throw error;
  }
  if (!tenant) throw new ApiError(500, 'Could not allocate a store address. Please try again.');

  try {
    const { error: brandingError } = await db.from('tenant_branding').upsert(
      {
        tenant_id: tenant.tenant_id,
        logo_url: String(customization.logoUrl || customization.aboutHeroImage || '').slice(0, 255),
        primary_color: String(customization.primaryColor || '#000000').slice(0, 20),
        secondary_color: '#ffffff',
      },
      { onConflict: 'tenant_id' },
    );
    if (brandingError) throw brandingError;

    const { error: settingsError } = await db.from('tenant_settings').upsert(
      {
        tenant_id: tenant.tenant_id,
        setting_key: 'customization',
        setting_value: JSON.stringify({ templateId, formData: customization }),
      },
      { onConflict: 'tenant_id,setting_key' },
    );
    if (settingsError) throw settingsError;

    const { error: domainError } = await db.from('tenant_domain').upsert(
      { tenant_id: tenant.tenant_id, domain: `${tenant.code}.${env.ROOT_DOMAIN ?? 'localhost:3000'}`, is_primary: true },
      { onConflict: 'domain' },
    );
    if (domainError) throw domainError;
  } catch (error) {
    await db.from('tenant').delete().eq('tenant_id', tenant.tenant_id);
    throw error;
  }

  await setSessionTenant(res, session, tenant.tenant_id);
  res.json({ success: true, storeSlug: tenant.code, tenantId: tenant.tenant_id });
}
