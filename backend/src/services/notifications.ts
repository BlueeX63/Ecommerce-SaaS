import { db } from '../lib/supabase.js';

export interface NotificationInput {
  tenantId: string;
  type: string;
  title: string;
  body?: string;
  productId?: string | null;
  warehouseId?: string | null;
  /** At most one *unread* notification per key exists, so repeated events don't pile up. */
  dedupeKey?: string;
}

export async function notifyAdmin(input: NotificationInput): Promise<void> {
  const { error } = await db.from('admin_notifications').insert({
    tenant_id: input.tenantId,
    type: input.type,
    title: input.title.slice(0, 255),
    body: input.body ?? null,
    product_id: input.productId ?? null,
    warehouse_id: input.warehouseId ?? null,
    dedupe_key: input.dedupeKey ?? null,
  });
  // 23505: an unread alert for the same situation already exists - exactly what the dedupe key is for.
  if (error && error.code !== '23505') console.error('[notifications] failed to create', error);
}

/**
 * Looks at the current stock of the given products and keeps the merchant's out-of-stock alerts in step:
 *  - raises an alert for every warehouse where a tracked product has run out (and one when it is gone everywhere),
 *  - clears those alerts once the warehouse has stock again.
 * Never throws - alerts must not break the stock movement that triggered them.
 */
export async function syncOutOfStockAlerts(tenantId: string, productIds: string[]): Promise<void> {
  try {
    const ids = [...new Set(productIds)];
    if (ids.length === 0) return;

    const { data: rows } = await db
      .from('inventory')
      .select('warehouse_id, quantity_available, quantity_reserved, warehouses!inner(warehouse_name, is_active), product_variants!inner(product_id)')
      .eq('tenant_id', tenantId)
      .in('product_variants.product_id', ids);
    const { data: products } = await db.from('products').select('product_id, product_name').eq('tenant_id', tenantId).in('product_id', ids);
    const names = new Map((products ?? []).map((p: any) => [p.product_id, p.product_name as string]));

    // product -> warehouse -> {name, available}
    const stock = new Map<string, Map<string, { name: string; available: number }>>();
    for (const row of rows ?? []) {
      const variant: any = Array.isArray(row.product_variants) ? row.product_variants[0] : row.product_variants;
      const warehouse: any = Array.isArray(row.warehouses) ? row.warehouses[0] : row.warehouses;
      if (!variant || !warehouse || warehouse.is_active === false) continue;
      const perWarehouse = stock.get(variant.product_id) ?? new Map();
      const entry = perWarehouse.get(row.warehouse_id) ?? { name: warehouse.warehouse_name, available: 0 };
      entry.available += Math.max(0, (row.quantity_available ?? 0) - (row.quantity_reserved ?? 0));
      perWarehouse.set(row.warehouse_id, entry);
      stock.set(variant.product_id, perWarehouse);
    }

    for (const productId of ids) {
      const productName = names.get(productId) ?? 'A product';
      const perWarehouse = stock.get(productId);
      if (!perWarehouse || perWarehouse.size === 0) {
        // Not tracked any more (unlimited): nothing can be out of stock.
        await db.from('admin_notifications').update({ is_read: true }).eq('tenant_id', tenantId).eq('product_id', productId).eq('type', 'OUT_OF_STOCK').eq('is_read', false);
        continue;
      }

      let allGone = true;
      for (const [warehouseId, { name, available }] of perWarehouse) {
        const key = `oos:${productId}:${warehouseId}`;
        if (available <= 0) {
          await notifyAdmin({
            tenantId,
            type: 'OUT_OF_STOCK',
            title: `Out of stock: ${productName}`,
            body: `${productName} has run out at ${name}.`,
            productId,
            warehouseId,
            dedupeKey: key,
          });
        } else {
          allGone = false;
          await db.from('admin_notifications').update({ is_read: true }).eq('tenant_id', tenantId).eq('dedupe_key', key).eq('is_read', false);
        }
      }

      const allKey = `oos:${productId}:all`;
      if (allGone) {
        await notifyAdmin({
          tenantId,
          type: 'OUT_OF_STOCK',
          title: `Out of stock everywhere: ${productName}`,
          body: `${productName} is out of stock in every warehouse, so shoppers can't order it until you restock.`,
          productId,
          dedupeKey: allKey,
        });
      } else {
        await db.from('admin_notifications').update({ is_read: true }).eq('tenant_id', tenantId).eq('dedupe_key', allKey).eq('is_read', false);
      }
    }
  } catch (error) {
    console.error('[notifications] stock alert sync failed', error);
  }
}
