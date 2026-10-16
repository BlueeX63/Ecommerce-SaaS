import type { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../lib/supabase.js';
import { ApiError, badRequest, escapeLike, notFound, pageMeta, pagination, parse, str, unauthorized, uuid } from '../lib/http.js';
import { comparePassword, fakeCompare } from '../lib/password.js';
import { rateLimit } from '../lib/rate-limit.js';
import { clearEmployeeCookie, issueEmployeeSession } from '../lib/employee-session.js';
import { optionalNumber, optionalText } from '../lib/validation.js';
import { geocode } from '../services/geo.js';
import { getStockByProduct } from '../services/fulfillment.js';
import { updateOrder } from '../services/order-updates.js';
import { adjustStock, setStock, stockVariantFor } from '../services/stock.js';
import { logActivity, type Actor } from '../services/activity.js';
import { notifyAdmin } from '../services/notifications.js';
import { OPEN_STATUSES, assertCanHandle, claimOrder, evaluateFit, moveOrder, resolveNeeds, unclaimOrder, type RawLine } from '../services/order-assignment.js';

/** Authenticated employee (set by requireEmployee). */
function me(req: Request) {
  if (!req.employee) throw unauthorized();
  return req.employee;
}

const actorOf = (employee: { employeeId: string; fullName: string }): Actor => ({ type: 'EMPLOYEE', employeeId: employee.employeeId, name: employee.fullName });
const warehouseOf = (employee: { warehouseId: string; warehouseName: string }) => ({ id: employee.warehouseId, name: employee.warehouseName });

// ---------------------------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------------------------

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(256),
});

export async function login(req: Request, res: Response) {
  const { email, password } = parse(loginSchema, req.body);

  const perAccount = await rateLimit(`employee-login:${email}`, 8, 15 * 60_000);
  if (!perAccount.success) throw new ApiError(429, 'Too many login attempts. Please try again later.');

  const { data: employee } = await db
    .from('warehouse_employees')
    .select('employee_id, full_name, password_hash, is_active, token_version, warehouses!inner(is_active)')
    .ilike('email', escapeLike(email))
    .maybeSingle();

  if (!employee) {
    await fakeCompare(password);
    throw unauthorized('Invalid email or password');
  }
  const ok = await comparePassword(password, employee.password_hash);
  const warehouse: any = Array.isArray(employee.warehouses) ? employee.warehouses[0] : employee.warehouses;
  if (!ok) throw unauthorized('Invalid email or password');
  if (!employee.is_active || warehouse?.is_active === false) throw new ApiError(403, 'This account has been deactivated. Please contact your store manager.');

  await db.from('warehouse_employees').update({ last_login: new Date().toISOString() }).eq('employee_id', employee.employee_id);
  await issueEmployeeSession(res, employee.employee_id, employee.token_version);
  res.json({ message: 'Logged in successfully', name: employee.full_name });
}

export function logout(_req: Request, res: Response) {
  clearEmployeeCookie(res);
  res.json({ message: 'Logged out successfully' });
}

const WAREHOUSE_COLUMNS =
  'warehouse_id, warehouse_name, address_line_1, city, state_province, postal_code, country, latitude, longitude, dispatch_hours, daily_capacity, is_active';

export async function session(req: Request, res: Response) {
  const employee = me(req);
  const [{ data: warehouse }, { data: tenant }] = await Promise.all([
    db.from('warehouses').select(WAREHOUSE_COLUMNS).eq('warehouse_id', employee.warehouseId).eq('tenant_id', employee.tenantId).maybeSingle(),
    db.from('tenant').select('tenant_name').eq('tenant_id', employee.tenantId).maybeSingle(),
  ]);
  res.json({
    isLoggedIn: true,
    employee: { name: employee.fullName, email: employee.email },
    store: { name: tenant?.tenant_name ?? '' },
    warehouse,
  });
}

// ---------------------------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------------------------

export async function overview(req: Request, res: Response) {
  const { tenantId, warehouseId, employeeId } = me(req);

  // Head-only counts: the database counts, no rows travel.
  const count = (build: (q: any) => any) =>
    build(db.from('orders').select('order_id', { count: 'exact', head: true }).eq('tenant_id', tenantId)).then((r: { count: number | null }) => r.count ?? 0);
  const mine = (q: any) => q.eq('fulfillment_warehouse_id', warehouseId);

  const [toPack, toDeliver, available, unclaimed, claimedByMe, stockRows, recent] = await Promise.all([
    count((q) => mine(q).in('status', OPEN_STATUSES)),
    count((q) => mine(q).eq('status', 'SHIPPED')),
    count((q) => q.is('fulfillment_warehouse_id', null).in('status', OPEN_STATUSES)),
    count((q) => mine(q).in('status', OPEN_STATUSES).is('claimed_by_employee_id', null)),
    count((q) => mine(q).in('status', OPEN_STATUSES).eq('claimed_by_employee_id', employeeId)),
    db
      .from('inventory')
      .select('quantity_available, quantity_reserved, low_stock_threshold, product_variants!inner(product_id, products!inner(product_name))')
      .eq('tenant_id', tenantId)
      .eq('warehouse_id', warehouseId),
    db
      .from('orders')
      .select('order_id, order_number, status, payment_status, grand_total, currency, created_date, shipping_name')
      .eq('tenant_id', tenantId)
      .eq('fulfillment_warehouse_id', warehouseId)
      .in('status', OPEN_STATUSES)
      .order('created_date', { ascending: true })
      .limit(6),
  ]);

  const alerts: Array<{ productId: string; name: string; available: number; kind: 'out' | 'low' }> = [];
  let tracked = 0;
  for (const row of stockRows.data ?? []) {
    tracked += 1;
    const variant: any = Array.isArray(row.product_variants) ? row.product_variants[0] : row.product_variants;
    const product: any = Array.isArray(variant?.products) ? variant.products[0] : variant?.products;
    const stock = Math.max(0, (row.quantity_available ?? 0) - (row.quantity_reserved ?? 0));
    if (stock <= (row.low_stock_threshold ?? 5)) {
      alerts.push({ productId: variant?.product_id, name: product?.product_name ?? 'Product', available: stock, kind: stock === 0 ? 'out' : 'low' });
    }
  }
  alerts.sort((a, b) => a.available - b.available);

  res.json({
    toPack,
    toDeliver,
    available,
    unclaimed,
    claimedByMe,
    trackedProducts: tracked,
    stockAlerts: alerts.slice(0, 10),
    outOfStock: alerts.filter((a) => a.kind === 'out').length,
    oldestOrders: recent.data ?? [],
  });
}

// ---------------------------------------------------------------------------------------------
// Products & stock at this warehouse
// ---------------------------------------------------------------------------------------------

export async function listProducts(req: Request, res: Response) {
  const { tenantId, warehouseId } = me(req);
  const page = pagination(req.query, 20, 50);
  const search = str(req.query.q)?.replace(/[,()*]/g, ' ').trim().slice(0, 100);

  let query = db
    .from('products')
    .select('product_id, product_name, sku, status, base_price, product_images(image_url, is_primary)', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .neq('status', 'ARCHIVED');
  if (search) {
    const like = `%${escapeLike(search)}%`;
    query = query.or(`product_name.ilike.${like},sku.ilike.${like}`);
  }
  const { data, error, count } = await query.order('product_name').range(page.offset, page.offset + page.limit - 1);
  if (error) throw error;

  const stock = await getStockByProduct(tenantId, (data ?? []).map((p) => p.product_id));
  const rows = (data ?? []).map((p: any) => {
    const all = stock.get(p.product_id) ?? [];
    const here = all.filter((r) => r.warehouseId === warehouseId);
    const image = (p.product_images ?? []).find((i: any) => i.is_primary)?.image_url ?? p.product_images?.[0]?.image_url ?? null;
    return {
      productId: p.product_id,
      name: p.product_name,
      sku: p.sku,
      status: p.status,
      image,
      // No stock records anywhere = the merchant sells this without tracking (unlimited).
      unlimited: all.length === 0,
      trackedHere: here.length > 0,
      quantity: here.reduce((sum, r) => sum + r.available, 0),
    };
  });
  res.json({ data: rows, meta: pageMeta(count, page) });
}

const stockSchema = z.object({
  productId: z.string().uuid(),
  mode: z.enum(['set', 'adjust']),
  quantity: z.coerce.number().int().min(-1_000_000).max(1_000_000),
  reason: optionalText(300),
});

export async function updateStock(req: Request, res: Response) {
  const employee = me(req);
  const body = parse(stockSchema, req.body);
  const { tenantId, warehouseId } = employee;

  const { data: product } = await db.from('products').select('product_id, product_name').eq('product_id', body.productId).eq('tenant_id', tenantId).maybeSingle();
  if (!product) throw notFound('Product not found');

  const actor = { employeeId: employee.employeeId, name: employee.fullName, label: `Employee: ${employee.fullName}` };
  let result;
  if (body.mode === 'set') {
    if (body.quantity < 0) throw badRequest('Stock cannot be negative');
    result = await setStock({ tenantId, warehouseId, productId: body.productId, quantity: body.quantity, reason: body.reason, actor });
  } else {
    if (body.quantity === 0) throw badRequest('Enter how many units to add or remove');
    result = await adjustStock({ tenantId, warehouseId, variantId: await stockVariantFor(tenantId, body.productId), productId: body.productId, change: body.quantity, reason: body.reason, actor });
  }

  if (result.change !== 0) {
    void logActivity({
      tenantId,
      actor: actorOf(employee),
      action: body.mode === 'set' ? 'STOCK_SET' : 'STOCK_ADJUST',
      warehouse: warehouseOf(employee),
      product: { id: product.product_id, name: product.product_name },
      before: result.before,
      after: result.after,
      note: body.reason ?? null,
    });
  }
  res.json({ message: 'Stock updated', quantity: result.after });
}

// ---------------------------------------------------------------------------------------------
// Warehouse settings
// ---------------------------------------------------------------------------------------------

export async function updateWarehouse(req: Request, res: Response) {
  const employee = me(req);
  const { tenantId, warehouseId } = employee;
  const body = parse(
    z.object({
      warehouseName: z.string().trim().min(1).max(100).optional(),
      addressLine1: optionalText(255),
      city: optionalText(100),
      state: optionalText(100),
      postalCode: optionalText(20),
      country: optionalText(100),
      dispatchHours: optionalNumber(0, 24 * 14),
      dailyCapacity: optionalNumber(1, 100_000),
    }),
    req.body,
  );

  const { data: current } = await db.from('warehouses').select('*').eq('warehouse_id', warehouseId).eq('tenant_id', tenantId).maybeSingle();
  if (!current) throw notFound('Warehouse not found');

  const update: Record<string, unknown> = {};
  if (body.warehouseName !== undefined) update.warehouse_name = body.warehouseName;
  if (body.addressLine1 !== undefined) update.address_line_1 = body.addressLine1;
  if (body.city !== undefined) update.city = body.city;
  if (body.state !== undefined) update.state_province = body.state;
  if (body.postalCode !== undefined) update.postal_code = body.postalCode;
  if (body.country !== undefined) update.country = body.country;
  if (body.dispatchHours !== undefined) update.dispatch_hours = Math.round(body.dispatchHours);
  if (body.dailyCapacity !== undefined) update.daily_capacity = Math.round(body.dailyCapacity);
  if (Object.keys(update).length === 0) throw badRequest('Nothing to update');

  if (['addressLine1', 'city', 'state', 'postalCode', 'country'].some((k) => (body as Record<string, unknown>)[k] !== undefined)) {
    const point = await geocode({
      line1: body.addressLine1 ?? current.address_line_1,
      city: body.city ?? current.city,
      state: body.state ?? current.state_province,
      postalCode: body.postalCode ?? current.postal_code,
      country: body.country ?? current.country,
    });
    if (point) {
      update.latitude = point.lat;
      update.longitude = point.lng;
    }
  }

  const { data, error } = await db.from('warehouses').update(update).eq('warehouse_id', warehouseId).eq('tenant_id', tenantId).select(WAREHOUSE_COLUMNS).single();
  if (error) throw error;

  const changes = Object.fromEntries(
    Object.keys(update)
      .filter((key) => key !== 'latitude' && key !== 'longitude' && String(current[key] ?? '') !== String(update[key] ?? ''))
      .map((key) => [key, { from: current[key] ?? null, to: update[key] }]),
  );
  if (Object.keys(changes).length > 0) {
    void logActivity({ tenantId, actor: actorOf(employee), action: 'WAREHOUSE_UPDATED', warehouse: { id: warehouseId, name: data.warehouse_name }, details: { changes } });
  }
  res.json({ message: 'Warehouse updated', data });
}

// ---------------------------------------------------------------------------------------------
// Orders this warehouse is handling
// ---------------------------------------------------------------------------------------------

const ORDER_LIST_COLUMNS =
  'order_id, order_number, status, payment_status, payment_method, grand_total, currency, created_date, estimated_delivery_date, shipping_name, shipping_phone, shipping_address_line_1, shipping_landmark, shipping_city, shipping_state, shipping_postal_code, claimed_by_employee_id, claimed_date, claimed_by:warehouse_employees!claimed_by_employee_id(full_name), order_items(order_item_id, product_name, quantity)';

export async function listOrders(req: Request, res: Response) {
  const { tenantId, warehouseId, employeeId } = me(req);
  const page = pagination(req.query, 20, 50);
  const status = str(req.query.status);

  let query = db.from('orders').select(ORDER_LIST_COLUMNS, { count: 'exact' }).eq('tenant_id', tenantId).eq('fulfillment_warehouse_id', warehouseId);
  if (status === 'OPEN') query = query.in('status', OPEN_STATUSES);
  // "My orders": open orders I am handling. "Unclaimed": open orders nobody has picked up yet.
  else if (status === 'MINE') query = query.in('status', OPEN_STATUSES).eq('claimed_by_employee_id', employeeId);
  else if (status === 'UNCLAIMED') query = query.in('status', OPEN_STATUSES).is('claimed_by_employee_id', null);
  else if (status && ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].includes(status)) query = query.eq('status', status);

  const { data, error, count } = await query.order('created_date', { ascending: false }).range(page.offset, page.offset + page.limit - 1);
  if (error) throw error;
  res.json({ data: (data ?? []).map((o: any) => ({ ...o, claimed_by_me: o.claimed_by_employee_id === employeeId })), meta: pageMeta(count, page) });
}

/**
 * Orders nobody is responsible for yet, with whether THIS warehouse can fulfil each in full. Taking one assigns it to
 * this warehouse and takes the stock from it (see takeOrder). Orders the warehouse cannot cover are listed but
 * can't be taken, and say which item falls short.
 */
export async function availableOrders(req: Request, res: Response) {
  const { tenantId, warehouseId } = me(req);

  const { data, error, count } = await db
    .from('orders')
    .select(
      'order_id, order_number, status, payment_status, payment_method, grand_total, currency, created_date, estimated_delivery_date, shipping_name, shipping_city, shipping_state, shipping_postal_code, order_items(order_item_id, product_id, product_name, sku, quantity)',
      { count: 'exact' },
    )
    .eq('tenant_id', tenantId)
    .is('fulfillment_warehouse_id', null)
    .in('status', OPEN_STATUSES)
    .order('created_date', { ascending: true })
    .limit(50);
  if (error) throw error;

  const orders = data ?? [];
  const needs = await resolveNeeds(tenantId, orders.map((o: any) => ({ order_id: o.order_id, order_items: o.order_items as RawLine[] })));
  const fit = await evaluateFit(tenantId, needs, [warehouseId]);

  const rows = orders.map((o: any) => {
    const f = fit.get(o.order_id)?.get(warehouseId) ?? { canFulfil: true, shortages: [] };
    return { ...o, order_items: o.order_items.map(({ order_item_id, product_name, quantity }: any) => ({ order_item_id, product_name, quantity })), canFulfil: f.canFulfil, shortages: f.shortages };
  });
  // Orders this warehouse can actually take come first; each group keeps oldest-first.
  rows.sort((a, b) => Number(b.canFulfil) - Number(a.canFulfil));
  res.json({ data: rows, meta: { total: count ?? rows.length, shown: rows.length } });
}

/** Take an unassigned order: it becomes this warehouse's, the stock comes off this warehouse's shelves, and it is yours. */
export async function takeOrder(req: Request, res: Response) {
  const employee = me(req);
  const orderId = uuid(req.params.id);
  const moved = await moveOrder({
    tenantId: employee.tenantId,
    orderId,
    toWarehouseId: employee.warehouseId,
    expectedFrom: null,
    claim: true,
    actor: actorOf(employee),
  });
  res.json({ message: `${moved.order_number} is now yours to fulfil`, orderNumber: moved.order_number, stockMoved: moved.stock_moved });
}

/** Pick up an order already assigned to this warehouse, so teammates know it's being handled. */
export async function claim(req: Request, res: Response) {
  const employee = me(req);
  const result = await claimOrder(employee.tenantId, employee, uuid(req.params.id));
  res.json({ message: result.already ? 'You are already handling this order' : 'Order claimed' });
}

export async function unclaim(req: Request, res: Response) {
  const employee = me(req);
  await unclaimOrder(employee.tenantId, employee, uuid(req.params.id));
  res.json({ message: 'Order released to your team' });
}

/**
 * The warehouse can't fulfil an order assigned to it (e.g. the shelf is empty). Hand it back: its stock returns to
 * this warehouse's count, another warehouse with stock can take it, and the store owner is notified.
 */
export async function handBack(req: Request, res: Response) {
  const employee = me(req);
  const orderId = uuid(req.params.id);
  const { reason } = parse(z.object({ reason: z.string().trim().min(3, 'Tell the store owner why').max(300) }), req.body);

  const { data: order } = await db
    .from('orders')
    .select('order_number, status, claimed_by_employee_id')
    .eq('order_id', orderId)
    .eq('tenant_id', employee.tenantId)
    .eq('fulfillment_warehouse_id', employee.warehouseId)
    .maybeSingle();
  if (!order) throw notFound('Order not found');
  if (order.claimed_by_employee_id && order.claimed_by_employee_id !== employee.employeeId) throw new ApiError(409, 'A colleague is handling this order. Ask them to hand it back.');

  await moveOrder({ tenantId: employee.tenantId, orderId, toWarehouseId: null, expectedFrom: employee.warehouseId, actor: actorOf(employee), note: reason });
  void notifyAdmin({
    tenantId: employee.tenantId,
    type: 'order_handed_back',
    title: `${order.order_number} was handed back by ${employee.warehouseName}`,
    body: `${employee.fullName}: ${reason}`,
    warehouseId: employee.warehouseId,
    dedupeKey: `handback:${orderId}`,
  });
  res.json({ message: `${order.order_number} is back in the open pool` });
}

// Employees run fulfilment: they cannot issue refunds or process returns - those stay with the merchant.
const employeeOrderPatch = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['UNPAID', 'PARTIALLY_PAID', 'PAID']).optional(),
});

export async function updateOrderStatus(req: Request, res: Response) {
  const employee = me(req);
  const { tenantId, warehouseId } = employee;
  const patch = parse(employeeOrderPatch, req.body);
  const orderId = uuid(req.params.id);

  const { data: current } = await db
    .from('orders')
    .select('order_number, status, payment_status')
    .eq('order_id', orderId)
    .eq('tenant_id', tenantId)
    .eq('fulfillment_warehouse_id', warehouseId)
    .maybeSingle();
  if (!current) throw notFound('Order not found');
  if (['REFUNDED', 'RETURN_REQUESTED'].includes(current.status)) throw badRequest('This order is with the store owner for a return or refund.');
  if (current.payment_status === 'REFUNDED') throw badRequest('This order has been refunded.');

  // Someone else's order is theirs to update; an unclaimed one becomes yours.
  await assertCanHandle(tenantId, employee, orderId);
  await updateOrder({ tenantId, orderId, warehouseId, patch });

  const base = { tenantId, actor: actorOf(employee), warehouse: warehouseOf(employee), order: { id: orderId, number: current.order_number } };
  if (patch.status && patch.status !== current.status) void logActivity({ ...base, action: 'ORDER_STATUS', details: { from: current.status, to: patch.status } });
  if (patch.paymentStatus && patch.paymentStatus !== current.payment_status) void logActivity({ ...base, action: 'ORDER_PAYMENT', details: { from: current.payment_status, to: patch.paymentStatus } });
  res.json({ message: 'Order updated' });
}
