import { z } from 'zod';
import { db } from '../lib/supabase.js';
import { badRequest, notFound } from '../lib/http.js';

/**
 * Refunds.
 *  - Orders paid with UPI / netbanking are refunded to the original payment source (method SOURCE).
 *  - Cash on Delivery orders have no source to return money to, so the shopper supplies bank details
 *    (method BANK_TRANSFER) when applying.
 * There is no payment-gateway integration (shoppers pay the merchant directly), so the store team performs the
 * actual transfer and records it here; the shopper sees the status move REQUESTED -> APPROVED -> PROCESSED.
 */

export type RefundMethod = 'SOURCE' | 'BANK_TRANSFER';
export type RefundStatus = 'REQUESTED' | 'APPROVED' | 'PROCESSED' | 'REJECTED';

export const bankDetailsSchema = z.object({
  accountName: z.string().trim().min(2, 'Enter the account holder name').max(150),
  accountNumber: z.string().trim().regex(/^\d{6,20}$/, 'Account number must be 6-20 digits'),
  ifsc: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Enter a valid 11-character IFSC code, e.g. SBIN0001234'),
  bankName: z.string().trim().max(150).optional().nullable(),
});
export type BankDetails = z.infer<typeof bankDetailsSchema>;

interface RefundableOrder {
  order_id: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  grand_total: number | string;
  currency: string | null;
}

const REFUNDABLE_STATUSES = ['CANCELLED', 'RETURN_REQUESTED', 'DELIVERED'];

export interface RefundEligibility {
  eligible: boolean;
  reason: string | null;
  method: RefundMethod;
  needsBankDetails: boolean;
  amount: number;
}

export function refundEligibility(order: RefundableOrder, hasActiveRefund: boolean): RefundEligibility {
  const online = !!order.payment_method && order.payment_method !== 'cod';
  const method: RefundMethod = online ? 'SOURCE' : 'BANK_TRANSFER';
  const base = { method, needsBankDetails: method === 'BANK_TRANSFER', amount: Number(order.grand_total) };

  if (order.status === 'REFUNDED' || order.payment_status === 'REFUNDED') return { ...base, eligible: false, reason: 'This order has already been refunded.' };
  if (hasActiveRefund) return { ...base, eligible: false, reason: 'A refund is already in progress for this order.' };
  if (!REFUNDABLE_STATUSES.includes(order.status)) {
    return { ...base, eligible: false, reason: 'Refunds can be requested once an order is cancelled, delivered or has a return request.' };
  }
  if (order.status === 'CANCELLED' && !online && order.payment_status !== 'PAID') {
    return { ...base, eligible: false, reason: 'No payment was collected for this cancelled Cash on Delivery order, so there is nothing to refund.' };
  }
  return { ...base, eligible: true, reason: null };
}

const maskAccount = (n: string | null) => (n ? `${'•'.repeat(Math.max(0, n.length - 4))}${n.slice(-4)}` : null);

export interface RefundRow {
  refund_id: string;
  tenant_id: string;
  order_id: string;
  amount: number | string;
  currency: string | null;
  method: RefundMethod;
  source_payment_method: string | null;
  status: RefundStatus;
  reason: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  bank_name: string | null;
  reference: string | null;
  admin_note: string | null;
  created_date: string;
  processed_date: string | null;
}

/** Shopper-facing refund: the bank account number is masked. */
export function publicRefund(r: RefundRow) {
  return {
    refundId: r.refund_id,
    orderId: r.order_id,
    amount: Number(r.amount),
    currency: r.currency,
    method: r.method,
    sourcePaymentMethod: r.source_payment_method,
    status: r.status,
    reason: r.reason,
    bankAccount: r.method === 'BANK_TRANSFER' ? { name: r.bank_account_name, number: maskAccount(r.bank_account_number), ifsc: r.bank_ifsc } : null,
    reference: r.status === 'PROCESSED' ? r.reference : null,
    note: r.status === 'REJECTED' || r.status === 'PROCESSED' ? r.admin_note : null,
    requestedAt: r.created_date,
    processedAt: r.processed_date,
  };
}

async function activeRefund(tenantId: string, orderId: string) {
  const { data } = await db
    .from('order_refunds')
    .select('refund_id')
    .eq('tenant_id', tenantId)
    .eq('order_id', orderId)
    .in('status', ['REQUESTED', 'APPROVED'])
    .maybeSingle();
  return data;
}

export async function requestRefund(opts: {
  tenantId: string;
  customerId: string;
  orderId: string;
  reason: string;
  bank?: unknown;
}) {
  const { tenantId, customerId, orderId } = opts;
  const { data: order } = await db
    .from('orders')
    .select('order_id, status, payment_status, payment_method, grand_total, currency')
    .eq('order_id', orderId)
    .eq('tenant_id', tenantId)
    .eq('customer_id', customerId)
    .maybeSingle();
  if (!order) throw notFound('Order not found');

  const eligibility = refundEligibility(order, !!(await activeRefund(tenantId, orderId)));
  if (!eligibility.eligible) throw badRequest(eligibility.reason ?? 'This order is not eligible for a refund.');

  let bank: BankDetails | null = null;
  if (eligibility.needsBankDetails) {
    const parsed = bankDetailsSchema.safeParse(opts.bank);
    if (!parsed.success) {
      throw badRequest('Bank details are required for refunds on Cash on Delivery orders.', parsed.error.issues.map((i) => i.message));
    }
    bank = parsed.data;
  }

  const { data, error } = await db
    .from('order_refunds')
    .insert({
      tenant_id: tenantId,
      order_id: orderId,
      customer_id: customerId,
      amount: eligibility.amount,
      currency: order.currency,
      method: eligibility.method,
      source_payment_method: order.payment_method,
      reason: opts.reason,
      ...(bank ? { bank_account_name: bank.accountName, bank_account_number: bank.accountNumber, bank_ifsc: bank.ifsc, bank_name: bank.bankName ?? null } : {}),
    })
    .select('*')
    .single();
  if (error) {
    if (error.code === '23505') throw badRequest('A refund is already in progress for this order.');
    throw error;
  }
  return data as RefundRow;
}

/** Cancelling an order that was already paid online queues the refund automatically so money is never forgotten. */
export async function queueRefundForCancelledOrder(tenantId: string, order: RefundableOrder & { customer_id: string | null }) {
  const online = !!order.payment_method && order.payment_method !== 'cod';
  if (!online || order.payment_status !== 'PAID') return null;
  if (await activeRefund(tenantId, order.order_id)) return null;

  const { data, error } = await db
    .from('order_refunds')
    .insert({
      tenant_id: tenantId,
      order_id: order.order_id,
      customer_id: order.customer_id,
      amount: Number(order.grand_total),
      currency: order.currency,
      method: 'SOURCE',
      source_payment_method: order.payment_method,
      reason: 'Order cancelled by the customer',
    })
    .select('*')
    .maybeSingle();
  if (error && error.code !== '23505') throw error;
  return (data as RefundRow | null) ?? null;
}

// ---------------------------------------------------------------------------------------------
// Store team
// ---------------------------------------------------------------------------------------------

export const refundActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'mark_processed']),
  reference: z.string().trim().max(255).optional(),
  note: z.string().trim().max(1000).optional(),
});

export async function applyRefundAction(opts: { tenantId: string; userId: string; refundId: string; action: z.infer<typeof refundActionSchema> }) {
  const { tenantId, userId, refundId, action } = opts;
  const { data: refund } = await db.from('order_refunds').select('*').eq('refund_id', refundId).eq('tenant_id', tenantId).maybeSingle();
  if (!refund) throw notFound('Refund not found');
  const row = refund as RefundRow;

  if (row.status === 'PROCESSED' || row.status === 'REJECTED') throw badRequest(`This refund is already ${row.status.toLowerCase()}.`);

  const patch: Record<string, unknown> = { updated_date: new Date().toISOString(), processed_by: userId };
  if (action.note !== undefined) patch.admin_note = action.note || null;

  if (action.action === 'approve') {
    if (row.status !== 'REQUESTED') throw badRequest('Only new refund requests can be approved.');
    patch.status = 'APPROVED';
  } else if (action.action === 'reject') {
    if (!action.note) throw badRequest('Please add a note explaining why the refund was declined.');
    patch.status = 'REJECTED';
    patch.processed_date = new Date().toISOString();
  } else {
    if (!action.reference) throw badRequest('Add the transaction reference (UTR / transfer ID) so the shopper can trace it.');
    patch.status = 'PROCESSED';
    patch.reference = action.reference;
    patch.processed_date = new Date().toISOString();
  }

  const { data: updated, error } = await db
    .from('order_refunds')
    .update(patch)
    .eq('refund_id', refundId)
    .eq('tenant_id', tenantId)
    .eq('status', row.status)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  if (!updated) throw badRequest('This refund was just updated by someone else. Please refresh.');

  if (patch.status === 'PROCESSED') {
    await db.from('orders').update({ status: 'REFUNDED', payment_status: 'REFUNDED' }).eq('order_id', row.order_id).eq('tenant_id', tenantId);
  }
  return updated as RefundRow;
}
