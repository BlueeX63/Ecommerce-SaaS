import { db } from '../lib/supabase.js';
import { ApiError, notFound } from '../lib/http.js';
import { callRpc } from '../lib/rpc.js';
import { logActivity, type Actor } from './activity.js';
import { getStockByProduct, invalidateStockCache } from './fulfillment.js';
import { haversineKm, isValidPoint } from './geo.js';
import { syncOutOfStockAlerts } from './notifications.js';
import { refreshEta } from './order-support.js';

/** Orders in these states can still change hands. Shipped orders are already on the road. */
export const OPEN_STATUSES = ['PENDING', 'PROCESSING'];

// ---------------------------------------------------------------------------------------------
// Can a warehouse fulfil an order? (mirrors the rules the database enforces when the order is actually moved)
// ---------------------------------------------------------------------------------------------

export interface RawLine {
  product_id: string | null;
  product_name: string;
  sku: string | null;
  quantity: number;
}

export interface Need {
  productId: string | null;
  name: string;
  quantity: number;
}

/**
 * One entry per distinct product. Lines that predate order lines remembering their product are matched by SKU,
 * then by name - the same fallback the database applies - in two batched queries however many orders are checked.
 */
export async function resolveNeeds(tenantId: string, orders: Array<{ order_id: string; order_items: RawLine[] }>): Promise<Map<string, Need[]>> {
  const loose = orders.flatMap((o) => o.order_items).filter((i) => !i.product_id);
  const bySku = new Map<string, string>();
  const byName = new Map<string, string>();
  if (loose.length) {
    const skus = [...new Set(loose.map((i) => i.sku).filter((s): s is string => !!s))];
    const names = [...new Set(loose.map((i) => i.product_name))];
    const [skuRows, nameRows] = await Promise.all([
      skus.length ? db.from('products').select('product_id, sku').eq('tenant_id', tenantId).in('sku', skus) : Promise.resolve({ data: [] as Array<{ product_id: string; sku: string | null }> }),
      names.length ? db.from('products').select('product_id, product_name, created_date').eq('tenant_id', tenantId).in('product_name', names).order('created_date', { ascending: false }) : Promise.resolve({ data: [] as Array<{ product_id: string; product_name: string }> }),
    ]);
    for (const p of skuRows.data ?? []) if (p.sku && !bySku.has(p.sku)) bySku.set(p.sku, p.product_id);
    for (const p of nameRows.data ?? []) if (!byName.has(p.product_name.toLowerCase())) byName.set(p.product_name.toLowerCase(), p.product_id);
  }

  const result = new Map<string, Need[]>();
  for (const order of orders) {
    const merged = new Map<string, Need>();
    for (const item of order.order_items) {
      const productId = item.product_id ?? (item.sku ? bySku.get(item.sku) : undefined) ?? byName.get(item.product_name.toLowerCase()) ?? null;
      const key = productId ?? `name:${item.product_name}`;
      const existing = merged.get(key);
      if (existing) existing.quantity += item.quantity;
      else merged.set(key, { productId, name: item.product_name, quantity: item.quantity });
    }
    result.set(order.order_id, [...merged.values()]);
  }
  return result;
}

export interface Shortage {
  name: string;
  needed: number;
  available: number;
}

export interface Fit {
  canFulfil: boolean;
  shortages: Shortage[];
}

/** For each order and warehouse: whether the warehouse holds every tracked line in full. One stock query for the lot. */
export async function evaluateFit(
  tenantId: string,
  needsByOrder: Map<string, Need[]>,
  warehouseIds: string[],
): Promise<Map<string, Map<string, Fit>>> {
  const productIds = [...new Set([...needsByOrder.values()].flat().map((n) => n.productId).filter((id): id is string => !!id))];
  const stock = await getStockByProduct(tenantId, productIds);

  // product -> warehouse -> units
  const held = new Map<string, Map<string, number>>();
  for (const [productId, rows] of stock) {
    const perWarehouse = new Map<string, number>();
    for (const row of rows) perWarehouse.set(row.warehouseId, (perWarehouse.get(row.warehouseId) ?? 0) + row.available);
    held.set(productId, perWarehouse);
  }

  const result = new Map<string, Map<string, Fit>>();
  for (const [orderId, needs] of needsByOrder) {
    const perWarehouse = new Map<string, Fit>();
    for (const warehouseId of warehouseIds) {
      const shortages: Shortage[] = [];
      for (const need of needs) {
        // No stock records anywhere = the merchant does not track this product (unlimited); lines we cannot identify likewise.
        if (!need.productId || !stock.has(need.productId)) continue;
        const available = held.get(need.productId)?.get(warehouseId) ?? 0;
        if (available < need.quantity) shortages.push({ name: need.name, needed: need.quantity, available });
      }
      perWarehouse.set(warehouseId, { canFulfil: shortages.length === 0, shortages });
    }
    result.set(orderId, perWarehouse);
  }
  return result;
}

// ---------------------------------------------------------------------------------------------
// Moving an order (all the stock work happens inside one database transaction - see move_order_to_warehouse)
// ---------------------------------------------------------------------------------------------

interface MoveResult {
  order_id: string;
  order_number: string;
  from_warehouse_id: string | null;
  to_warehouse_id: string | null;
  stock_moved: Array<{ product_id: string; product_name: string; quantity: number }>;
}

export async function moveOrder(opts: {
  tenantId: string;
  orderId: string;
  /** null = release to the pool of unassigned orders. */
  toWarehouseId: string | null;
  /** When given (null means "unassigned"), the move is rejected unless the order is still there. Guards against stale screens. */
  expectedFrom?: string | null;
  /** The employee taking the order becomes the one responsible for it. */
  claim?: boolean;
  actor: Actor;
  note?: string | null;
}): Promise<MoveResult> {
  const { actor } = opts;
  const result = await callRpc<MoveResult>('move_order_to_warehouse', {
    p_tenant: opts.tenantId,
    p_order: opts.orderId,
    p_to: opts.toWarehouseId,
    p_check_from: opts.expectedFrom !== undefined,
    p_expected_from: opts.expectedFrom ?? null,
    p_claim: opts.claim ?? false,
    p_actor_type: actor.type,
    p_employee: actor.type === 'EMPLOYEE' ? actor.employeeId : null,
    p_user: actor.type === 'ADMIN' ? actor.userId : null,
    p_actor_name: actor.name,
    p_note: opts.note ?? null,
  });

  void invalidateStockCache(opts.tenantId);
  // Stock left one warehouse and/or arrived at another: keep the out-of-stock alerts in step.
  void db
    .from('order_items')
    .select('product_id')
    .eq('order_id', opts.orderId)
    .not('product_id', 'is', null)
    .then(({ data }) => syncOutOfStockAlerts(opts.tenantId, [...(data ?? []), ...result.stock_moved].map((r) => r.product_id as string)));
  // A different warehouse means a different distance: refresh the delivery estimate in the background.
  if (opts.toWarehouseId) void refreshOrderEta(opts.tenantId, opts.orderId);
  return result;
}

async function refreshOrderEta(tenantId: string, orderId: string): Promise<void> {
  try {
    const { data: order } = await db
      .from('orders')
      .select('order_id, tenant_id, status, created_date, order_number, shipping_name, shipping_phone, shipping_address_line_1, shipping_landmark, shipping_city, shipping_state, shipping_postal_code, shipping_country, fulfillment_warehouse_id')
      .eq('order_id', orderId)
      .eq('tenant_id', tenantId)
      .maybeSingle();
    if (order) await refreshEta(tenantId, order, { city: order.shipping_city, state: order.shipping_state, postalCode: order.shipping_postal_code });
  } catch (error) {
    console.error('[orders] eta refresh after reassignment failed', (error as Error)?.message);
  }
}

// ---------------------------------------------------------------------------------------------
// Claims: which employee at a warehouse is handling an order
// ---------------------------------------------------------------------------------------------

export interface EmployeeRef {
  employeeId: string;
  tenantId: string;
  warehouseId: string;
  fullName: string;
}

async function warehouseName(tenantId: string, warehouseId: string): Promise<string | null> {
  const { data } = await db.from('warehouses').select('warehouse_name').eq('warehouse_id', warehouseId).eq('tenant_id', tenantId).maybeSingle();
  return data?.warehouse_name ?? null;
}

async function explainClaimFailure(tenantId: string, employee: EmployeeRef, orderId: string): Promise<never> {
  const { data: order } = await db
    .from('orders')
    .select('status, fulfillment_warehouse_id, claimed_by_employee_id, claimed_by:warehouse_employees!claimed_by_employee_id(full_name)')
    .eq('order_id', orderId)
    .eq('tenant_id', tenantId)
    .maybeSingle();
  if (!order || order.fulfillment_warehouse_id !== employee.warehouseId) throw notFound('Order not found');
  const claimer: any = Array.isArray(order.claimed_by) ? order.claimed_by[0] : order.claimed_by;
  if (order.claimed_by_employee_id && order.claimed_by_employee_id !== employee.employeeId) {
    throw new ApiError(409, `${claimer?.full_name ?? 'A colleague'} is already handling this order.`, undefined, 'ORDER_CLAIMED');
  }
  throw new ApiError(409, 'This order can no longer be claimed.');
}

/** Atomic: a single conditional UPDATE, so of two employees clicking at once exactly one wins. */
export async function claimOrder(tenantId: string, employee: EmployeeRef, orderId: string): Promise<{ already: boolean }> {
  const { data } = await db
    .from('orders')
    .update({ claimed_by_employee_id: employee.employeeId, claimed_date: new Date().toISOString() })
    .eq('order_id', orderId)
    .eq('tenant_id', tenantId)
    .eq('fulfillment_warehouse_id', employee.warehouseId)
    .in('status', OPEN_STATUSES)
    .is('claimed_by_employee_id', null)
    .select('order_id, order_number')
    .maybeSingle();

  if (!data) {
    const { data: mine } = await db
      .from('orders')
      .select('order_id')
      .eq('order_id', orderId)
      .eq('tenant_id', tenantId)
      .eq('fulfillment_warehouse_id', employee.warehouseId)
      .eq('claimed_by_employee_id', employee.employeeId)
      .maybeSingle();
    if (mine) return { already: true };
    return explainClaimFailure(tenantId, employee, orderId);
  }

  void logActivity({
    tenantId,
    actor: { type: 'EMPLOYEE', employeeId: employee.employeeId, name: employee.fullName },
    action: 'ORDER_CLAIMED',
    warehouse: { id: employee.warehouseId, name: await warehouseName(tenantId, employee.warehouseId) },
    order: { id: orderId, number: data.order_number },
  });
  return { already: false };
}

export async function unclaimOrder(tenantId: string, employee: EmployeeRef, orderId: string): Promise<void> {
  const { data } = await db
    .from('orders')
    .update({ claimed_by_employee_id: null, claimed_date: null })
    .eq('order_id', orderId)
    .eq('tenant_id', tenantId)
    .eq('fulfillment_warehouse_id', employee.warehouseId)
    .eq('claimed_by_employee_id', employee.employeeId)
    .select('order_id, order_number')
    .maybeSingle();
  if (!data) throw new ApiError(409, 'You are not handling this order.');

  void logActivity({
    tenantId,
    actor: { type: 'EMPLOYEE', employeeId: employee.employeeId, name: employee.fullName },
    action: 'ORDER_UNCLAIMED',
    warehouse: { id: employee.warehouseId, name: await warehouseName(tenantId, employee.warehouseId) },
    order: { id: orderId, number: data.order_number },
  });
}

/**
 * Before an employee changes an order: it must be theirs or nobody's. An unclaimed open order is claimed for them
 * on the spot, so two people never work the same order without noticing.
 */
export async function assertCanHandle(tenantId: string, employee: EmployeeRef, orderId: string): Promise<void> {
  const { data: order } = await db
    .from('orders')
    .select('status, claimed_by_employee_id')
    .eq('order_id', orderId)
    .eq('tenant_id', tenantId)
    .eq('fulfillment_warehouse_id', employee.warehouseId)
    .maybeSingle();
  if (!order) throw notFound('Order not found');
  if (order.claimed_by_employee_id === employee.employeeId) return;
  if (order.claimed_by_employee_id) return explainClaimFailure(tenantId, employee, orderId);
  if (OPEN_STATUSES.includes(order.status)) await claimOrder(tenantId, employee, orderId);
}

/** The merchant clears whoever is handling an order (e.g. the employee is away). */
export async function clearClaim(tenantId: string, orderId: string, actor: Actor): Promise<void> {
  const { data } = await db
    .from('orders')
    .update({ claimed_by_employee_id: null, claimed_date: null })
    .eq('order_id', orderId)
    .eq('tenant_id', tenantId)
    .not('claimed_by_employee_id', 'is', null)
    .select('order_id, order_number, fulfillment_warehouse_id')
    .maybeSingle();
  if (!data) throw new ApiError(409, 'Nobody is handling this order.');
  void logActivity({
    tenantId,
    actor,
    action: 'ORDER_UNCLAIMED',
    warehouse: data.fulfillment_warehouse_id ? { id: data.fulfillment_warehouse_id, name: await warehouseName(tenantId, data.fulfillment_warehouse_id) } : null,
    order: { id: orderId, number: data.order_number },
    note: 'Cleared by the store owner',
  });
}

// ---------------------------------------------------------------------------------------------
// Merchant view: where could this order go?
// ---------------------------------------------------------------------------------------------

export async function getAssignmentInfo(tenantId: string, orderId: string) {
  const { data: order, error } = await db
    .from('orders')
    .select(
      'order_id, order_number, status, fulfillment_warehouse_id, claimed_by_employee_id, claimed_date, assigned_date, shipping_latitude, shipping_longitude, claimed_by:warehouse_employees!claimed_by_employee_id(full_name), order_items(product_id, product_name, sku, quantity)',
    )
    .eq('order_id', orderId)
    .eq('tenant_id', tenantId)
    .maybeSingle();
  if (error) throw error;
  if (!order) throw notFound('Order not found');

  const [{ data: warehouses }, counts] = await Promise.all([
    db
      .from('warehouses')
      .select('warehouse_id, warehouse_name, city, state_province, latitude, longitude, daily_capacity, is_active')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('warehouse_name'),
    callRpc<Array<{ warehouse_id: string; open_orders: number | string }>>('warehouse_open_order_counts', { p_tenant: tenantId }),
  ]);

  const items = (order.order_items ?? []) as RawLine[];
  const needs = (await resolveNeeds(tenantId, [{ order_id: order.order_id, order_items: items }])).get(order.order_id) ?? [];
  const fit = (await evaluateFit(tenantId, new Map([[order.order_id, needs]]), (warehouses ?? []).map((w) => w.warehouse_id))).get(order.order_id)!;
  const open = new Map((counts ?? []).map((c) => [c.warehouse_id, Number(c.open_orders)]));
  const claimer: any = Array.isArray(order.claimed_by) ? order.claimed_by[0] : order.claimed_by;
  const point = isValidPoint(Number(order.shipping_latitude), Number(order.shipping_longitude)) ? { lat: Number(order.shipping_latitude), lng: Number(order.shipping_longitude) } : null;

  return {
    order: {
      orderId: order.order_id,
      orderNumber: order.order_number,
      status: order.status,
      /** Only orders that are still waiting to ship can change warehouse. */
      movable: OPEN_STATUSES.includes(order.status),
      warehouseId: order.fulfillment_warehouse_id,
      claimedBy: order.claimed_by_employee_id ? { employeeId: order.claimed_by_employee_id, name: claimer?.full_name ?? null, since: order.claimed_date } : null,
      assignedAt: order.assigned_date,
    },
    lines: needs.map((n) => ({ name: n.name, quantity: n.quantity })),
    warehouses: (warehouses ?? []).map((w) => {
      const f = fit.get(w.warehouse_id) ?? { canFulfil: true, shortages: [] };
      const located = isValidPoint(Number(w.latitude), Number(w.longitude)) && point;
      return {
        warehouseId: w.warehouse_id,
        name: w.warehouse_name,
        city: w.city,
        state: w.state_province,
        isCurrent: w.warehouse_id === order.fulfillment_warehouse_id,
        canFulfil: f.canFulfil,
        shortages: f.shortages,
        distanceKm: located ? Math.round(haversineKm({ lat: Number(w.latitude), lng: Number(w.longitude) }, point!)) : null,
        openOrders: open.get(w.warehouse_id) ?? 0,
        dailyCapacity: w.daily_capacity,
      };
    }),
  };
}
