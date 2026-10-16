import { db } from '../lib/supabase.js';
import { fetchWithCache, kvDel } from '../lib/kv.js';
import { ApiError } from '../lib/http.js';
import { callRpc } from '../lib/rpc.js';
import type { CheckoutSettings } from './checkout-settings.js';
import { buildEta, refineEta, type Eta, type EtaFactors } from './eta.js';
import { syncOutOfStockAlerts } from './notifications.js';
import { geocode, haversineKm, isValidPoint, roughDistanceKm, type AddressParts, type GeoPoint } from './geo.js';

export interface Warehouse {
  warehouse_id: string;
  warehouse_name: string;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  dispatch_hours: number | null;
  daily_capacity: number | null;
}

export interface StockRow {
  inventoryId: string;
  variantId: string;
  warehouseId: string;
  available: number;
}

export interface Destination extends AddressParts {
  point?: GeoPoint | null;
}

export interface LinePlan {
  productId: string;
  quantity: number;
  /** The merchant keeps stock records for this product. */
  tracked: boolean;
  status: 'in_stock' | 'out_of_stock' | 'assumed';
  warehouseId: string | null;
  distanceKm: number | null;
}

export interface FulfillmentPlan {
  lines: LinePlan[];
  allInStock: boolean;
  shipFrom: { warehouseId: string; name: string; city: string | null; state: string | null; distanceKm: number | null; approximate: boolean } | null;
  eta: Eta;
  factors: EtaFactors;
  /** 'warehouse': derived from real warehouse locations. 'default': the store's configured fallback range. */
  basis: 'warehouse' | 'default';
}

const WAREHOUSE_COLUMNS = 'warehouse_id, warehouse_name, city, state_province, postal_code, country, latitude, longitude, dispatch_hours, daily_capacity';

/**
 * Warehouses created before coordinates existed (or whose lookup failed at save time) get located the first time
 * they are needed: the address/city/PIN is geocoded and the result saved, so this happens once per warehouse.
 */
async function locateMissing(tenantId: string, warehouses: Warehouse[]): Promise<void> {
  for (const w of warehouses) {
    if (isValidPoint(w.latitude, w.longitude) || !(w.city || w.postal_code)) continue;
    const point = await geocode({ city: w.city, state: w.state_province, postalCode: w.postal_code, country: w.country });
    if (!point) continue;
    w.latitude = point.lat;
    w.longitude = point.lng;
    await db.from('warehouses').update({ latitude: point.lat, longitude: point.lng }).eq('warehouse_id', w.warehouse_id).eq('tenant_id', tenantId);
  }
}

export async function getActiveWarehouses(tenantId: string): Promise<Warehouse[]> {
  const { data, error } = await db.from('warehouses').select(WAREHOUSE_COLUMNS).eq('tenant_id', tenantId).eq('is_active', true);
  if (error) throw error;
  const warehouses: Warehouse[] = (data ?? []).map((w: any) => ({
    ...w,
    latitude: w.latitude === null ? null : Number(w.latitude),
    longitude: w.longitude === null ? null : Number(w.longitude),
  }));
  await locateMissing(tenantId, warehouses);
  return warehouses;
}

/** Stock rows per product across every warehouse. A product with no rows is "not tracked". */
export async function getStockByProduct(tenantId: string, productIds: string[]): Promise<Map<string, StockRow[]>> {
  const result = new Map<string, StockRow[]>();
  if (productIds.length === 0) return result;

  const { data, error } = await db
    .from('inventory')
    .select('inventory_id, variant_id, warehouse_id, quantity_available, quantity_reserved, product_variants!inner(product_id)')
    .eq('tenant_id', tenantId)
    .in('product_variants.product_id', productIds);
  if (error) throw error;

  for (const row of data ?? []) {
    const variant: any = Array.isArray(row.product_variants) ? row.product_variants[0] : row.product_variants;
    if (!variant) continue;
    const list = result.get(variant.product_id) ?? [];
    list.push({
      inventoryId: row.inventory_id,
      variantId: row.variant_id,
      warehouseId: row.warehouse_id,
      available: Math.max(0, (row.quantity_available ?? 0) - (row.quantity_reserved ?? 0)),
    });
    result.set(variant.product_id, list);
  }
  return result;
}

function warehouseDistance(warehouse: Warehouse, destination: Destination): { km: number | null; approximate: boolean } {
  const origin = isValidPoint(warehouse.latitude, warehouse.longitude) ? { lat: warehouse.latitude!, lng: warehouse.longitude! } : null;
  if (origin && destination.point) return { km: haversineKm(origin, destination.point), approximate: false };
  const rough = roughDistanceKm(
    { city: warehouse.city, state: warehouse.state_province, postalCode: warehouse.postal_code },
    destination,
  );
  return { km: rough, approximate: true };
}

/**
 * Decides which warehouse ships each line (the nearest one that has the quantity in stock) and the resulting
 * delivery estimate. The estimate is for the slowest line, since the order is treated as one parcel.
 */
export async function planFulfillment(
  tenantId: string,
  lines: Array<{ productId: string; quantity: number }>,
  destination: Destination,
  settings: CheckoutSettings,
  preloadedWarehouses?: Warehouse[],
): Promise<FulfillmentPlan> {
  const [warehouses, stock] = await Promise.all([
    preloadedWarehouses ?? getActiveWarehouses(tenantId),
    getStockByProduct(tenantId, lines.map((l) => l.productId)),
  ]);
  const byId = new Map(warehouses.map((w) => [w.warehouse_id, w]));

  const distances = new Map<string, { km: number | null; approximate: boolean }>();
  const distanceOf = (w: Warehouse) => {
    let d = distances.get(w.warehouse_id);
    if (!d) {
      d = warehouseDistance(w, destination);
      distances.set(w.warehouse_id, d);
    }
    return d;
  };
  // Unknown distances sort last so a warehouse we can place always beats one we cannot.
  const nearest = (candidates: Warehouse[]) =>
    [...candidates].sort((a, b) => (distanceOf(a).km ?? Number.MAX_SAFE_INTEGER) - (distanceOf(b).km ?? Number.MAX_SAFE_INTEGER))[0];

  const linePlans: LinePlan[] = lines.map((line) => {
    const rows = (stock.get(line.productId) ?? []).filter((r) => byId.has(r.warehouseId));
    const tracked = (stock.get(line.productId) ?? []).length > 0;

    if (!tracked) {
      const pick = warehouses.length ? nearest(warehouses) : undefined;
      return {
        productId: line.productId,
        quantity: line.quantity,
        tracked: false,
        status: 'assumed',
        warehouseId: pick?.warehouse_id ?? null,
        distanceKm: pick ? distanceOf(pick).km : null,
      };
    }

    const perWarehouse = new Map<string, number>();
    for (const row of rows) perWarehouse.set(row.warehouseId, (perWarehouse.get(row.warehouseId) ?? 0) + row.available);
    const candidates = [...perWarehouse.entries()].filter(([, qty]) => qty >= line.quantity).map(([id]) => byId.get(id)!);

    if (candidates.length === 0) {
      return { productId: line.productId, quantity: line.quantity, tracked: true, status: 'out_of_stock', warehouseId: null, distanceKm: null };
    }
    const pick = nearest(candidates);
    return {
      productId: line.productId,
      quantity: line.quantity,
      tracked: true,
      status: 'in_stock',
      warehouseId: pick.warehouse_id,
      distanceKm: distanceOf(pick).km,
    };
  });

  const allInStock = linePlans.every((l) => l.status !== 'out_of_stock');
  const placed = linePlans.filter((l) => l.warehouseId);

  if (placed.length === 0) {
    return {
      lines: linePlans,
      allInStock,
      shipFrom: null,
      basis: 'default',
      eta: buildEta(settings.eta.defaultMinDays, settings.eta.defaultMaxDays),
      factors: { notes: [], confidence: 'low', sampleSize: 0 },
    };
  }

  // The slowest line decides the delivery date.
  const slowest = placed.reduce((a, b) => ((b.distanceKm ?? Infinity) > (a.distanceKm ?? Infinity) ? b : a));
  const origin = byId.get(slowest.warehouseId!)!;
  const { km, approximate } = distanceOf(origin);

  const refined = await refineEta({ tenantId, warehouse: origin, km, destination: { postalCode: destination.postalCode, state: destination.state }, settings });

  return {
    lines: linePlans,
    allInStock,
    shipFrom: { warehouseId: origin.warehouse_id, name: origin.warehouse_name, city: origin.city, state: origin.state_province, distanceKm: km === null ? null : Math.round(km), approximate },
    eta: refined.eta,
    factors: refined.factors,
    basis: km === null && refined.factors.sampleSize === 0 ? 'default' : 'warehouse',
  };
}

// ---------------------------------------------------------------------------------------------
// Stock movements
// ---------------------------------------------------------------------------------------------

/**
 * Takes the ordered quantities out of the planned warehouses. One atomic database call (`allocate_order_stock`):
 * the stock rows are locked, every line is checked and deducted, and if any line cannot be covered nothing is taken.
 */
export async function allocateStock(tenantId: string, orderId: string, plan: FulfillmentPlan): Promise<void> {
  const lines = plan.lines
    .filter((line) => line.tracked && line.warehouseId)
    .map((line) => ({ product_id: line.productId, warehouse_id: line.warehouseId, quantity: line.quantity }));
  if (lines.length === 0) return;

  try {
    await callRpc('allocate_order_stock', { p_tenant: tenantId, p_order: orderId, p_lines: lines });
  } catch (error) {
    if (error instanceof ApiError && error.code === 'INSUFFICIENT_STOCK') {
      throw new ApiError(409, 'An item in your order just went out of stock. Please review your cart.');
    }
    throw error;
  } finally {
    void invalidateStockCache(tenantId);
    void syncOutOfStockAlerts(tenantId, lines.map((l) => l.product_id));
  }
}

/**
 * Puts back whatever an order still holds, wherever it currently is (it may have been moved between warehouses).
 * Net-based and safe to call more than once.
 */
export async function restockOrder(tenantId: string, orderId: string): Promise<void> {
  await callRpc('release_order_stock', { p_tenant: tenantId, p_order: orderId });
  void invalidateStockCache(tenantId);
}

/** Creates (or returns) the single default variant used to hold stock for a product without options. */
export async function ensureDefaultVariant(productId: string, sku: string | null): Promise<string> {
  const { data: existing } = await db.from('product_variants').select('variant_id').eq('product_id', productId).order('variant_id').limit(1);
  if (existing?.length) return existing[0].variant_id;

  const { data: created, error } = await db
    .from('product_variants')
    .insert({ product_id: productId, sku: sku ?? null, inventory_quantity: 0 })
    .select('variant_id')
    .single();
  if (error) {
    // Raced with another request creating the same default variant.
    const { data: again } = await db.from('product_variants').select('variant_id').eq('product_id', productId).limit(1);
    if (again?.length) return again[0].variant_id;
    throw error;
  }
  return created.variant_id;
}

/**
 * Total sellable units per product across all active warehouses, for every product the merchant tracks stock for.
 * Products without any inventory row are absent from the map ("not tracked").
 */
export async function getTenantStockSummary(tenantId: string): Promise<Map<string, number>> {
  const totals = new Map<string, number>();
  const PAGE = 1000;
  for (let from = 0; from < 20_000; from += PAGE) {
    const { data, error } = await db
      .from('inventory')
      .select('quantity_available, quantity_reserved, warehouses!inner(is_active), product_variants!inner(product_id)')
      .eq('tenant_id', tenantId)
      .order('inventory_id')
      .range(from, from + PAGE - 1);
    if (error) throw error;
    for (const row of data ?? []) {
      const variant: any = Array.isArray(row.product_variants) ? row.product_variants[0] : row.product_variants;
      const warehouse: any = Array.isArray(row.warehouses) ? row.warehouses[0] : row.warehouses;
      if (!variant) continue;
      const sellable = warehouse?.is_active === false ? 0 : Math.max(0, (row.quantity_available ?? 0) - (row.quantity_reserved ?? 0));
      totals.set(variant.product_id, (totals.get(variant.product_id) ?? 0) + sellable);
    }
    if ((data?.length ?? 0) < PAGE) break;
  }
  return totals;
}

const stockCacheKey = (tenantId: string) => `stock_summary:${tenantId}`;

/**
 * Same as getTenantStockSummary but cached for a few seconds, for the high-traffic public product endpoints.
 * Checkout, quotes and order placement always read live stock, so a stale badge can never oversell.
 */
export async function getTenantStockSummaryCached(tenantId: string): Promise<Map<string, number>> {
  const plain = await fetchWithCache<Record<string, number>>(
    stockCacheKey(tenantId),
    async () => Object.fromEntries(await getTenantStockSummary(tenantId)),
    20,
  );
  return new Map(Object.entries(plain));
}

export const invalidateStockCache = (tenantId: string) => kvDel(stockCacheKey(tenantId)).catch(() => undefined);
