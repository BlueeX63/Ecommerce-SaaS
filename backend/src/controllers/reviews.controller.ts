import type { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../lib/supabase.js';
import { str, uuid, parse } from '../lib/http.js';
import { requireStoreTenant } from '../services/tenants.js';
import { me, reviewFields } from './store.controller.js';
import { assertActiveProduct } from '../services/cart.js';

// ---------------------------------------------------------------------------------------------
// /api/v1/reviews  (public read of approved reviews; write requires a logged-in shopper)
// ---------------------------------------------------------------------------------------------

export async function listProductReviews(req: Request, res: Response) {
  const productId = uuid(str(req.query.productId), 'productId');
  const tenantKey = str(req.query.tenantId);
  const slug = str(req.query.slug);

  let tenantId: string;
  if (tenantKey && /^[0-9a-f-]{36}$/i.test(tenantKey)) tenantId = uuid(tenantKey, 'tenantId');
  else tenantId = (await requireStoreTenant(slug ?? tenantKey)).tenant_id;

  const { data, error } = await db
    .from('reviews')
    .select('review_id, rating, title, comment, created_date, customers(first_name)')
    .eq('tenant_id', tenantId)
    .eq('product_id', productId)
    .eq('status', 'APPROVED')
    .order('created_date', { ascending: false })
    .limit(100);
  if (error) throw error;

  res.json({ data });
}

export async function createReview(req: Request, res: Response) {
  const { tenantId, customerId } = me(req);
  const body = parse(z.object({ productId: z.string().uuid(), ...reviewFields }), req.body);
  await assertActiveProduct(tenantId, body.productId);

  const { data: review, error } = await db
    .from('reviews')
    .insert({
      tenant_id: tenantId,
      product_id: body.productId,
      customer_id: customerId,
      rating: body.rating,
      title: body.title ?? null,
      comment: body.comment ?? null,
      status: 'PENDING', // requires merchant approval before it is shown
    })
    .select('review_id, rating, title, comment, status')
    .single();
  if (error) throw error;

  res.status(201).json({ message: 'Review submitted successfully', data: review });
}
