import type { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../lib/supabase.js';
import { ApiError, badRequest, str, uuid, parse } from '../lib/http.js';
import { optionalText, optionalUuid } from '../lib/validation.js';
import { tenantCtx } from '../middleware/auth.js';
import { assertOwned, assertVariantOwned } from '../services/ownership.js';
import { adjustStock, stockVariantFor } from '../services/stock.js';

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
      // Either a specific variant, or just the product (stock is then held on its default variant).
      variantId: optionalUuid,
      productId: optionalUuid,
      warehouseId: z.string().uuid('warehouseId is required'),
      quantityChange: z.coerce.number().int().min(-1_000_000).max(1_000_000),
      reason: optionalText(500),
    }),
    req.body,
  );
  if (body.quantityChange === 0) throw badRequest('quantityChange must not be zero');

  if (!body.variantId && !body.productId) throw badRequest('Choose a product');
  await assertOwned('warehouses', body.warehouseId, tenantId, 'warehouse');

  let variantId = body.variantId;
  if (variantId) {
    await assertVariantOwned(variantId, tenantId);
  } else {
    await assertOwned('products', body.productId!, tenantId, 'product');
    variantId = await stockVariantFor(tenantId, body.productId!);
  }

  const inv = await adjustStock({ tenantId, warehouseId: body.warehouseId, variantId, change: body.quantityChange, reason: body.reason, actor: { userId } });

  res.status(201).json({ message: 'Inventory adjusted successfully', data: inv });
}
