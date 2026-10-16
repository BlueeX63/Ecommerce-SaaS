import { db } from '../lib/supabase.js';
import { badRequest } from '../lib/http.js';
import { callRpc } from '../lib/rpc.js';
import { ensureDefaultVariant, invalidateStockCache } from './fulfillment.js';
import { syncOutOfStockAlerts } from './notifications.js';

export interface StockActor {
  userId?: string | null;
  /** Set when a warehouse employee made the change, so the ledger and the activity feed can name them. */
  employeeId?: string | null;
  /** Display name stored on the ledger row (kept even if the person is later removed). */
  name?: string | null;
  /** Free-text origin recorded in the audit log, e.g. "Employee: Asha". */
  label?: string;
}

export interface StockResult {
  inventoryId: string;
  before: number;
  after: number;
  change: number;
}

/** The variant that holds stock for a product with no options (created on demand). */
export async function stockVariantFor(tenantId: string, productId: string): Promise<string> {
  const { data: product } = await db.from('products').select('sku').eq('product_id', productId).eq('tenant_id', tenantId).maybeSingle();
  if (!product) throw badRequest('Invalid product');
  return ensureDefaultVariant(productId, product.sku ?? null);
}

interface Row {
  inventory_id: string;
  quantity_before: number;
  quantity_after: number;
}

async function run(opts: {
  tenantId: string;
  warehouseId: string;
  variantId: string;
  change?: number;
  setTo?: number;
  reason?: string | null;
  actor?: StockActor;
  type?: 'MANUAL_ADJUSTMENT' | 'PURCHASE_RECEIPT';
  productId?: string;
}): Promise<StockResult> {
  const rows = await callRpc<Row[]>('adjust_inventory', {
    p_tenant: opts.tenantId,
    p_warehouse: opts.warehouseId,
    p_variant: opts.variantId,
    p_change: opts.change ?? null,
    p_set_to: opts.setTo ?? null,
    p_type: opts.type ?? 'MANUAL_ADJUSTMENT',
    p_notes: [opts.actor?.label, opts.reason || 'Manual adjustment'].filter(Boolean).join(' - '),
    p_user: opts.actor?.userId ?? null,
    p_employee: opts.actor?.employeeId ?? null,
    p_actor_name: opts.actor?.name ?? null,
  });
  const row = rows[0];
  const result: StockResult = { inventoryId: row.inventory_id, before: row.quantity_before, after: row.quantity_after, change: row.quantity_after - row.quantity_before };

  if (result.change !== 0) {
    await invalidateStockCache(opts.tenantId);
    const productId = opts.productId ?? (await db.from('product_variants').select('product_id').eq('variant_id', opts.variantId).maybeSingle()).data?.product_id;
    if (productId) void syncOutOfStockAlerts(opts.tenantId, [productId]);
  }
  return result;
}

/**
 * Adds/removes units at one warehouse. One atomic database call: the stock row is locked, the quantity changed and
 * the ledger row (who, how much, resulting quantity) written in the same transaction, so concurrent changes queue up
 * instead of overwriting each other and a change can never exist without its audit row.
 */
export async function adjustStock(opts: {
  tenantId: string;
  warehouseId: string;
  variantId: string;
  change: number;
  reason?: string | null;
  actor?: StockActor;
  type?: 'MANUAL_ADJUSTMENT' | 'PURCHASE_RECEIPT';
  productId?: string;
}): Promise<StockResult> {
  if (opts.change === 0) throw badRequest('Quantity change must not be zero');
  return run({ ...opts, change: opts.change });
}

/** Sets the exact quantity a warehouse holds of a product (creating the stock record if needed). The difference is computed under the row lock, so it is exact even while other changes are happening. */
export async function setStock(opts: {
  tenantId: string;
  warehouseId: string;
  productId: string;
  quantity: number;
  reason?: string | null;
  actor?: StockActor;
  type?: 'MANUAL_ADJUSTMENT' | 'PURCHASE_RECEIPT';
}): Promise<StockResult> {
  if (opts.quantity < 0) throw badRequest('Stock cannot be negative');
  const variantId = await stockVariantFor(opts.tenantId, opts.productId);
  return run({ ...opts, variantId, setTo: opts.quantity });
}

/** "Unlimited" stock = the merchant doesn't track this product, so it has no inventory records at all. */
export async function makeUnlimited(tenantId: string, productId: string) {
  const { data: variants } = await db.from('product_variants').select('variant_id').eq('product_id', productId);
  const ids = (variants ?? []).map((v) => v.variant_id);
  if (ids.length) await db.from('inventory').delete().eq('tenant_id', tenantId).in('variant_id', ids);
  await invalidateStockCache(tenantId);
  void syncOutOfStockAlerts(tenantId, [productId]);
}
