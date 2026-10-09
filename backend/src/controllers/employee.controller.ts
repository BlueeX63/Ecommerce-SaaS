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

/** Authenticated employee (set by requireEmployee). */
function me(req: Request) {
  if (!req.employee) throw unauthorized();
  return req.employee;
}

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
  const { tenantId, warehouseId } = me(req);

  const count = async (statuses: string[]) => {
    const { count } = await db
      .from('orders')
      .select('order_id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('fulfillment_warehouse_id', warehouseId)
      .in('status', statuses);
    return count ?? 0;
  };

  const [toPack, toDeliver, stockRows, recent] = await Promise.all([
    count(['PENDING', 'PROCESSING']),
    count(['SHIPPED']),
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
      .in('status', ['PENDING', 'PROCESSING'])
      .order('created_date', { ascending: true })
      .limit(6),
  ]);

  const alerts: Array<{ productId: string; name: string; available: number; kind: 'out' | 'low' }> = [];
  let tracked = 0;
  for (const row of stockRows.data ?? []) {
    tracked += 1;
    const variant: any = Array.isArray(row.product_variants) ? row.product_variants[0] : row.product_variants;
    const product: any = Array.isArray(variant?.products) ? variant.products[0] : variant?.products;
    const available = Math.max(0, (row.quantity_available ?? 0) - (row.quantity_reserved ?? 0));
    if (available <= (row.low_stock_threshold ?? 5)) {
      alerts.push({ productId: variant?.product_id, name: product?.product_name ?? 'Product', available, kind: available === 0 ? 'out' : 'low' });
    }
  }
  alerts.sort((a, b) => a.available - b.available);

  res.json({ toPack, toDeliver, trackedProducts: tracked, stockAlerts: alerts.slice(0, 10), outOfStock: alerts.filter((a) => a.kind === 'out').length, oldestOrders: recent.data ?? [] });
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

  const { data: product } = await db.from('products').select('product_id').eq('product_id', body.productId).eq('tenant_id', tenantId).maybeSingle();
  if (!product) throw notFound('Product not found');

  const actor = { label: `Employee: ${employee.fullName}` };
  if (body.mode === 'set') {
    if (body.quantity < 0) throw badRequest('Stock cannot be negative');
    await setStock({ tenantId, warehouseId, productId: body.productId, quantity: body.quantity, reason: body.reason, actor });
  } else {
    if (body.quantity === 0) throw badRequest('Enter how many units to add or remove');
    await adjustStock({ tenantId, warehouseId, variantId: await stockVariantFor(tenantId, body.productId), change: body.quantity, reason: body.reason, actor });
  }
  res.json({ message: 'Stock updated' });
}

// ---------------------------------------------------------------------------------------------
// Warehouse settings
// ---------------------------------------------------------------------------------------------

export async function updateWarehouse(req: Request, res: Response) {
  const { tenantId, warehouseId } = me(req);
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
  res.json({ message: 'Warehouse updated', data });
}

// ---------------------------------------------------------------------------------------------
// Orders this warehouse is handling
// ---------------------------------------------------------------------------------------------

export async function listOrders(req: Request, res: Response) {
  const { tenantId, warehouseId } = me(req);
  const page = pagination(req.query, 20, 50);
  const status = str(req.query.status);

  let query = db
    .from('orders')
    .select(
      'order_id, order_number, status, payment_status, payment_method, grand_total, currency, created_date, estimated_delivery_date, shipping_name, shipping_phone, shipping_address_line_1, shipping_landmark, shipping_city, shipping_state, shipping_postal_code, order_items(order_item_id, product_name, quantity)',
      { count: 'exact' },
    )
    .eq('tenant_id', tenantId)
    .eq('fulfillment_warehouse_id', warehouseId);
  if (status === 'OPEN') query = query.in('status', ['PENDING', 'PROCESSING']);
  else if (status && ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].includes(status)) query = query.eq('status', status);

  const { data, error, count } = await query.order('created_date', { ascending: false }).range(page.offset, page.offset + page.limit - 1);
  if (error) throw error;
  res.json({ data, meta: pageMeta(count, page) });
}

// Employees run fulfilment: they cannot issue refunds or process returns - those stay with the merchant.
const employeeOrderPatch = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['UNPAID', 'PARTIALLY_PAID', 'PAID']).optional(),
});

export async function updateOrderStatus(req: Request, res: Response) {
  const { tenantId, warehouseId } = me(req);
  const patch = parse(employeeOrderPatch, req.body);
  const orderId = uuid(req.params.id);

  const { data: current } = await db.from('orders').select('status, payment_status').eq('order_id', orderId).eq('tenant_id', tenantId).eq('fulfillment_warehouse_id', warehouseId).maybeSingle();
  if (!current) throw notFound('Order not found');
  if (['REFUNDED', 'RETURN_REQUESTED'].includes(current.status)) throw badRequest('This order is with the store owner for a return or refund.');
  if (current.payment_status === 'REFUNDED') throw badRequest('This order has been refunded.');

  await updateOrder({ tenantId, orderId, warehouseId, patch });
  res.json({ message: 'Order updated' });
}
