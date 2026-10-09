import type { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../lib/supabase.js';
import { ApiError, badRequest, escapeLike, notFound, pageMeta, pagination, parse, str, uuid } from '../lib/http.js';
import {
  httpUrl,
  optionalHttpUrl,
  optionalNumber,
  optionalText,
  optionalUuid,
} from '../lib/validation.js';
import { slugify } from '../lib/sanitize.js';
import { tenantCtx } from '../middleware/auth.js';
import { assertOwned, assertOwnedOrNull } from '../services/ownership.js';
import { invalidateTenantCache } from '../services/tenants.js';
import { getStockByProduct, getTenantStockSummary } from '../services/fulfillment.js';
import { makeUnlimited, setStock } from '../services/stock.js';

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

/**
 * How much of a product the merchant has. "unlimited" means stock isn't tracked (the product can always be ordered);
 * "tracked" records an opening quantity at a warehouse, and orders then draw it down.
 */
const stockSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('unlimited') }),
  z.object({ mode: z.literal('tracked'), quantity: z.coerce.number().int().min(0).max(10_000_000), warehouseId: optionalUuid }),
]);

/** The warehouse initial stock goes to: the one chosen, else the primary, else the only one. */
async function resolveStockWarehouse(tenantId: string, requested?: string): Promise<string> {
  if (requested) {
    await assertOwned('warehouses', requested, tenantId, 'warehouse');
    return requested;
  }
  const { data } = await db.from('warehouses').select('warehouse_id, is_primary').eq('tenant_id', tenantId).eq('is_active', true).order('is_primary', { ascending: false }).order('created_date');
  if (!data?.length) throw badRequest('Add your warehouse (dispatch location) before tracking stock.');
  return data[0].warehouse_id;
}

const createSchema = z.object({
  ...productFields,
  stock: stockSchema,
  imageUrls: z.array(httpUrl(255)).max(10).optional(),
  primaryImageUrl: optionalHttpUrl(255),
  catalogs: z
    .array(z.object({ catalogId: z.string().uuid(), catalogPriceOverride: optionalNumber(0, 1_000_000_000) }))
    .max(50)
    .optional(),
});

/** On edit an empty value means "clear this field", unlike on create where blank means "not provided". */
const clearable = (max: number) => z.preprocess((v) => (v === null ? '' : v), z.string().trim().max(max)).optional();

const updateSchema = z.object({
  productName: productFields.productName.optional(),
  slug: productFields.slug.optional(),
  sku: clearable(100),
  description: clearable(20_000),
  basePrice: productFields.basePrice,
  compareAtPrice: z.preprocess((v) => (v === '' ? null : v), z.coerce.number().min(0).max(1_000_000_000).nullable()).optional(),
  costPrice: productFields.costPrice,
  categoryId: z.preprocess((v) => (v === '' ? null : v), z.string().uuid().nullable()).optional(),
  status: PRODUCT_STATUS.optional(),
  threeDModelUrl: z.preprocess((v) => (v === null ? '' : v), z.union([z.literal(''), httpUrl(255)])).optional(),
  /** When present, replaces the product's images (first = primary). */
  imageUrls: z.array(httpUrl(255)).max(10).optional(),
  stock: stockSchema.optional(),
});

export async function list(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const page = pagination(req.query);
  // Commas and parentheses are PostgREST filter syntax; they can't be part of a name search.
  const search = str(req.query.q)?.replace(/[,()*]/g, ' ').trim().slice(0, 100);
  const status = str(req.query.status);

  let query = db
    .from('products')
    .select('*, categories(category_name), product_images(image_url, is_primary, sort_order)', { count: 'exact' })
    .eq('tenant_id', tenantId);
  if (status && PRODUCT_STATUS.safeParse(status).success) query = query.eq('status', status);
  if (search) {
    const like = `%${escapeLike(search)}%`;
    query = query.or(`product_name.ilike.${like},sku.ilike.${like}`);
  }

  const { data, error, count } = await query.order('created_date', { ascending: false }).range(page.offset, page.offset + page.limit - 1);
  if (error) throw error;

  let stock = new Map<string, number>();
  try {
    stock = await getTenantStockSummary(tenantId);
  } catch (e) {
    console.error('[products] stock summary failed', e);
  }

  const rows = (data ?? []).map((p: any) => {
    const images = [...(p.product_images ?? [])].sort((a, b) => Number(!!b.is_primary) - Number(!!a.is_primary) || (a.sort_order ?? 0) - (b.sort_order ?? 0));
    return { ...p, product_images: images, stock_total: stock.has(p.product_id) ? stock.get(p.product_id) : null };
  });
  res.json({ data: rows, meta: pageMeta(count, page) });
}

export async function getById(req: Request, res: Response) {
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

  const stockRows = (await getStockByProduct(tenantId, [id])).get(id) ?? [];
  const warehouseIds = [...new Set(stockRows.map((r) => r.warehouseId))];
  const { data: warehouses } = warehouseIds.length
    ? await db.from('warehouses').select('warehouse_id, warehouse_name').eq('tenant_id', tenantId).in('warehouse_id', warehouseIds)
    : { data: [] as Array<{ warehouse_id: string; warehouse_name: string }> };
  const stock = {
    tracked: stockRows.length > 0,
    perWarehouse: warehouseIds.map((w) => ({
      warehouseId: w,
      name: warehouses?.find((x) => x.warehouse_id === w)?.warehouse_name ?? 'Warehouse',
      quantity: stockRows.filter((r) => r.warehouseId === w).reduce((sum, r) => sum + r.available, 0),
    })),
  };

  res.json({ data: { ...product, stock } });
}

export async function create(req: Request, res: Response) {
  const { tenantId, userId } = tenantCtx(req);
  const body = parse(createSchema, req.body);

  const categoryId = await assertOwnedOrNull('categories', body.categoryId, tenantId, 'category');
  for (const entry of body.catalogs ?? []) await assertOwned('catalogs', entry.catalogId, tenantId, 'catalog');

  const stockWarehouseId = body.stock.mode === 'tracked' ? await resolveStockWarehouse(tenantId, body.stock.warehouseId) : null;

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

  if (body.stock.mode === 'tracked' && stockWarehouseId) {
    try {
      await setStock({
        tenantId,
        warehouseId: stockWarehouseId,
        productId: product.product_id,
        quantity: body.stock.quantity,
        reason: 'Opening stock',
        type: 'PURCHASE_RECEIPT',
        actor: { userId },
      });
    } catch (error) {
      // Don't leave a product behind whose stock could not be recorded.
      await db.from('products').delete().eq('product_id', product.product_id).eq('tenant_id', tenantId);
      throw error;
    }
  }

  await invalidateTenantCache(tenantId);
  res.status(201).json({ message: 'Product created successfully', data: product });
}

export async function update(req: Request, res: Response) {
  const { tenantId, userId } = tenantCtx(req);
  const id = uuid(req.params.id);
  const body = parse(updateSchema, req.body);

  if (body.categoryId) await assertOwned('categories', body.categoryId, tenantId, 'category');

  const update: Record<string, unknown> = { updated_by: userId, updated_date: new Date().toISOString() };
  if (body.productName !== undefined) update.product_name = body.productName;
  if (body.slug !== undefined) update.slug = slugify(body.slug, 200);
  if (body.sku !== undefined) update.sku = body.sku || null;
  if (body.description !== undefined) update.description = body.description || null;
  if (body.basePrice !== undefined) update.base_price = body.basePrice;
  if (body.compareAtPrice !== undefined) update.compare_at_price = body.compareAtPrice;
  if (body.costPrice !== undefined) update.cost_price = body.costPrice;
  if (body.categoryId !== undefined) update.category_id = body.categoryId;
  if (body.status !== undefined) update.status = body.status;
  if (body.threeDModelUrl !== undefined) update.three_d_model_url = body.threeDModelUrl || null;

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

  if (body.stock) {
    if (body.stock.mode === 'unlimited') {
      await makeUnlimited(tenantId, id);
    } else {
      const warehouseId = await resolveStockWarehouse(tenantId, body.stock.warehouseId);
      await setStock({ tenantId, warehouseId, productId: id, quantity: body.stock.quantity, reason: 'Edited on the product page', actor: { userId } });
    }
  }

  if (body.imageUrls) {
    await db.from('product_images').delete().eq('product_id', id);
    if (body.imageUrls.length) {
      const { error: imageError } = await db
        .from('product_images')
        .insert(body.imageUrls.map((url, i) => ({ product_id: id, image_url: url, is_primary: i === 0, sort_order: i + 1 })));
      if (imageError) {
        console.error('[products] failed to replace images', imageError);
        throw new ApiError(500, 'Product saved, but its images could not be updated. Please try again.');
      }
    }
  }

  await invalidateTenantCache(tenantId);
  res.json({ message: 'Product updated successfully' });
}

/**
 * Removes a product. Orders keep their line items (they store the product name and price, not a reference), so
 * order history is unaffected. `?archive=true` only hides the product from the storefront instead of deleting it.
 */
export async function remove(req: Request, res: Response) {
  const { tenantId, userId } = tenantCtx(req);
  const id = uuid(req.params.id);
  const archiveOnly = str(req.query.archive) === 'true';

  if (archiveOnly) {
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
    return;
  }

  const { data, error } = await db.from('products').delete().eq('product_id', id).eq('tenant_id', tenantId).select('product_id').maybeSingle();
  if (error) throw error;
  if (!data) throw notFound('Product not found');

  await invalidateTenantCache(tenantId);
  res.json({ message: 'Product deleted successfully' });
}
