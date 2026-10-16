import { db } from '../lib/supabase.js';
import { badRequest } from '../lib/http.js';
import { callRpc } from '../lib/rpc.js';

/**
 * What the merchant sees when monitoring the warehouse team. One row per action, with names copied in at the time
 * (so history stays readable after renames/removals) and before/after quantities for stock changes.
 */
export type ActivityAction =
  | 'STOCK_SET'
  | 'STOCK_ADJUST'
  | 'ORDER_STATUS'
  | 'ORDER_PAYMENT'
  | 'ORDER_CLAIMED'
  | 'ORDER_UNCLAIMED'
  | 'ORDER_TAKEN'
  | 'ORDER_RELEASED'
  | 'ORDER_ASSIGNED'
  | 'ORDER_UNASSIGNED'
  | 'WAREHOUSE_UPDATED';

export const ACTIVITY_ACTIONS: ActivityAction[] = [
  'STOCK_SET',
  'STOCK_ADJUST',
  'ORDER_STATUS',
  'ORDER_PAYMENT',
  'ORDER_CLAIMED',
  'ORDER_UNCLAIMED',
  'ORDER_TAKEN',
  'ORDER_RELEASED',
  'ORDER_ASSIGNED',
  'ORDER_UNASSIGNED',
  'WAREHOUSE_UPDATED',
];

export type Actor = { type: 'EMPLOYEE'; employeeId: string; name: string } | { type: 'ADMIN'; userId: string; name: string | null };

export interface ActivityInput {
  tenantId: string;
  actor: Actor;
  action: ActivityAction;
  warehouse?: { id: string; name: string | null } | null;
  product?: { id: string; name: string | null } | null;
  order?: { id: string; number: string | null } | null;
  before?: number | null;
  after?: number | null;
  note?: string | null;
  details?: Record<string, unknown> | null;
}

/** Records an action. Never throws: the audit trail must not be able to break the work it describes. */
export async function logActivity(input: ActivityInput): Promise<void> {
  try {
    const { error } = await db.from('warehouse_activity').insert({
      tenant_id: input.tenantId,
      actor_type: input.actor.type,
      employee_id: input.actor.type === 'EMPLOYEE' ? input.actor.employeeId : null,
      user_id: input.actor.type === 'ADMIN' ? input.actor.userId : null,
      actor_name: input.actor.name,
      warehouse_id: input.warehouse?.id ?? null,
      warehouse_name: input.warehouse?.name ?? null,
      action: input.action,
      product_id: input.product?.id ?? null,
      product_name: input.product?.name ?? null,
      order_id: input.order?.id ?? null,
      order_number: input.order?.number ?? null,
      quantity_before: input.before ?? null,
      quantity_after: input.after ?? null,
      quantity_change: input.before != null && input.after != null ? input.after - input.before : null,
      note: input.note?.slice(0, 500) ?? null,
      details: input.details ?? null,
    });
    if (error) console.error('[activity] failed to record', error.code);
  } catch (error) {
    console.error('[activity] failed to record', (error as Error)?.message);
  }
}

// ---------------------------------------------------------------------------------------------
// Keyset pagination: stable and O(page) however long the log grows (offset pagination re-reads every skipped row).
// ---------------------------------------------------------------------------------------------

const TS = /^\d{4}-\d{2}-\d{2}T[\d:.]+(?:Z|[+-]\d{2}:\d{2})$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function encodeCursor(createdDate: string, id: string): string {
  return Buffer.from(JSON.stringify([createdDate, id])).toString('base64url');
}

/** The timestamp is kept as the database's own string (microseconds) - a JS Date would round it and skip/duplicate rows. */
export function decodeCursor(cursor: string | undefined): { t: string; id: string } | null {
  if (!cursor) return null;
  try {
    const [t, id] = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (typeof t === 'string' && typeof id === 'string' && TS.test(t) && UUID.test(id)) return { t, id };
  } catch {
    // fall through
  }
  throw badRequest('Invalid cursor');
}

export interface ActivityFilters {
  employeeId?: string;
  warehouseId?: string;
  productId?: string;
  orderId?: string;
  actorType?: 'EMPLOYEE' | 'ADMIN';
  actions?: ActivityAction[];
  from?: string;
  to?: string;
  cursor?: string;
  limit: number;
}

const ACTIVITY_COLUMNS =
  'activity_id, actor_type, employee_id, actor_name, warehouse_id, warehouse_name, action, product_id, product_name, order_id, order_number, quantity_before, quantity_after, quantity_change, note, details, created_date';

export async function listActivity(tenantId: string, f: ActivityFilters) {
  let query = db.from('warehouse_activity').select(ACTIVITY_COLUMNS).eq('tenant_id', tenantId);
  if (f.employeeId) query = query.eq('employee_id', f.employeeId);
  if (f.warehouseId) query = query.eq('warehouse_id', f.warehouseId);
  if (f.productId) query = query.eq('product_id', f.productId);
  if (f.orderId) query = query.eq('order_id', f.orderId);
  if (f.actorType) query = query.eq('actor_type', f.actorType);
  if (f.actions?.length) query = query.in('action', f.actions);
  if (f.from) query = query.gte('created_date', f.from);
  if (f.to) query = query.lt('created_date', f.to);
  const cursor = decodeCursor(f.cursor);
  if (cursor) query = query.or(`created_date.lt.${cursor.t},and(created_date.eq.${cursor.t},activity_id.lt.${cursor.id})`);

  const { data, error } = await query.order('created_date', { ascending: false }).order('activity_id', { ascending: false }).limit(f.limit + 1);
  if (error) throw error;

  const rows = data ?? [];
  const page = rows.slice(0, f.limit);
  const last = page[page.length - 1];
  return { data: page, nextCursor: rows.length > f.limit && last ? encodeCursor(last.created_date, last.activity_id) : null };
}

export interface EmployeeSummaryRow {
  employee_id: string | null;
  employee_name: string | null;
  warehouse_id: string | null;
  warehouse_name: string | null;
  total_actions: number;
  stock_changes: number;
  units_added: number;
  units_removed: number;
  orders_taken: number;
  orders_updated: number;
  last_active: string | null;
}

export async function employeeSummary(tenantId: string, days: number): Promise<EmployeeSummaryRow[]> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const rows = await callRpc<Array<Record<string, unknown>>>('employee_activity_summary', { p_tenant: tenantId, p_since: since });
  // bigint columns come back as numbers or strings depending on size; the UI wants numbers.
  return (rows ?? []).map((r) => ({
    employee_id: (r.employee_id as string | null) ?? null,
    employee_name: (r.employee_name as string | null) ?? null,
    warehouse_id: (r.warehouse_id as string | null) ?? null,
    warehouse_name: (r.warehouse_name as string | null) ?? null,
    total_actions: Number(r.total_actions),
    stock_changes: Number(r.stock_changes),
    units_added: Number(r.units_added),
    units_removed: Number(r.units_removed),
    orders_taken: Number(r.orders_taken),
    orders_updated: Number(r.orders_updated),
    last_active: (r.last_active as string | null) ?? null,
  }));
}

// ---------------------------------------------------------------------------------------------
// Stock ledger of one product: every quantity change at every warehouse, with who made it
// ---------------------------------------------------------------------------------------------

export async function listStockHistory(tenantId: string, f: { productId: string; warehouseId?: string; employeeId?: string; cursor?: string; limit: number }) {
  let query = db
    .from('inventory_transactions')
    .select(
      'transaction_id, transaction_type, quantity_change, quantity_after, notes, reference_id, created_date, actor_name, actor_employee_id, inventory!inner(warehouse_id, warehouses(warehouse_name), product_variants!inner(product_id))',
    )
    .eq('tenant_id', tenantId)
    .eq('inventory.product_variants.product_id', f.productId);
  if (f.warehouseId) query = query.eq('inventory.warehouse_id', f.warehouseId);
  if (f.employeeId) query = query.eq('actor_employee_id', f.employeeId);
  const cursor = decodeCursor(f.cursor);
  if (cursor) query = query.or(`created_date.lt.${cursor.t},and(created_date.eq.${cursor.t},transaction_id.lt.${cursor.id})`);

  const { data, error } = await query.order('created_date', { ascending: false }).order('transaction_id', { ascending: false }).limit(f.limit + 1);
  if (error) throw error;

  const rows = data ?? [];
  const page = rows.slice(0, f.limit).map((r: any) => {
    const inv = Array.isArray(r.inventory) ? r.inventory[0] : r.inventory;
    const warehouse = Array.isArray(inv?.warehouses) ? inv.warehouses[0] : inv?.warehouses;
    return {
      transactionId: r.transaction_id as string,
      type: r.transaction_type as string,
      change: r.quantity_change as number,
      quantityAfter: (r.quantity_after as number | null) ?? null,
      notes: (r.notes as string | null) ?? null,
      orderId: (r.reference_id as string | null) ?? null,
      actorName: (r.actor_name as string | null) ?? null,
      employeeId: (r.actor_employee_id as string | null) ?? null,
      warehouseId: (inv?.warehouse_id as string | undefined) ?? null,
      warehouseName: (warehouse?.warehouse_name as string | undefined) ?? null,
      createdAt: r.created_date as string,
    };
  });
  const last = rows.length > f.limit ? (rows[f.limit - 1] as any) : null;
  return { data: page, nextCursor: last ? encodeCursor(last.created_date, last.transaction_id) : null };
}
