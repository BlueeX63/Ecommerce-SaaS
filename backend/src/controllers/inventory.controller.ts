import type { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../lib/supabase.js';
import { ApiError, badRequest, str, uuid, parse } from '../lib/http.js';
import { optionalText } from '../lib/validation.js';
import { tenantCtx } from '../middleware/auth.js';
import { assertOwned, assertVariantOwned } from '../services/ownership.js';

export async function list(req: Request, res: Response) {
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
}

export async function adjust(req: Request, res: Response) {
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
}
