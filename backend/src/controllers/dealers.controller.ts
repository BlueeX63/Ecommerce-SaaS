import type { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../lib/supabase.js';
import { badRequest, notFound, pageMeta, pagination, parse, uuid } from '../lib/http.js';
import { emailField, optionalNumber, optionalPhone, optionalText } from '../lib/validation.js';
import { tenantCtx } from '../middleware/auth.js';

const STATUS = z.enum(['ACTIVE', 'INACTIVE']);

export async function list(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const page = pagination(req.query);

  const { data, error, count } = await db
    .from('dealers')
    .select('*, dealer_branches(branch_name, city)', { count: 'exact' })
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
      companyName: z.string().trim().min(1, 'Company name is required').max(255),
      taxId: optionalText(50),
      contactName: optionalText(200),
      contactEmail: z.preprocess((v) => (v === '' || v === null ? undefined : v), emailField.optional()),
      contactPhone: optionalPhone,
      paymentTerms: optionalText(100),
      creditLimit: optionalNumber(0, 1_000_000_000),
    }),
    req.body,
  );

  const { data: dealer, error } = await db
    .from('dealers')
    .insert({
      tenant_id: tenantId,
      company_name: body.companyName,
      tax_id: body.taxId ?? null,
      contact_name: body.contactName ?? null,
      contact_email: body.contactEmail ?? null,
      contact_phone: body.contactPhone ?? null,
      payment_terms: body.paymentTerms ?? null,
      credit_limit: body.creditLimit ?? 0,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') throw badRequest('Dealer company name already exists');
    throw error;
  }

  res.status(201).json({ message: 'Dealer created successfully', data: dealer });
}

export async function update(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const id = uuid(req.params.id);
  const body = parse(
    z.object({
      companyName: z.string().trim().min(1).max(255).optional(),
      taxId: optionalText(50),
      contactName: optionalText(200),
      contactEmail: z.preprocess((v) => (v === '' || v === null ? undefined : v), emailField.optional()),
      contactPhone: optionalPhone,
      paymentTerms: optionalText(100),
      creditLimit: optionalNumber(0, 1_000_000_000),
      status: STATUS.optional(),
    }),
    req.body,
  );

  const update: Record<string, unknown> = {};
  if (body.companyName !== undefined) update.company_name = body.companyName;
  if (body.taxId !== undefined) update.tax_id = body.taxId;
  if (body.contactName !== undefined) update.contact_name = body.contactName;
  if (body.contactEmail !== undefined) update.contact_email = body.contactEmail;
  if (body.contactPhone !== undefined) update.contact_phone = body.contactPhone;
  if (body.paymentTerms !== undefined) update.payment_terms = body.paymentTerms;
  if (body.creditLimit !== undefined) update.credit_limit = body.creditLimit;
  if (body.status !== undefined) update.status = body.status;
  if (Object.keys(update).length === 0) throw badRequest('Nothing to update');

  const { data, error } = await db
    .from('dealers')
    .update(update)
    .eq('dealer_id', id)
    .eq('tenant_id', tenantId)
    .select('dealer_id')
    .maybeSingle();
  if (error) {
    if (error.code === '23505') throw badRequest('Dealer company name already exists');
    throw error;
  }
  if (!data) throw notFound('Dealer not found');

  res.json({ message: 'Dealer updated successfully' });
}

export async function remove(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const id = uuid(req.params.id);

  const { data, error } = await db
    .from('dealers')
    .update({ status: 'INACTIVE' })
    .eq('dealer_id', id)
    .eq('tenant_id', tenantId)
    .select('dealer_id')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound('Dealer not found');

  res.json({ message: 'Dealer deactivated successfully' });
}
