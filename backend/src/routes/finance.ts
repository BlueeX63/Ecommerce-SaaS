import { Router } from 'express';
import { z } from 'zod';
import { db } from '../lib/supabase.js';
import { badRequest, notFound, pageMeta, pagination, parse, str, uuid } from '../lib/http.js';
import { optionalText, optionalUuid, requiredMoney } from '../lib/validation.js';
import { requireMerchant, tenantCtx } from '../middleware/auth.js';
import { assertOwnedOrNull } from '../services/ownership.js';
import { fromCents, toCents } from '../services/pricing.js';

export const invoicesRouter = Router();
export const paymentsRouter = Router();
invoicesRouter.use(requireMerchant);
paymentsRouter.use(requireMerchant);

const isoDate = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date')
  .optional();

invoicesRouter.get('/', async (req, res) => {
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
});

invoicesRouter.post('/', async (req, res) => {
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
});

invoicesRouter.get('/:id', async (req, res) => {
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
});

invoicesRouter.put('/:id', async (req, res) => {
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
});

paymentsRouter.get('/', async (req, res) => {
  const { tenantId } = tenantCtx(req);
  const invoiceId = str(req.query.invoiceId);
  const orderId = str(req.query.orderId);

  let query = db.from('payments').select('*').eq('tenant_id', tenantId);
  if (invoiceId) query = query.eq('invoice_id', uuid(invoiceId, 'invoiceId'));
  if (orderId) query = query.eq('order_id', uuid(orderId, 'orderId'));

  const { data, error } = await query.order('payment_date', { ascending: false }).limit(500);
  if (error) throw error;
  res.json({ data });
});

paymentsRouter.post('/', async (req, res) => {
  const { tenantId, userId } = tenantCtx(req);
  const body = parse(
    z.object({
      amount: z.coerce.number().gt(0, 'Amount must be greater than zero').max(1_000_000_000),
      paymentMethod: z.enum(['CREDIT_CARD', 'PAYPAL', 'BANK_TRANSFER', 'CASH', 'STORE_CREDIT']),
      invoiceId: optionalUuid,
      orderId: optionalUuid,
      transactionId: optionalText(255),
      status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']).optional(),
    }),
    req.body,
  );

  const invoiceId = await assertOwnedOrNull('invoices', body.invoiceId, tenantId, 'invoice');
  const orderId = await assertOwnedOrNull('orders', body.orderId, tenantId, 'order');
  const status = body.status ?? 'COMPLETED';

  const { data: payment, error } = await db
    .from('payments')
    .insert({
      tenant_id: tenantId,
      invoice_id: invoiceId,
      order_id: orderId,
      payment_method: body.paymentMethod,
      transaction_id: body.transactionId ?? null,
      amount: body.amount,
      status,
      created_by: userId,
    })
    .select()
    .single();
  if (error) throw error;

  // Keep the invoice balance in step with completed payments (always scoped to this tenant).
  if (invoiceId && status === 'COMPLETED') {
    const { data: invoice } = await db
      .from('invoices')
      .select('amount_paid, grand_total')
      .eq('invoice_id', invoiceId)
      .eq('tenant_id', tenantId)
      .maybeSingle();
    if (invoice) {
      const paid = toCents(invoice.amount_paid) + toCents(body.amount);
      const due = toCents(invoice.grand_total) - paid;
      await db
        .from('invoices')
        .update({ amount_paid: fromCents(paid), amount_due: fromCents(due), status: due <= 0 ? 'PAID' : 'SENT' })
        .eq('invoice_id', invoiceId)
        .eq('tenant_id', tenantId);
    }
  }

  res.status(201).json({ message: 'Payment recorded successfully', data: payment });
});
