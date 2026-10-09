import { db } from '../lib/supabase.js';
import { badRequest, notFound } from '../lib/http.js';
import { invalidateEtaCaches } from './eta.js';
import { restockOrder } from './fulfillment.js';
import { queueRefundForCancelledOrder } from './refunds.js';

export interface OrderPatch {
  status?: string;
  paymentStatus?: string;
  fulfillmentStatus?: string;
  notes?: string | null;
}

/**
 * The one place an order's status changes. Used by the merchant dashboard and the warehouse employee panel so both
 * keep the same side effects: delivery timestamps (which feed the delivery-time estimator), stock coming back
 * when an order is cancelled, and a refund request for a cancelled order that was already paid online.
 *
 * `warehouseId` restricts the change to orders that warehouse is handling (employees).
 */
export async function updateOrder(opts: { tenantId: string; orderId: string; patch: OrderPatch; warehouseId?: string }) {
  const { tenantId, orderId, patch } = opts;

  let beforeQuery = db.from('orders').select('status, shipped_date, fulfillment_warehouse_id').eq('order_id', orderId).eq('tenant_id', tenantId);
  if (opts.warehouseId) beforeQuery = beforeQuery.eq('fulfillment_warehouse_id', opts.warehouseId);
  const { data: before } = await beforeQuery.maybeSingle();
  if (!before) throw notFound('Order not found');

  const update: Record<string, unknown> = {};
  if (patch.status) update.status = patch.status;
  if (patch.paymentStatus) update.payment_status = patch.paymentStatus;
  if (patch.fulfillmentStatus) update.fulfillment_status = patch.fulfillmentStatus;
  if (patch.notes !== undefined) update.notes = patch.notes;
  if (Object.keys(update).length === 0) throw badRequest('Nothing to update');

  const now = new Date().toISOString();
  if (patch.status === 'SHIPPED' && !before.shipped_date) update.shipped_date = now;
  if (patch.status === 'DELIVERED') {
    update.delivered_date = now;
    if (!before.shipped_date) update.shipped_date = now;
  }

  const { data, error } = await db
    .from('orders')
    .update(update)
    .eq('order_id', orderId)
    .eq('tenant_id', tenantId)
    .select('order_id, customer_id, status, payment_status, payment_method, grand_total, currency, fulfillment_warehouse_id')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound('Order not found');

  if (patch.status === 'CANCELLED' && before.status !== 'CANCELLED') {
    await restockOrder(tenantId, orderId).catch((e) => console.error('[orders] restock failed', e));
    await queueRefundForCancelledOrder(tenantId, data).catch((e) => console.error('[orders] refund queue failed', e));
  }
  if (patch.status === 'DELIVERED' && data.fulfillment_warehouse_id) void invalidateEtaCaches(data.fulfillment_warehouse_id);

  return data;
}
