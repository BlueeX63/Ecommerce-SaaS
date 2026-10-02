import { Router } from 'express';
import { z } from 'zod';
import { db } from '../lib/supabase.js';
import { ApiError, badRequest, notFound, pageMeta, pagination, parse, uuid } from '../lib/http.js';
import { limit } from '../lib/rate-limit.js';
import { slugify } from '../lib/sanitize.js';
import {
  httpUrl,
  optionalHttpUrl,
  optionalNumber,
  optionalText,
  optionalUuid,
} from '../lib/validation.js';
import { requireMerchant, tenantCtx } from '../middleware/auth.js';
import { generateProductCopy } from '../services/ai-assist.js';
import { getEntitlements, hasFeature, upgradeMessage } from '../services/entitlements.js';
import { assertOwned, assertOwnedOrNull } from '../services/ownership.js';
import { invalidateTenantCache } from '../services/tenants.js';

export const productsRouter = Router();
productsRouter.use(requireMerchant);

// AI Product Tools is a paid add-on.
productsRouter.post(
  '/ai-assist',
  limit('ai-assist', 30, 60_000, (req) => req.merchant?.userId),
  async (req, res) => {
    const { userId } = tenantCtx(req);
    const entitlements = await getEntitlements(userId);
    if (!hasFeature(entitlements, 'ai_tools')) {
      throw new ApiError(403, upgradeMessage('ai_tools'), undefined, 'UPGRADE_REQUIRED');
    }

    const body = parse(
      z.object({ productName: z.string().trim().min(1, 'Product name is required').max(200), category: optionalText(100) }),
      req.body,
    );

    res.json(generateProductCopy(body));
  },
);

const PRODUCT_STATUS = z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']);

const productFields = {
  productName: z.string().trim().min(1, 'Product name is required').max(200),
  slug: z.string().trim().min(1, 'Slug is required').max(200),
  sku: optionalText(100),
  description: optionalText(20_000),
  basePrice: optionalNumber(0, 1_000_000_000),
  compareAtPrice: optionalNumber(0, 1_000_000_000),
  costPrice: optionalNumber(0, 1_000_000_000),
  categoryId: optionalUuid,
  status: PRODUCT_STATUS.optional(),
  threeDModelUrl: optionalHttpUrl(255),
};

const createSchema = z.object({
  ...productFields,
  imageUrls: z.array(httpUrl(255)).max(10).optional(),
  primaryImageUrl: optionalHttpUrl(255),
  catalogs: z
    .array(z.object({ catalogId: z.string().uuid(), catalogPriceOverride: optionalNumber(0, 1_000_000_000) }))
    .max(50)
    .optional(),
});

const updateSchema = z.object(productFields).partial();

productsRouter.get('/', async (req, res) => {
  const { tenantId } = tenantCtx(req);
  const page = pagination(req.query);

  const { data, error, count } = await db
    .from('products')
    .select('*, categories(category_name), product_images(image_url, is_primary)', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_date', { ascending: false })
    .range(page.offset, page.offset + page.limit - 1);
  if (error) throw error;

  res.json({ data, meta: pageMeta(count, page) });
});

productsRouter.get('/:id', async (req, res) => {
  const { tenantId } = tenantCtx(req);
  const id = uuid(req.params.id);

  const { data: product, error } = await db
    .from('products')
    .select('*, categories(*), product_images(*), product_options(*, product_option_values(*)), product_variants(*)')
    .eq('product_id', id)
    .eq('tenant_id', tenantId)
    .maybeSingle();
  if (error) throw error;
  if (!product) throw notFound('Product not found');

  res.json({ data: product });
});

productsRouter.post('/', async (req, res) => {
  const { tenantId, userId } = tenantCtx(req);
  const body = parse(createSchema, req.body);

  const categoryId = await assertOwnedOrNull('categories', body.categoryId, tenantId, 'category');
  for (const entry of body.catalogs ?? []) await assertOwned('catalogs', entry.catalogId, tenantId, 'catalog');

  let slug = slugify(body.slug, 200);
  if (!slug) throw badRequest('Slug is required');

  const { data: existing } = await db
    .from('products')
    .select('slug')
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
    .maybeSingle();
  if (existing) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`.slice(0, 200);

  const { data: product, error } = await db
    .from('products')
    .insert({
      tenant_id: tenantId,
      category_id: categoryId,
      product_name: body.productName,
      slug,
      sku: body.sku ?? null,
      description: body.description ?? null,
      base_price: body.basePrice ?? 0,
      compare_at_price: body.compareAtPrice ?? null,
      cost_price: body.costPrice ?? null,
      status: body.status ?? 'DRAFT',
      three_d_model_url: body.threeDModelUrl ?? null,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') throw badRequest('Product slug or SKU already exists');
    throw error;
  }

  const images = body.imageUrls?.length ? body.imageUrls : body.primaryImageUrl ? [body.primaryImageUrl] : [];
  if (images.length) {
    const { error: imageError } = await db
      .from('product_images')
      .insert(images.map((url, i) => ({ product_id: product.product_id, image_url: url, is_primary: i === 0, sort_order: i + 1 })));
    if (imageError) console.error('[products] failed to insert images', imageError);
  }

  if (body.catalogs?.length) {
    const rows = body.catalogs.map((c) => ({
      catalog_id: c.catalogId,
      product_id: product.product_id,
      price_override: c.catalogPriceOverride ?? null,
    }));
    const { error: catalogError } = await db.from('catalog_products').upsert(rows, { onConflict: 'catalog_id,product_id' });
    if (catalogError) console.error('[products] failed to assign catalogs', catalogError);
  }

  await invalidateTenantCache(tenantId);
  res.status(201).json({ message: 'Product created successfully', data: product });
});

productsRouter.put('/:id', async (req, res) => {
  const { tenantId, userId } = tenantCtx(req);
  const id = uuid(req.params.id);
  const body = parse(updateSchema, req.body);

  if (body.categoryId) await assertOwned('categories', body.categoryId, tenantId, 'category');

  const update: Record<string, unknown> = { updated_by: userId, updated_date: new Date().toISOString() };
  if (body.productName !== undefined) update.product_name = body.productName;
  if (body.slug !== undefined) update.slug = slugify(body.slug, 200);
  if (body.sku !== undefined) update.sku = body.sku;
  if (body.description !== undefined) update.description = body.description;
  if (body.basePrice !== undefined) update.base_price = body.basePrice;
  if (body.compareAtPrice !== undefined) update.compare_at_price = body.compareAtPrice;
  if (body.costPrice !== undefined) update.cost_price = body.costPrice;
  if (body.categoryId !== undefined) update.category_id = body.categoryId;
  if (body.status !== undefined) update.status = body.status;
  if (body.threeDModelUrl !== undefined) update.three_d_model_url = body.threeDModelUrl;

  const { data, error } = await db
    .from('products')
    .update(update)
    .eq('product_id', id)
    .eq('tenant_id', tenantId)
    .select('product_id')
    .maybeSingle();
  if (error) {
    if (error.code === '23505') throw badRequest('Product slug or SKU already exists');
    throw error;
  }
  if (!data) throw notFound('Product not found');

  await invalidateTenantCache(tenantId);
  res.json({ message: 'Product updated successfully' });
});

productsRouter.delete('/:id', async (req, res) => {
  const { tenantId, userId } = tenantCtx(req);
  const id = uuid(req.params.id);

  // Soft delete: archived products disappear from the storefront but keep their order history.
  const { data, error } = await db
    .from('products')
    .update({ status: 'ARCHIVED', updated_by: userId, updated_date: new Date().toISOString() })
    .eq('product_id', id)
    .eq('tenant_id', tenantId)
    .select('product_id')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound('Product not found');

  await invalidateTenantCache(tenantId);
  res.json({ message: 'Product archived successfully' });
});
