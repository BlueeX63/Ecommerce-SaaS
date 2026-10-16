import type { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../lib/supabase.js';
import { badRequest, escapeLike, notFound, pageMeta, pagination, parse, str, uuid } from '../lib/http.js';
import { optionalText, optionalUuid, requiredMoney } from '../lib/validation.js';
import { tenantCtx } from '../middleware/auth.js';
import { assertOwnedOrNull, assertVariantOwned } from '../services/ownership.js';
import { updateOrder } from '../services/order-updates.js';
import {
  DEFAULT_NEARBY_KM,
  RELATED_MATCHES,
  applyDelayed,
  delayDays,
  loadReference,
  orderCounts,
  relatedCounts,
  relatedFilter,
  type RelatedMatch,
} from '../services/order-search.js';

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

/**
 * Order lines only store the product's name and price (so history survives edits and deletions), so the picture is
 * looked up by name among this store's products. A renamed or deleted product simply has no picture.
 */
async function imagesByProductName(tenantId: string, names: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(names.filter(Boolean))];
  const result = new Map<string, string>();
  if (unique.length === 0) return result;
  const { data } = await db
    .from('products')
    .select('product_name, created_date, product_images(image_url, is_primary, sort_order)')
    .eq('tenant_id', tenantId)
    .in('product_name', unique)
    .order('created_date', { ascending: false });
  for (const p of data ?? []) {
    const key = String(p.product_name).trim().toLowerCase();
    if (result.has(key)) continue; // newest product with that name wins
    const images = [...((p as any).product_images ?? [])].sort((a, b) => Number(!!b.is_primary) - Number(!!a.is_primary) || (a.sort_order ?? 0) - (b.sort_order ?? 0));
    if (images[0]?.image_url) result.set(key, images[0].image_url);
  }
  return result;
}

const withImage = (images: Map<string, string>, name: string) => images.get(String(name).trim().toLowerCase()) ?? null;

async function assertOrderInTenant(orderId: string, tenantId: string) {
  const { data } = await db.from('orders').select('order_id').eq('order_id', orderId).eq('tenant_id', tenantId).maybeSingle();
  if (!data) throw notFound('Order not found');
}

/**
 * Pictures for order lines. Lines remember their product, so that is used when present (it survives renames);
 * older lines fall back to matching by name.
 */
async function itemImages(tenantId: string, items: Array<{ product_id?: string | null; product_name: string }>) {
  const ids = [...new Set(items.map((i) => i.product_id).filter((id): id is string => !!id))];
  const byId = new Map<string, string>();
  if (ids.length) {
    const { data } = await db.from('products').select('product_id, product_images(image_url, is_primary, sort_order)').eq('tenant_id', tenantId).in('product_id', ids);
    for (const p of data ?? []) {
      const images = [...((p as any).product_images ?? [])].sort((x, y) => Number(!!y.is_primary) - Number(!!x.is_primary) || (x.sort_order ?? 0) - (y.sort_order ?? 0));
      if (images[0]?.image_url) byId.set(p.product_id, images[0].image_url);
    }
  }
  const byName = await imagesByProductName(tenantId, items.filter((i) => !i.product_id || !byId.has(i.product_id)).map((i) => i.product_name));
  return (item: { product_id?: string | null; product_name: string }) => (item.product_id ? byId.get(item.product_id) : undefined) ?? withImage(byName, item.product_name);
}

const csv = (value: unknown, allowed: readonly string[], label: string): string[] | undefined => {
  const parts = str(value)?.split(',').map((v) => v.trim().toUpperCase()).filter(Boolean);
  if (!parts?.length) return undefined;
  if (parts.some((v) => !allowed.includes(v))) throw badRequest(`Unknown ${label} filter`);
  return parts;
};

const LIST_SELECT =
  '*, customers(first_name, last_name, email), dealers(company_name), warehouses(warehouse_name, city), claimed_by:warehouse_employees!claimed_by_employee_id(full_name), order_items(product_id, product_name, quantity)';

/**
 * The orders list. Filters (all optional, combinable):
 *   status=PENDING,SHIPPED  paymentStatus=UNPAID  delayed=true   q=<order no. / name / phone>
 *   related=<order id>&match=person|address|nearby[&radiusKm=3]   (orders of the same person / address / area)
 */
export async function list(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const page = pagination(req.query);

  const statuses = csv(req.query.status, ORDER_STATUS.options, 'status');
  const payments = csv(req.query.paymentStatus, PAYMENT_STATUS.options, 'payment status');
  const delayed = str(req.query.delayed) === 'true';
  const search = str(req.query.q)?.replace(/[,()*%]/g, ' ').trim().slice(0, 100);

  const relatedId = str(req.query.related);
  const match = str(req.query.match) as RelatedMatch | undefined;
  if (relatedId && !(match && RELATED_MATCHES.includes(match))) throw badRequest('Choose person, address or nearby');
  const radiusKm = Math.min(50, Math.max(0.5, Number(str(req.query.radiusKm)) || DEFAULT_NEARBY_KM));
  const reference = relatedId ? await loadReference(tenantId, uuid(relatedId, 'related')) : null;
  const related = reference && match ? relatedFilter(reference, match, radiusKm) : null;

  let query = db.from('orders').select(LIST_SELECT, { count: 'exact' }).eq('tenant_id', tenantId);
  if (statuses) query = query.in('status', statuses);
  if (payments) query = query.in('payment_status', payments);
  if (delayed) query = applyDelayed(query);
  if (search) {
    const like = `%${escapeLike(search)}%`;
    query = query.or(`order_number.ilike.${like},shipping_name.ilike.${like},shipping_phone.ilike.${like}`);
  }
  if (related) query = related.apply(query);
  // Most overdue first when looking at delayed orders; otherwise newest first.
  query = delayed ? query.order('estimated_delivery_date', { ascending: true }) : query.order('created_date', { ascending: false });

  let data: any[] | null;
  let count: number | null;
  const distances = new Map<string, number | null>();
  if (related?.post) {
    // "Nearby" needs an exact distance check the database cannot do, so take the (small) candidate set and page it here.
    const { data: candidates, error } = await query.limit(500);
    if (error) throw error;
    const kept = (candidates ?? []).filter((row: any) => {
      const verdict = related.post!(row);
      if (verdict.keep) distances.set(row.order_id, verdict.distanceKm);
      return verdict.keep;
    });
    count = kept.length;
    data = kept.slice(page.offset, page.offset + page.limit);
  } else {
    const result = await query.range(page.offset, page.offset + page.limit - 1);
    if (result.error) throw result.error;
    data = result.data;
    count = result.count;
  }

  const imageOf = await itemImages(tenantId, (data ?? []).flatMap((o: any) => o.order_items ?? []));
  const now = Date.now();
  const rows = (data ?? []).map((o: any) => {
    const late = delayDays(o, now);
    return {
      ...o,
      delay_days: late,
      is_delayed: late > 0,
      distance_km: distances.get(o.order_id) ?? null,
      order_items: (o.order_items ?? []).map((i: any) => ({ ...i, image_url: imageOf(i) })),
    };
  });

  res.json({
    data: rows,
    meta: pageMeta(count, page),
    ...(reference ? { related: { match, radiusKm, orderId: reference.order_id, orderNumber: reference.order_number, name: reference.shipping_name } } : {}),
  });
}

/** Counts for the filter chips: total, per status, per payment status and delayed. */
export async function summary(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  res.json(await orderCounts(tenantId));
}

/** How many other orders the same person / same address / same area has (for the buttons on the order page). */
export async function relatedSummary(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const reference = await loadReference(tenantId, uuid(req.params.id));
  res.json({ nearbyRadiusKm: DEFAULT_NEARBY_KM, counts: await relatedCounts(tenantId, reference) });
}

export async function getById(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const id = uuid(req.params.id);

  const { data: order, error } = await db
    .from('orders')
    .select(
      '*, customers(customer_id, first_name, last_name, email, phone_number, company_name), dealers(*), order_items(*), fulfillments(*), warehouses(warehouse_id, warehouse_name, city, state_province), claimed_by:warehouse_employees!claimed_by_employee_id(full_name)',
    )
    .eq('order_id', id)
    .eq('tenant_id', tenantId)
    .maybeSingle();
  if (error) throw error;
  if (!order) throw notFound('Order not found');

  const imageOf = await itemImages(tenantId, order.order_items ?? []);
  const late = delayDays(order);
  res.json({
    data: { ...order, delay_days: late, is_delayed: late > 0, order_items: (order.order_items ?? []).map((i: any) => ({ ...i, image_url: imageOf(i) })) },
  });
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
