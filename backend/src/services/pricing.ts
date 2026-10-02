import { db } from '../lib/supabase.js';
import { ApiError } from '../lib/http.js';

export const toCents = (amount: unknown) => Math.round(Number(amount) * 100);
export const fromCents = (cents: number) => Math.round(cents) / 100;

// ---------------------------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------------------------

export interface CouponRow {
  coupon_id: string;
  code: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_amount: number | string;
  max_uses: number | null;
  times_used: number;
  expiry_date: string | null;
  is_active: boolean;
}

export type CouponResult = { ok: true; coupon: CouponRow; discountCents: number } | { ok: false; error: ApiError };

/** Looks a coupon up and computes its discount against `subtotalCents`. Never trusts client-supplied amounts. */
export async function evaluateCoupon(tenantId: string, rawCode: string, subtotalCents: number): Promise<CouponResult> {
  const code = rawCode.trim().toUpperCase();
  const { data: coupon } = await db
    .from('coupons')
    .select('coupon_id, code, discount_type, discount_amount, max_uses, times_used, expiry_date, is_active')
    .eq('tenant_id', tenantId)
    .eq('code', code)
    .maybeSingle();

  if (!coupon || !coupon.is_active) return { ok: false, error: new ApiError(400, 'Invalid or expired coupon') };
  if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
    return { ok: false, error: new ApiError(400, 'Coupon has expired') };
  }
  if (coupon.max_uses !== null && coupon.times_used >= coupon.max_uses) {
    return { ok: false, error: new ApiError(400, 'Coupon usage limit reached') };
  }

  const raw =
    coupon.discount_type === 'PERCENTAGE'
      ? Math.round((subtotalCents * Number(coupon.discount_amount)) / 100)
      : toCents(coupon.discount_amount);

  return { ok: true, coupon: coupon as CouponRow, discountCents: Math.max(0, Math.min(raw, subtotalCents)) };
}

/** Atomically (optimistic concurrency) records one use of a coupon. Returns false if the limit was reached. */
export async function consumeCoupon(couponId: string): Promise<boolean> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const { data: current } = await db
      .from('coupons')
      .select('times_used, max_uses, is_active')
      .eq('coupon_id', couponId)
      .maybeSingle();
    if (!current || !current.is_active) return false;
    if (current.max_uses !== null && current.times_used >= current.max_uses) return false;

    const { data: updated } = await db
      .from('coupons')
      .update({ times_used: current.times_used + 1 })
      .eq('coupon_id', couponId)
      .eq('times_used', current.times_used)
      .select('coupon_id');
    if (updated && updated.length === 1) return true;
  }
  return false;
}

export async function releaseCoupon(couponId: string): Promise<void> {
  const { data } = await db.from('coupons').select('times_used').eq('coupon_id', couponId).maybeSingle();
  if (data && data.times_used > 0) {
    await db.from('coupons').update({ times_used: data.times_used - 1 }).eq('coupon_id', couponId);
  }
}

// ---------------------------------------------------------------------------------------------
// Catalog access (B2B "special" catalogs)
// ---------------------------------------------------------------------------------------------

export interface CatalogAccess {
  catalog_id: string;
  slug: string;
}

/** Active SPECIAL catalogs this customer has been granted (by customer id or by phone number). */
export async function getAccessibleSpecialCatalogs(
  tenantId: string,
  customer: { customer_id: string; phone_number: string | null },
): Promise<CatalogAccess[]> {
  const select = 'catalog_id, catalogs!inner(catalog_id, slug, tenant_id, catalog_type, is_active)';
  const found = new Map<string, CatalogAccess>();

  const collect = (rows: any[] | null) => {
    for (const row of rows ?? []) {
      const catalog = Array.isArray(row.catalogs) ? row.catalogs[0] : row.catalogs;
      if (catalog) found.set(catalog.catalog_id, { catalog_id: catalog.catalog_id, slug: catalog.slug });
    }
  };

  const byCustomer = await db
    .from('catalog_customers')
    .select(select)
    .eq('customer_id', customer.customer_id)
    .eq('catalogs.tenant_id', tenantId)
    .eq('catalogs.catalog_type', 'SPECIAL')
    .eq('catalogs.is_active', true);
  collect(byCustomer.data);

  if (customer.phone_number) {
    const byPhone = await db
      .from('catalog_customers')
      .select(select)
      .eq('phone_number', customer.phone_number)
      .eq('catalogs.tenant_id', tenantId)
      .eq('catalogs.catalog_type', 'SPECIAL')
      .eq('catalogs.is_active', true);
    collect(byPhone.data);
  }

  return [...found.values()];
}

// ---------------------------------------------------------------------------------------------
// Order line pricing
// ---------------------------------------------------------------------------------------------

export interface OrderLineInput {
  productId: string;
  quantity: number;
}

export interface PricedLine {
  productId: string;
  name: string;
  sku: string | null;
  unitCents: number;
  quantity: number;
  totalCents: number;
}

/**
 * Prices order lines from the database: the product's base price, or the customer's negotiated price when they
 * have access to a special catalog that lists the product. Prices sent by the browser are never used.
 */
export async function priceLines(
  tenantId: string,
  customer: { customer_id: string; phone_number: string | null },
  input: OrderLineInput[],
): Promise<PricedLine[]> {
  const quantities = new Map<string, number>();
  for (const line of input) quantities.set(line.productId, (quantities.get(line.productId) ?? 0) + line.quantity);
  if (quantities.size === 0) throw new ApiError(400, 'Your cart is empty');

  const ids = [...quantities.keys()];
  const { data: products, error } = await db
    .from('products')
    .select('product_id, product_name, sku, base_price, status')
    .eq('tenant_id', tenantId)
    .in('product_id', ids);
  if (error) throw error;

  const byId = new Map((products ?? []).map((p) => [p.product_id as string, p]));
  for (const id of ids) {
    const product = byId.get(id);
    if (!product || product.status !== 'ACTIVE') {
      throw new ApiError(400, 'One or more items in your cart are no longer available');
    }
  }

  const overrides = new Map<string, number>();
  const catalogs = await getAccessibleSpecialCatalogs(tenantId, customer);
  if (catalogs.length > 0) {
    const { data: rows } = await db
      .from('catalog_products')
      .select('product_id, price_override')
      .in('catalog_id', catalogs.map((c) => c.catalog_id))
      .in('product_id', ids)
      .eq('is_active', true)
      .not('price_override', 'is', null);
    for (const row of rows ?? []) {
      const cents = toCents(row.price_override);
      const existing = overrides.get(row.product_id);
      if (existing === undefined || cents < existing) overrides.set(row.product_id, cents);
    }
  }

  return ids.map((id) => {
    const product = byId.get(id)!;
    const quantity = quantities.get(id)!;
    const unitCents = overrides.get(id) ?? toCents(product.base_price);
    return {
      productId: id,
      name: product.product_name,
      sku: product.sku ?? null,
      unitCents,
      quantity,
      totalCents: unitCents * quantity,
    };
  });
}
