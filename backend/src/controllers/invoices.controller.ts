import type { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../lib/supabase.js';
import { badRequest, notFound, pageMeta, pagination, parse, uuid } from '../lib/http.js';
import { optionalText, optionalUuid, requiredMoney } from '../lib/validation.js';
import { tenantCtx } from '../middleware/auth.js';
import { assertOwnedOrNull } from '../services/ownership.js';

export const isoDate = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date')
  .optional();

export async function list(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const page = pagination(req.query);

  const { data, error, count } = await db
    .from('invoices')
    .select('*, customers(first_name, last_name, email), dealers(company_name), orders(order_number)', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_date', { ascending: false })
    .range(page.offset, page.offset + page.limit - 1);
  if (error) throw error;

  res.json({ data, meta: pageMeta(count, page) });
}

export async function create(req: Request, res: Response) {
  const { tenantId, userId } = tenantCtx(req);
  const body = parse(
    z.object({
      invoiceNumber: z.string().trim().min(1, 'Invoice number is required').max(100),
      grandTotal: requiredMoney,
      orderId: optionalUuid,
      customerId: optionalUuid,
      dealerId: optionalUuid,
      status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED']).optional(),
      issueDate: z.preprocess((v) => (v === '' ? undefined : v), isoDate),
      dueDate: z.preprocess((v) => (v === '' ? undefined : v), isoDate),
      subtotal: requiredMoney.optional(),
      taxTotal: requiredMoney.optional(),
      shippingTotal: requiredMoney.optional(),
      notes: optionalText(5000),
    }),
    req.body,
  );

  const orderId = await assertOwnedOrNull('orders', body.orderId, tenantId, 'order');
  const customerId = await assertOwnedOrNull('customers', body.customerId, tenantId, 'customer');
  const dealerId = await assertOwnedOrNull('dealers', body.dealerId, tenantId, 'dealer');

  const { data: invoice, error } = await db
    .from('invoices')
    .insert({
      tenant_id: tenantId,
      order_id: orderId,
      customer_id: customerId,
      dealer_id: dealerId,
      invoice_number: body.invoiceNumber,
      status: body.status ?? 'DRAFT',
      issue_date: (body.issueDate ? new Date(body.issueDate) : new Date()).toISOString().slice(0, 10),
      due_date: body.dueDate ? new Date(body.dueDate).toISOString().slice(0, 10) : null,
      subtotal: body.subtotal ?? 0,
      tax_total: body.taxTotal ?? 0,
      shipping_total: body.shippingTotal ?? 0,
      grand_total: body.grandTotal,
      amount_due: body.grandTotal,
      notes: body.notes ?? null,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') throw badRequest('Invoice number already exists');
    throw error;
  }

  res.status(201).json({ message: 'Invoice created successfully', data: invoice });
}

export async function getById(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const id = uuid(req.params.id);

  const [{ data: invoice, error }, { data: payments }] = await Promise.all([
    db
      .from('invoices')
      .select(
        '*, customers(customer_id, first_name, last_name, email, phone_number), dealers(dealer_id, company_name, contact_email, contact_phone), orders(order_id, order_number)',
      )
      .eq('invoice_id', id)
      .eq('tenant_id', tenantId)
      .maybeSingle(),
    db.from('payments').select('*').eq('invoice_id', id).eq('tenant_id', tenantId).order('payment_date', { ascending: false }),
  ]);
  if (error) throw error;
  if (!invoice) throw notFound('Invoice not found');

  res.json({ data: { ...invoice, payments: payments ?? [] } });
}

export async function update(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const id = uuid(req.params.id);
  const body = parse(
    z.object({
      status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED']).optional(),
      dueDate: z.preprocess((v) => (v === '' ? undefined : v), isoDate),
      notes: optionalText(5000),
    }),
    req.body,
  );

  const update: Record<string, unknown> = {};
  if (body.status !== undefined) update.status = body.status;
  if (body.dueDate !== undefined) update.due_date = new Date(body.dueDate).toISOString().slice(0, 10);
  if (body.notes !== undefined) update.notes = body.notes;
  if (Object.keys(update).length === 0) throw badRequest('Nothing to update');

  const { data, error } = await db
    .from('invoices')
    .update(update)
    .eq('invoice_id', id)
    .eq('tenant_id', tenantId)
    .select('invoice_id')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound('Invoice not found');

  res.json({ message: 'Invoice updated successfully' });
}
