import { db } from '../lib/supabase.js';
import { badRequest } from '../lib/http.js';

/**
 * Tenant-ownership guards.
 *
 * The service-role client bypasses RLS, so whenever a request references another record by id
 * (a product in a catalog, a customer on an order, ...) we must prove that record belongs to the caller's
 * tenant. Otherwise a merchant could attach - and then read back through joins - another tenant's data.
 */
const ID_COLUMN = {
  categories: 'category_id',
  products: 'product_id',
  catalogs: 'catalog_id',
  customers: 'customer_id',
  dealers: 'dealer_id',
  warehouses: 'warehouse_id',
  orders: 'order_id',
  invoices: 'invoice_id',
  customer_groups: 'group_id',
  roles: 'role_id',
} as const;

export type OwnedTable = keyof typeof ID_COLUMN;

export async function isOwned(table: OwnedTable, id: string, tenantId: string): Promise<boolean> {
  const column = ID_COLUMN[table];
  const { data } = await db.from(table).select(column).eq(column, id).eq('tenant_id', tenantId).maybeSingle();
  return !!data;
}

/** Throws 400 unless `id` is a record of `table` that belongs to `tenantId`. */
export async function assertOwned(table: OwnedTable, id: string, tenantId: string, label = table.replace(/_/g, ' ')) {
  if (!(await isOwned(table, id, tenantId))) throw badRequest(`Invalid ${label}`);
}

/** Like assertOwned, but a null/undefined id is allowed and returned as null. */
export async function assertOwnedOrNull(
  table: OwnedTable,
  id: string | null | undefined,
  tenantId: string,
  label?: string,
): Promise<string | null> {
  if (!id) return null;
  await assertOwned(table, id, tenantId, label);
  return id;
}

/** Variants have no tenant_id of their own - ownership flows through their product. */
export async function assertVariantOwned(variantId: string, tenantId: string) {
  const { data } = await db
    .from('product_variants')
    .select('variant_id, products!inner(tenant_id)')
    .eq('variant_id', variantId)
    .eq('products.tenant_id', tenantId)
    .maybeSingle();
  if (!data) throw badRequest('Invalid variant');
}
