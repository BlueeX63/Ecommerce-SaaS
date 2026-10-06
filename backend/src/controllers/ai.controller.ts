import type { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../lib/supabase.js';
import { badRequest, parse } from '../lib/http.js';
import { optionalText } from '../lib/validation.js';
import { tenantCtx } from '../middleware/auth.js';
import { consumeAiQuota } from '../services/ai/quota.js';
import { generateProductListing } from '../services/ai/product-listing.js';
import { cleanProductImage, generateStudioProductImage } from '../services/ai/product-image.js';
import { isTenantImageUrl, uploadTenantImage } from '../services/media.js';

const productName = z.string().trim().min(1, 'Product name is required').max(200);

/** Fills the product form from a name: description, SKU and the best-matching existing category. */
export async function productListing(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const body = parse(z.object({ productName, description: optionalText(1500) }), req.body);

  const { data: categories, error } = await db
    .from('categories')
    .select('category_id, category_name')
    .eq('tenant_id', tenantId)
    .limit(200);
  if (error) throw error;

  await consumeAiQuota(tenantId, 'text');
  const listing = await generateProductListing({
    productName: body.productName,
    currentDescription: body.description,
    categoryNames: (categories ?? []).map((c) => c.category_name),
  });

  const match = listing.category
    ? (categories ?? []).find((c) => c.category_name.toLowerCase() === listing.category!.toLowerCase())
    : undefined;

  res.json({ description: listing.description, sku: listing.sku, categoryId: match?.category_id ?? null });
}

/** Creates a studio-style product photo from the product's name and details, stored in the tenant's folder. */
export async function generateImage(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const body = parse(
    z.object({ productName, category: optionalText(100), description: optionalText(1500) }),
    req.body,
  );

  await consumeAiQuota(tenantId, 'image');
  const png = await generateStudioProductImage(body);
  const { url, publicId } = await uploadTenantImage(tenantId, png);
  res.json({ url, public_id: publicId });
}

/** Re-shoots one of the merchant's own product images onto a clean studio background. */
export async function cleanImage(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const body = parse(z.object({ imageUrl: z.string().trim().max(2048) }), req.body);

  if (!isTenantImageUrl(body.imageUrl, tenantId)) {
    throw badRequest('Only images uploaded to your store can be cleaned up');
  }

  await consumeAiQuota(tenantId, 'image');
  const png = await cleanProductImage(body.imageUrl);
  const { url, publicId } = await uploadTenantImage(tenantId, png);
  res.json({ url, public_id: publicId });
}

