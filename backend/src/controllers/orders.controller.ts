import type { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../lib/supabase.js';
import { badRequest, notFound, pageMeta, pagination, parse, uuid } from '../lib/http.js';
import { optionalText, optionalUuid, requiredMoney } from '../lib/validation.js';
import { tenantCtx } from '../middleware/auth.js';
import { assertOwnedOrNull, assertVariantOwned } from '../services/ownership.js';
import { updateOrder } from '../services/order-updates.js';

// Must match the `orders.status` CHECK constraint exactly - see migrations/011_delivery_and_coupons.sql,
// which replaces the narrower constraint from 006_orders.sql and adds RETURN_REQUESTED. The DB rejects
// anything else.
const ORDER_STATUS = z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'RETURN_REQUESTED']);
const PAYMENT_STATUS = z.enum(['UNPAID', 'PARTIALLY_PAID', 'PAID', 'REFUNDED']);
const FULFILLMENT_STATUS = z.enum(['UNFULFILLED', 'PARTIALLY_FULFILLED', 'FULFILLED']);
const FULFILL_STATUS = z.enum(['PENDING', 'SHIPPED', 'DELIVERED', 'RETURNED']);

const createSchema = z.object({
  orderNumber: z.string().trim().min(1, 'Order number is required').max(100),
  grandTotal: requiredMoney,
  customerId: optionalUuid,
  dealerId: optionalUuid,
  status: ORDER_STATUS.optional(),
  paymentStatus: PAYMENT_STATUS.optional(),
  fulfillmentStatus: FULFILLMENT_STATUS.optional(),
  subtotal: requiredMoney.optional(),
  taxTotal: requiredMoney.optional(),
  shippingTotal: requiredMoney.optional(),
  discountTotal: requiredMoney.optional(),
  items: z
    .array(
      z.object({
        variantId: optionalUuid,
        productName: z.string().trim().min(1).max(255),
        sku: optionalText(100),
        quantity: z.coerce.number().int().min(1).max(100_000),
        unitPrice: requiredMoney,
      }),
    )
    .max(500)
    .optional(),
});

async function assertOrderInTenant(orderId: string, tenantId: string) {
  const { data } = await db.from('orders').select('order_id').eq('order_id', orderId).eq('tenant_id', tenantId).maybeSingle();
  if (!data) throw notFound('Order not found');
}

export async function list(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const page = pagination(req.query);

  const { data, error, count } = await db
    .from('orders')
    .select('*, customers(first_name, last_name, email), dealers(company_name), warehouses(warehouse_name, city)', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_date', { ascending: false })
    .range(page.offset, page.offset + page.limit - 1);
  if (error) throw error;

  res.json({ data, meta: pageMeta(count, page) });
}

export async function getById(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const id = uuid(req.params.id);

  const { data: order, error } = await db
    .from('orders')
    .select(
      '*, customers(customer_id, first_name, last_name, email, phone_number, company_name), dealers(*), order_items(*), fulfillments(*), warehouses(warehouse_id, warehouse_name, city, state_province)',
    )
    .eq('order_id', id)
    .eq('tenant_id', tenantId)
    .maybeSingle();
  if (error) throw error;
  if (!order) throw notFound('Order not found');

  res.json({ data: order });
}

export async function create(req: Request, res: Response) {
  const { tenantId, userId } = tenantCtx(req);
  const body = parse(createSchema, req.body);

  const customerId = await assertOwnedOrNull('customers', body.customerId, tenantId, 'customer');
  const dealerId = await assertOwnedOrNull('dealers', body.dealerId, tenantId, 'dealer');
  for (const item of body.items ?? []) if (item.variantId) await assertVariantOwned(item.variantId, tenantId);

  const { data: order, error } = await db
    .from('orders')
    .insert({
      tenant_id: tenantId,
      customer_id: customerId,
      dealer_id: dealerId,
      order_number: body.orderNumber,
      status: body.status ?? 'PENDING',
      payment_status: body.paymentStatus ?? 'UNPAID',
      fulfillment_status: body.fulfillmentStatus ?? 'UNFULFILLED',
      subtotal: body.subtotal ?? 0,
      tax_total: body.taxTotal ?? 0,
      shipping_total: body.shippingTotal ?? 0,
      discount_total: body.discountTotal ?? 0,
      grand_total: body.grandTotal,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') throw badRequest('Order number already exists');
    throw error;
  }

  if (body.items?.length) {
    const { error: itemsError } = await db.from('order_items').insert(
      body.items.map((item) => ({
        order_id: order.order_id,
        variant_id: item.variantId ?? null,
        product_name: item.productName,
        sku: item.sku ?? null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: Math.round(item.quantity * item.unitPrice * 100) / 100,
      })),
    );
    if (itemsError) {
      await db.from('orders').delete().eq('order_id', order.order_id).eq('tenant_id', tenantId);
      throw itemsError;
    }
  }

  res.status(201).json({ message: 'Order created successfully', data: order });
}

export async function update(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const id = uuid(req.params.id);
  const body = parse(
    z.object({
      status: ORDER_STATUS.optional(),
      paymentStatus: PAYMENT_STATUS.optional(),
      fulfillmentStatus: FULFILLMENT_STATUS.optional(),
      notes: optionalText(5000),
    }),
    req.body,
  );

  await updateOrder({ tenantId, orderId: id, patch: body });

  res.json({ message: 'Order updated successfully' });
}

// ---------------------------------------------------------------------------------------------
// Fulfillments (shipment tracking). `fulfillments` has no tenant_id of its own - ownership is proven
// through the parent order, exactly like catalog_products/role_permissions elsewhere in this codebase.
// ---------------------------------------------------------------------------------------------

export async function createFulfillment(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const orderId = uuid(req.params.id);
  await assertOrderInTenant(orderId, tenantId);

  const body = parse(
    z.object({
      trackingNumber: optionalText(100),
      carrier: optionalText(100),
      status: FULFILL_STATUS.optional(),
    }),
    req.body,
  );
  const status = body.status ?? 'SHIPPED';

  const { data: fulfillment, error } = await db
    .from('fulfillments')
    .insert({
      order_id: orderId,
      tracking_number: body.trackingNumber ?? null,
      carrier: body.carrier ?? null,
      status,
      shipped_date: status === 'SHIPPED' || status === 'DELIVERED' ? new Date().toISOString() : null,
    })
    .select()
    .single();
  if (error) throw error;

  // Keep the order's own fulfillment_status roughly in sync with its shipments.
  if (status === 'DELIVERED' || status === 'SHIPPED') {
    // Keep the order itself in step with its shipment, including the timestamps the delivery estimator learns from.
    await updateOrder({
      tenantId,
      orderId,
      patch: { status, fulfillmentStatus: 'FULFILLED' },
    }).catch((e) => console.error('[orders] failed to sync order with shipment', e));
  }

  res.status(201).json({ message: 'Fulfillment recorded successfully', data: fulfillment });
}
