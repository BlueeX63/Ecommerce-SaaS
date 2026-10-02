import { Router } from 'express';
import { z } from 'zod';
import { db } from '../lib/supabase.js';
import { badRequest, notFound, pageMeta, pagination, parse, uuid } from '../lib/http.js';
import { emailField, optionalNumber, optionalPhone, optionalText, optionalUuid } from '../lib/validation.js';
import { requireMerchant, tenantCtx } from '../middleware/auth.js';
import { assertOwnedOrNull } from '../services/ownership.js';

const STATUS = z.enum(['ACTIVE', 'INACTIVE']);

export const customersRouter = Router();
export const dealersRouter = Router();
customersRouter.use(requireMerchant);
dealersRouter.use(requireMerchant);

// Password hashes and other credentials must never be sent to the dashboard.
const CUSTOMER_COLUMNS =
  'customer_id, first_name, last_name, email, phone_number, company_name, group_id, status, is_verified, created_date, customer_groups(group_name)';

customersRouter.get('/', async (req, res) => {
  const { tenantId } = tenantCtx(req);
  const page = pagination(req.query);

  const { data, error, count } = await db
    .from('customers')
    .select(CUSTOMER_COLUMNS, { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_date', { ascending: false })
    .range(page.offset, page.offset + page.limit - 1);
  if (error) throw error;

  res.json({ data, meta: pageMeta(count, page) });
});

customersRouter.post('/', async (req, res) => {
  const { tenantId, userId } = tenantCtx(req);
  const body = parse(
    z.object({
      firstName: z.string().trim().min(1, 'First name is required').max(100),
      lastName: z.string().trim().min(1, 'Last name is required').max(100),
      email: z.preprocess((v) => (v === '' || v === null ? undefined : v), emailField.optional()),
      phoneNumber: optionalPhone,
      companyName: optionalText(255),
      groupId: optionalUuid,
    }),
    req.body,
  );
  if (!body.email && !body.phoneNumber) throw badRequest('Name, and either email or phone number are required');

  const groupId = await assertOwnedOrNull('customer_groups', body.groupId, tenantId, 'customer group');

  const { data: customer, error } = await db
    .from('customers')
    .insert({
      tenant_id: tenantId,
      first_name: body.firstName,
      last_name: body.lastName,
      email: body.email ?? null,
      phone_number: body.phoneNumber ?? null,
      company_name: body.companyName ?? null,
      group_id: groupId,
      created_by: userId,
    })
    .select('customer_id, first_name, last_name, email, phone_number, company_name, group_id, status, created_date')
    .single();

  if (error) {
    if (error.code === '23505') throw badRequest('A customer with this email or phone number already exists');
    throw error;
  }

  res.status(201).json({ message: 'Customer created successfully', data: customer });
});

customersRouter.put('/:id', async (req, res) => {
  const { tenantId } = tenantCtx(req);
  const id = uuid(req.params.id);
  const body = parse(
    z.object({
      firstName: z.string().trim().min(1).max(100).optional(),
      lastName: z.string().trim().min(1).max(100).optional(),
      email: z.preprocess((v) => (v === '' || v === null ? undefined : v), emailField.optional()),
      phoneNumber: optionalPhone,
      companyName: optionalText(255),
      groupId: optionalUuid,
      status: STATUS.optional(),
    }),
    req.body,
  );

  const groupId = body.groupId !== undefined ? await assertOwnedOrNull('customer_groups', body.groupId, tenantId, 'customer group') : undefined;

  const update: Record<string, unknown> = {};
  if (body.firstName !== undefined) update.first_name = body.firstName;
  if (body.lastName !== undefined) update.last_name = body.lastName;
  if (body.email !== undefined) update.email = body.email;
  if (body.phoneNumber !== undefined) update.phone_number = body.phoneNumber;
  if (body.companyName !== undefined) update.company_name = body.companyName;
  if (groupId !== undefined) update.group_id = groupId;
  if (body.status !== undefined) update.status = body.status;
  if (Object.keys(update).length === 0) throw badRequest('Nothing to update');

  const { data, error } = await db
    .from('customers')
    .update(update)
    .eq('customer_id', id)
    .eq('tenant_id', tenantId)
    .select('customer_id')
    .maybeSingle();
  if (error) {
    if (error.code === '23505') throw badRequest('A customer with this email already exists');
    throw error;
  }
  if (!data) throw notFound('Customer not found');

  res.json({ message: 'Customer updated successfully' });
});

customersRouter.delete('/:id', async (req, res) => {
  const { tenantId } = tenantCtx(req);
  const id = uuid(req.params.id);

  const { data, error } = await db
    .from('customers')
    .update({ status: 'INACTIVE' })
    .eq('customer_id', id)
    .eq('tenant_id', tenantId)
    .select('customer_id')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound('Customer not found');

  res.json({ message: 'Customer deactivated successfully' });
});

dealersRouter.get('/', async (req, res) => {
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
});

dealersRouter.post('/', async (req, res) => {
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
});

dealersRouter.put('/:id', async (req, res) => {
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
});

dealersRouter.delete('/:id', async (req, res) => {
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
});
