import type { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../lib/supabase.js';
import { badRequest, notFound, pageMeta, pagination, parse, str, uuid } from '../lib/http.js';
import { optionalText } from '../lib/validation.js';
import { tenantCtx } from '../middleware/auth.js';
import { addressSchema, editWindow, phoneValue, staffRespond } from '../services/order-support.js';
import { applyRefundAction, refundActionSchema, type RefundRow } from '../services/refunds.js';

const REQUEST_STATUSES = ['OPEN', 'AI_RESOLVED', 'ESCALATED', 'RESOLVED', 'CLOSED'] as const;
const REFUND_STATUSES = ['REQUESTED', 'APPROVED', 'PROCESSED', 'REJECTED'] as const;

const ORDER_SUMMARY =
  'order_id, order_number, status, payment_status, payment_method, grand_total, currency, created_date, shipping_name, shipping_phone, shipping_address_line_1, shipping_landmark, shipping_city, shipping_state, shipping_postal_code, estimated_delivery_date';

// ---------------------------------------------------------------------------------------------
// Support requests
// ---------------------------------------------------------------------------------------------

export async function listRequests(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const page = pagination(req.query, 20, 50);
  const status = str(req.query.status);

  let query = db
    .from('order_support_requests')
    .select(`*, orders(${ORDER_SUMMARY}), customers(first_name, last_name, phone_number, email)`, { count: 'exact' })
    .eq('tenant_id', tenantId);
  if (status === 'ACTIVE') query = query.in('status', ['OPEN', 'ESCALATED']);
  else if (status && (REQUEST_STATUSES as readonly string[]).includes(status)) query = query.eq('status', status);

  const { data, error, count } = await query.order('updated_date', { ascending: false }).range(page.offset, page.offset + page.limit - 1);
  if (error) throw error;

  res.json({
    data: (data ?? []).map((r: any) => ({ ...r, edit_window: r.orders ? editWindow(r.orders) : null })),
    meta: pageMeta(count, page),
  });
}

export async function respondToRequest(req: Request, res: Response) {
  const { tenantId, userId } = tenantCtx(req);
  const body = parse(
    z.object({
      message: optionalText(1000),
      applyProposed: z.boolean().optional(),
      resolve: z.boolean().optional(),
      change: z
        .discriminatedUnion('type', [
          z.object({ type: z.literal('change_phone'), phone: phoneValue }),
          z.object({ type: z.literal('change_address'), address: addressSchema }),
        ])
        .optional(),
    }),
    req.body,
  );
  if (!body.message && !body.applyProposed && !body.resolve && !body.change) throw badRequest('Nothing to send');

  const request = await staffRespond({
    tenantId,
    userId,
    requestId: uuid(req.params.id),
    message: body.message,
    applyProposed: body.applyProposed,
    resolve: body.resolve,
    directChange: body.change,
  });
  res.json({ data: request });
}

// ---------------------------------------------------------------------------------------------
// Refunds
// ---------------------------------------------------------------------------------------------

export async function listRefunds(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const page = pagination(req.query, 20, 50);
  const status = str(req.query.status);

  let query = db
    .from('order_refunds')
    .select(`*, orders(order_number, grand_total, currency, payment_method, status), customers(first_name, last_name, phone_number, email)`, { count: 'exact' })
    .eq('tenant_id', tenantId);
  const orderId = str(req.query.orderId);
  if (orderId) query = query.eq('order_id', uuid(orderId, 'order id'));
  if (status === 'ACTIVE') query = query.in('status', ['REQUESTED', 'APPROVED']);
  else if (status && (REFUND_STATUSES as readonly string[]).includes(status)) query = query.eq('status', status);

  const { data, error, count } = await query.order('created_date', { ascending: false }).range(page.offset, page.offset + page.limit - 1);
  if (error) throw error;
  res.json({ data, meta: pageMeta(count, page) });
}

export async function actOnRefund(req: Request, res: Response) {
  const { tenantId, userId } = tenantCtx(req);
  const action = parse(refundActionSchema, req.body);
  const refund: RefundRow = await applyRefundAction({ tenantId, userId, refundId: uuid(req.params.id), action });
  res.json({ message: 'Refund updated', data: refund });
}

/** Counts for the dashboard badges. */
export async function counts(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const [requests, refunds] = await Promise.all([
    db.from('order_support_requests').select('request_id', { count: 'exact', head: true }).eq('tenant_id', tenantId).in('status', ['OPEN', 'ESCALATED']),
    db.from('order_refunds').select('refund_id', { count: 'exact', head: true }).eq('tenant_id', tenantId).in('status', ['REQUESTED', 'APPROVED']),
  ]);
  res.json({ openRequests: requests.count ?? 0, openRefunds: refunds.count ?? 0 });
}

// ---------------------------------------------------------------------------------------------
// Staff edit of an order's delivery details (no 24h limit - the store team may always fix a mistake before delivery)
// ---------------------------------------------------------------------------------------------

export async function updateShipping(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const id = uuid(req.params.id);
  const body = parse(
    z.object({
      name: optionalText(200),
      phone: phoneValue.optional(),
      line1: optionalText(255),
      landmark: optionalText(255),
      city: optionalText(100),
      state: optionalText(100),
      postalCode: optionalText(20),
    }),
    req.body,
  );

  const { data: order } = await db.from('orders').select('order_id, status').eq('order_id', id).eq('tenant_id', tenantId).maybeSingle();
  if (!order) throw notFound('Order not found');
  if (['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.status)) throw badRequest(`This order is ${order.status.toLowerCase()}; its delivery details cannot be changed.`);

  const update: Record<string, unknown> = { shipping_updated_date: new Date().toISOString() };
  if (body.name !== undefined) update.shipping_name = body.name;
  if (body.phone !== undefined) update.shipping_phone = body.phone;
  if (body.line1 !== undefined) update.shipping_address_line_1 = body.line1;
  if (body.landmark !== undefined) update.shipping_landmark = body.landmark;
  if (body.city !== undefined) update.shipping_city = body.city;
  if (body.state !== undefined) update.shipping_state = body.state;
  if (body.postalCode !== undefined) update.shipping_postal_code = body.postalCode;
  if (Object.keys(update).length === 1) throw badRequest('Nothing to update');

  const { error } = await db.from('orders').update(update).eq('order_id', id).eq('tenant_id', tenantId);
  if (error) throw error;
  res.json({ message: 'Delivery details updated' });
}
