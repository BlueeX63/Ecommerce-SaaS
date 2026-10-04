import type { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../lib/supabase.js';
import { str, uuid, parse } from '../lib/http.js';
import { optionalText, optionalUuid } from '../lib/validation.js';
import { tenantCtx } from '../middleware/auth.js';
import { assertOwnedOrNull } from '../services/ownership.js';
import { fromCents, toCents } from '../services/pricing.js';

export async function list(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const invoiceId = str(req.query.invoiceId);
  const orderId = str(req.query.orderId);

  let query = db.from('payments').select('*').eq('tenant_id', tenantId);
  if (invoiceId) query = query.eq('invoice_id', uuid(invoiceId, 'invoiceId'));
  if (orderId) query = query.eq('order_id', uuid(orderId, 'orderId'));

  const { data, error } = await query.order('payment_date', { ascending: false }).limit(500);
  if (error) throw error;
  res.json({ data });
}

export async function create(req: Request, res: Response) {
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
}
