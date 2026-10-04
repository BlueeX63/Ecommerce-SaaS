import type { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../lib/supabase.js';
import { badRequest, notFound, parse, uuid } from '../lib/http.js';
import { optionalNumber } from '../lib/validation.js';
import { tenantCtx } from '../middleware/auth.js';
import { evaluateCoupon } from '../services/pricing.js';

const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{3,50}$/, 'Coupon code must be 3-50 characters (letters, numbers, - and _)'),
    discount_type: z.enum(['PERCENTAGE', 'FIXED']),
    discount_amount: z.coerce.number().gt(0, 'Discount must be greater than zero').max(1_000_000_000),
    max_uses: optionalNumber(1, 1_000_000_000),
    expiry_date: z.preprocess(
      (v) => (v === '' || v === null ? undefined : v),
      z
        .string()
        .refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid expiry date')
        .optional(),
    ),
    is_active: z.boolean().optional(),
    is_public: z.boolean().optional(),
  })
  .refine((c) => c.discount_type !== 'PERCENTAGE' || c.discount_amount <= 100, {
    message: 'Percentage discount cannot exceed 100',
    path: ['discount_amount'],
  });

// Anyone holding a code may check it, so the response is minimal and the endpoint is rate limited
// to make guessing codes impractical.
export async function validate(req: Request, res: Response) {
  const { code, tenantId } = parse(
    z.object({ code: z.string().trim().min(1).max(50), tenantId: z.string().uuid('Coupon code and tenant ID are required') }),
    req.body,
  );

  const result = await evaluateCoupon(tenantId, code, 0);
  if (!result.ok) throw result.error;

  res.json({
    data: { code: result.coupon.code, discount_type: result.coupon.discount_type, discount_amount: result.coupon.discount_amount },
  });
}

export async function list(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const { data, error } = await db
    .from('coupons')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_date', { ascending: false });
  if (error) throw error;
  res.json({ coupons: data });
}

export async function create(req: Request, res: Response) {
  const { tenantId, userId } = tenantCtx(req);
  const body = parse(couponSchema, req.body);

  const { data, error } = await db
    .from('coupons')
    .insert({
      tenant_id: tenantId,
      code: body.code,
      discount_type: body.discount_type,
      discount_amount: body.discount_amount,
      max_uses: body.max_uses ?? null,
      expiry_date: body.expiry_date ? new Date(body.expiry_date).toISOString() : null,
      is_active: body.is_active ?? true,
      is_public: body.is_public ?? false,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return void res.status(409).json({ error: 'Coupon code already exists' });
    throw error;
  }
  res.status(201).json({ coupon: data });
}

export async function update(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const id = uuid(req.params.id);
  const body = parse(z.object({ is_active: z.boolean().optional(), is_public: z.boolean().optional() }), req.body);
  if (body.is_active === undefined && body.is_public === undefined) throw badRequest('Nothing to update');

  const { data, error } = await db
    .from('coupons')
    .update(body)
    .eq('coupon_id', id)
    .eq('tenant_id', tenantId)
    .select()
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound('Coupon not found');
  res.json({ coupon: data });
}

export async function remove(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const id = uuid(req.params.id);
  const { error } = await db.from('coupons').delete().eq('coupon_id', id).eq('tenant_id', tenantId);
  if (error) throw error;
  res.json({ success: true });
}
