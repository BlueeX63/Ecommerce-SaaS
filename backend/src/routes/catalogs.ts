import { Router } from 'express';
import { z } from 'zod';
import { db } from '../lib/supabase.js';
import { badRequest, notFound, pageMeta, pagination, parse, uuid } from '../lib/http.js';
import { slugify } from '../lib/sanitize.js';
import { optionalNumber, optionalText, phoneSchema } from '../lib/validation.js';
import { requireMerchant, tenantCtx } from '../middleware/auth.js';
import { assertOwned } from '../services/ownership.js';

export const catalogsRouter = Router();
catalogsRouter.use(requireMerchant);

function withTenantSlug(catalog: any) {
  const { tenant, ...rest } = catalog;
  return { ...rest, tenant_slug: tenant?.code };
}

catalogsRouter.get('/', async (req, res) => {
  const { tenantId } = tenantCtx(req);
  const page = pagination(req.query);

  const { data, error, count } = await db
    .from('catalogs')
    .select('*, tenant:tenant_id(code)', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_date', { ascending: false })
    .range(page.offset, page.offset + page.limit - 1);
  if (error) throw error;

  res.json({ data: (data ?? []).map(withTenantSlug), meta: pageMeta(count, page) });
});

catalogsRouter.post('/', async (req, res) => {
  const { tenantId, userId } = tenantCtx(req);
  const body = parse(
    z.object({
      catalogName: z.string().trim().min(1, 'Catalog name is required').max(200),
      slug: z.string().trim().min(1, 'Catalog slug is required').max(200),
      catalogType: z.enum(['GENERAL', 'SPECIAL']).optional(),
      description: optionalText(5000),
      isActive: z.boolean().optional(),
    }),
    req.body,
  );

  const slug = slugify(body.slug, 200);
  if (!slug) throw badRequest('Catalog slug is required');

  const { data: catalog, error } = await db
    .from('catalogs')
    .insert({
      tenant_id: tenantId,
      catalog_name: body.catalogName,
      slug,
      catalog_type: body.catalogType ?? 'GENERAL',
      description: body.description ?? null,
      is_active: body.isActive ?? true,
      created_by: userId,
      updated_by: userId,
    })
    .select('*, tenant:tenant_id(code)')
    .single();

  if (error) {
    if (error.code === '23505') throw badRequest('Catalog name or slug already exists');
    throw error;
  }

  res.status(201).json({ message: 'Catalog created successfully', data: withTenantSlug(catalog) });
});

catalogsRouter.delete('/:id', async (req, res) => {
  const { tenantId } = tenantCtx(req);
  const id = uuid(req.params.id);

  const { data, error } = await db
    .from('catalogs')
    .delete()
    .eq('catalog_id', id)
    .eq('tenant_id', tenantId)
    .select('catalog_id')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound('Catalog not found or unauthorized');

  res.json({ message: 'Catalog deleted successfully' });
});

// --- products in a catalog (with optional negotiated prices) ---------------------------------------

catalogsRouter.get('/:id/products', async (req, res) => {
  const { tenantId } = tenantCtx(req);
  const id = uuid(req.params.id);
  await assertOwnedOr404(id, tenantId);

  const { data, error } = await db
    .from('catalog_products')
    .select('*, products(*)')
    .eq('catalog_id', id)
    .order('added_date', { ascending: false });
  if (error) throw error;

  res.json({ data });
});

catalogsRouter.post('/:id/products', async (req, res) => {
  const { tenantId } = tenantCtx(req);
  const id = uuid(req.params.id);
  await assertOwnedOr404(id, tenantId);

  const body = parse(
    z.object({
      productId: z.string().uuid('Product ID is required'),
      priceOverride: optionalNumber(0, 1_000_000_000),
      compareAtPriceOverride: optionalNumber(0, 1_000_000_000),
      isActive: z.boolean().optional(),
    }),
    req.body,
  );
  await assertOwned('products', body.productId, tenantId, 'product');

  const { data, error } = await db
    .from('catalog_products')
    .upsert(
      {
        catalog_id: id,
        product_id: body.productId,
        price_override: body.priceOverride ?? null,
        compare_at_price_override: body.compareAtPriceOverride ?? null,
        is_active: body.isActive ?? true,
      },
      { onConflict: 'catalog_id,product_id' },
    )
    .select()
    .single();
  if (error) throw error;

  res.status(201).json({ message: 'Product added to catalog', data });
});

// --- customers allowed into a SPECIAL catalog ------------------------------------------------------

catalogsRouter.get('/:id/customers', async (req, res) => {
  const { tenantId } = tenantCtx(req);
  const id = uuid(req.params.id);
  await assertOwnedOr404(id, tenantId);

  const { data, error } = await db
    .from('catalog_customers')
    .select('*, customers(first_name, last_name, email)')
    .eq('catalog_id', id)
    .order('added_date', { ascending: false });
  if (error) throw error;

  res.json({ data });
});

catalogsRouter.post('/:id/customers', async (req, res) => {
  const { tenantId } = tenantCtx(req);
  const id = uuid(req.params.id);
  await assertOwnedOr404(id, tenantId);

  const body = parse(
    z.object({ customerId: z.string().uuid().optional(), phoneNumber: phoneSchema.optional() }),
    req.body,
  );
  if (!body.customerId && !body.phoneNumber) throw badRequest('Customer ID or Phone Number is required');
  if (body.customerId) await assertOwned('customers', body.customerId, tenantId, 'customer');

  const row: { catalog_id: string; customer_id?: string; phone_number?: string } = { catalog_id: id };
  if (body.customerId) row.customer_id = body.customerId;
  if (body.phoneNumber) row.phone_number = body.phoneNumber;

  const onConflict = body.phoneNumber && !body.customerId ? 'catalog_id,phone_number' : 'catalog_id,customer_id';
  const { data, error } = await db.from('catalog_customers').upsert(row as any, { onConflict }).select().single();
  if (error) throw error;

  res.status(201).json({ message: 'Customer added to catalog', data });
});

async function assertOwnedOr404(catalogId: string, tenantId: string) {
  const { data } = await db
    .from('catalogs')
    .select('catalog_id')
    .eq('catalog_id', catalogId)
    .eq('tenant_id', tenantId)
    .maybeSingle();
  if (!data) throw notFound('Catalog not found or unauthorized');
}
