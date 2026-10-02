import { Router } from 'express';
import { z } from 'zod';
import { db } from '../lib/supabase.js';
import { ApiError, badRequest, notFound, parse, str, uuid } from '../lib/http.js';
import { optionalText } from '../lib/validation.js';
import { requireMerchant, tenantCtx } from '../middleware/auth.js';
import { assertOwned, assertVariantOwned } from '../services/ownership.js';

export const warehousesRouter = Router();
export const inventoryRouter = Router();
warehousesRouter.use(requireMerchant);
inventoryRouter.use(requireMerchant);

warehousesRouter.get('/', async (req, res) => {
  const { tenantId } = tenantCtx(req);
  const { data, error } = await db
    .from('warehouses')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_date', { ascending: false });
  if (error) throw error;
  res.json({ data });
});

warehousesRouter.post('/', async (req, res) => {
  const { tenantId, userId } = tenantCtx(req);
  const body = parse(
    z.object({
      warehouseName: z.string().trim().min(1, 'Warehouse name is required').max(200),
      city: optionalText(100),
      country: optionalText(100),
    }),
    req.body,
  );

  const { data, error } = await db
    .from('warehouses')
    .insert({
      tenant_id: tenantId,
      warehouse_name: body.warehouseName,
      city: body.city ?? null,
      country: body.country ?? null,
      created_by: userId,
    })
    .select()
    .single();
  if (error) throw error;

  res.status(201).json({ message: 'Warehouse created successfully', data });
});

warehousesRouter.put('/:id', async (req, res) => {
  const { tenantId } = tenantCtx(req);
  const id = uuid(req.params.id);
  const body = parse(
    z.object({
      warehouseName: z.string().trim().min(1).max(200).optional(),
      city: optionalText(100),
      country: optionalText(100),
      isActive: z.boolean().optional(),
    }),
    req.body,
  );

  const update: Record<string, unknown> = {};
  if (body.warehouseName !== undefined) update.warehouse_name = body.warehouseName;
  if (body.city !== undefined) update.city = body.city;
  if (body.country !== undefined) update.country = body.country;
  if (body.isActive !== undefined) update.is_active = body.isActive;
  if (Object.keys(update).length === 0) throw badRequest('Nothing to update');

  const { data, error } = await db
    .from('warehouses')
    .update(update)
    .eq('warehouse_id', id)
    .eq('tenant_id', tenantId)
    .select('warehouse_id')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound('Warehouse not found');

  res.json({ message: 'Warehouse updated successfully' });
});

inventoryRouter.get('/', async (req, res) => {
  const { tenantId } = tenantCtx(req);
  const productId = str(req.query.productId);
  const warehouseId = str(req.query.warehouseId);

  let query = db
    .from('inventory')
    .select('*, product_variants(*, products(product_name, sku)), warehouses(warehouse_name)')
    .eq('tenant_id', tenantId);

  if (productId) {
    const { data: variants } = await db
      .from('product_variants')
      .select('variant_id, products!inner(tenant_id)')
      .eq('product_id', uuid(productId, 'productId'))
      .eq('products.tenant_id', tenantId);
    const variantIds = (variants ?? []).map((v) => v.variant_id);
    if (variantIds.length === 0) return void res.json({ data: [] });
    query = query.in('variant_id', variantIds);
  }
  if (warehouseId) query = query.eq('warehouse_id', uuid(warehouseId, 'warehouseId'));

  const { data, error } = await query;
  if (error) throw error;
  res.json({ data });
});

inventoryRouter.post('/', async (req, res) => {
  const { tenantId, userId } = tenantCtx(req);
  const body = parse(
    z.object({
      variantId: z.string().uuid('variantId is required'),
      warehouseId: z.string().uuid('warehouseId is required'),
      quantityChange: z.coerce.number().int().min(-1_000_000).max(1_000_000),
      reason: optionalText(500),
    }),
    req.body,
  );
  if (body.quantityChange === 0) throw badRequest('quantityChange must not be zero');

  await assertVariantOwned(body.variantId, tenantId);
  await assertOwned('warehouses', body.warehouseId, tenantId, 'warehouse');

  let inv: any = null;

  // Optimistic concurrency: retry if another request changed the stock between our read and write.
  for (let attempt = 0; attempt < 3 && !inv; attempt++) {
    const { data: current } = await db
      .from('inventory')
      .select('*')
      .eq('variant_id', body.variantId)
      .eq('warehouse_id', body.warehouseId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (!current) {
      if (body.quantityChange < 0) throw badRequest('Insufficient stock');
      const { data: created, error } = await db
        .from('inventory')
        .insert({
          tenant_id: tenantId,
          variant_id: body.variantId,
          warehouse_id: body.warehouseId,
          quantity_available: body.quantityChange,
        })
        .select()
        .single();
      if (error?.code === '23505') continue; // created concurrently - re-read
      if (error) throw error;
      inv = created;
    } else {
      const next = current.quantity_available + body.quantityChange;
      if (next < 0) throw badRequest('Insufficient stock');
      const { data: updated, error } = await db
        .from('inventory')
        .update({ quantity_available: next, last_updated: new Date().toISOString() })
        .eq('inventory_id', current.inventory_id)
        .eq('tenant_id', tenantId)
        .eq('quantity_available', current.quantity_available)
        .select()
        .maybeSingle();
      if (error) throw error;
      inv = updated;
    }
  }
  if (!inv) throw new ApiError(409, 'Inventory changed concurrently. Please retry.');

  await db.from('inventory_transactions').insert({
    tenant_id: tenantId,
    inventory_id: inv.inventory_id,
    transaction_type: 'MANUAL_ADJUSTMENT',
    quantity_change: body.quantityChange,
    notes: body.reason || 'Manual adjustment via API',
    created_by: userId,
  });

  res.status(201).json({ message: 'Inventory adjusted successfully', data: inv });
});
