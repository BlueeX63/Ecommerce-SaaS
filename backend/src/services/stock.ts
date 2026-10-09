import { db } from '../lib/supabase.js';
import { ApiError, badRequest } from '../lib/http.js';
import { ensureDefaultVariant, invalidateStockCache } from './fulfillment.js';
import { syncOutOfStockAlerts } from './notifications.js';

export interface StockActor {
  userId?: string | null;
  /** Free-text origin recorded in the audit log, e.g. "Employee: Asha (Pune warehouse)". */
  label?: string;
}

/** The variant that holds stock for a product with no options (created on demand). */
export async function stockVariantFor(tenantId: string, productId: string): Promise<string> {
  const { data: product } = await db.from('products').select('sku').eq('product_id', productId).eq('tenant_id', tenantId).maybeSingle();
  if (!product) throw badRequest('Invalid product');
  return ensureDefaultVariant(productId, product.sku ?? null);
}

/**
 * Adds/removes units at one warehouse. Optimistic concurrency: if another request changed the row between our
 * read and write we re-read, so concurrent adjustments never overwrite each other.
 */
export async function adjustStock(opts: {
  tenantId: string;
  warehouseId: string;
  variantId: string;
  change: number;
  reason?: string | null;
  actor?: StockActor;
  type?: 'MANUAL_ADJUSTMENT' | 'PURCHASE_RECEIPT';
}) {
  const { tenantId, warehouseId, variantId, change } = opts;
  if (change === 0) throw badRequest('Quantity change must not be zero');

  let inv: any = null;
  for (let attempt = 0; attempt < 3 && !inv; attempt++) {
    const { data: current } = await db
      .from('inventory')
      .select('*')
      .eq('variant_id', variantId)
      .eq('warehouse_id', warehouseId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (!current) {
      if (change < 0) throw badRequest('Insufficient stock');
      const { data: created, error } = await db
        .from('inventory')
        .insert({ tenant_id: tenantId, variant_id: variantId, warehouse_id: warehouseId, quantity_available: change })
        .select()
        .single();
      if (error?.code === '23505') continue;
      if (error) throw error;
      inv = created;
    } else {
      const next = current.quantity_available + change;
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
    transaction_type: opts.type ?? 'MANUAL_ADJUSTMENT',
    quantity_change: change,
    notes: [opts.actor?.label, opts.reason || 'Manual adjustment'].filter(Boolean).join(' - '),
    created_by: opts.actor?.userId ?? null,
  });

  await invalidateStockCache(tenantId);
  const { data: variant } = await db.from('product_variants').select('product_id').eq('variant_id', variantId).maybeSingle();
  if (variant) void syncOutOfStockAlerts(tenantId, [variant.product_id]);
  return inv;
}

/** Sets the exact quantity a warehouse holds of a product (creating the stock record if needed). */
export async function setStock(opts: {
  tenantId: string;
  warehouseId: string;
  productId: string;
  quantity: number;
  reason?: string | null;
  actor?: StockActor;
  type?: 'MANUAL_ADJUSTMENT' | 'PURCHASE_RECEIPT';
}) {
  const variantId = await stockVariantFor(opts.tenantId, opts.productId);
  const { data: current } = await db
    .from('inventory')
    .select('quantity_available')
    .eq('variant_id', variantId)
    .eq('warehouse_id', opts.warehouseId)
    .eq('tenant_id', opts.tenantId)
    .maybeSingle();

  const delta = opts.quantity - (current?.quantity_available ?? 0);
  if (!current && opts.quantity === 0) {
    // Track the product at this warehouse with nothing on hand.
    await db.from('inventory').insert({ tenant_id: opts.tenantId, variant_id: variantId, warehouse_id: opts.warehouseId, quantity_available: 0 });
    await invalidateStockCache(opts.tenantId);
    void syncOutOfStockAlerts(opts.tenantId, [opts.productId]);
    return;
  }
  if (delta === 0) return;
  await adjustStock({ tenantId: opts.tenantId, warehouseId: opts.warehouseId, variantId, change: delta, reason: opts.reason, actor: opts.actor, type: opts.type });
}

/** "Unlimited" stock = the merchant doesn't track this product, so it has no inventory records at all. */
export async function makeUnlimited(tenantId: string, productId: string) {
  const { data: variants } = await db.from('product_variants').select('variant_id').eq('product_id', productId);
  const ids = (variants ?? []).map((v) => v.variant_id);
  if (ids.length) await db.from('inventory').delete().eq('tenant_id', tenantId).in('variant_id', ids);
  await invalidateStockCache(tenantId);
  void syncOutOfStockAlerts(tenantId, [productId]);
}
