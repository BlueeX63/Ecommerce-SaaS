import { db } from '../lib/supabase.js';
import { fetchWithCache } from '../lib/kv.js';
import type { CheckoutSettings } from './checkout-settings.js';

export interface Eta {
  minDays: number;
  maxDays: number;
  minDate: string;
  maxDate: string;
}

export interface EtaFactors {
  /** Human-readable reasons behind the estimate, safe to show to shoppers. */
  notes: string[];
  confidence: 'high' | 'medium' | 'low';
  /** Recent deliveries from this warehouse to this area that informed the estimate. */
  sampleSize: number;
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(20, 0, 0, 0);
  return d.toISOString();
}

export function buildEta(minDays: number, maxDays: number): Eta {
  const min = Math.max(1, Math.round(minDays));
  const max = Math.max(min, Math.round(maxDays));
  return { minDays: min, maxDays: max, minDate: addDays(min), maxDate: addDays(max) };
}

/**
 * Pure distance model: handling time at the warehouse, then road travel at `kmPerDay`. A quarter-day of travel
 * is absorbed by same-day courier runs, so nearby orders arrive the day after dispatch.
 */
export function etaForDistance(km: number | null, dispatchHours: number | null, settings: CheckoutSettings): Eta {
  if (km === null) return buildEta(settings.eta.defaultMinDays, settings.eta.defaultMaxDays);
  const handlingDays = Math.ceil(Math.max(0, (dispatchHours ?? 24) / 24));
  const travelDays = Math.ceil(Math.max(0, km / settings.eta.kmPerDay - 0.25));
  const min = Math.max(1, handlingDays + travelDays);
  const max = min + 1 + Math.floor(km / 800);
  return buildEta(min, max);
}

// ---------------------------------------------------------------------------------------------
// Learning from real deliveries + current workload
// ---------------------------------------------------------------------------------------------

const HISTORY_DAYS = 180;
const MIN_SAMPLES = 3;
const norm = (s?: string | null) => (s ?? '').trim().toLowerCase();
const pinPrefix = (pin?: string | null, len = 3) => (pin ?? '').replace(/\D/g, '').slice(0, len);

interface Sample {
  days: number;
  pin: string;
  state: string;
}

async function loadHistory(tenantId: string, warehouseId: string): Promise<Sample[]> {
  return fetchWithCache<Sample[]>(
    `eta_history:${warehouseId}`,
    async () => {
      const since = new Date(Date.now() - HISTORY_DAYS * 86_400_000).toISOString();
      const { data } = await db
        .from('orders')
        .select('created_date, delivered_date, shipping_postal_code, shipping_state')
        .eq('tenant_id', tenantId)
        .eq('fulfillment_warehouse_id', warehouseId)
        .eq('status', 'DELIVERED')
        .not('delivered_date', 'is', null)
        .gte('created_date', since)
        .order('created_date', { ascending: false })
        .limit(500);
      return (data ?? [])
        .map((o: any) => ({
          days: (new Date(o.delivered_date).getTime() - new Date(o.created_date).getTime()) / 86_400_000,
          pin: pinPrefix(o.shipping_postal_code, 6),
          state: norm(o.shipping_state),
        }))
        .filter((s) => Number.isFinite(s.days) && s.days >= 0 && s.days < 60);
    },
    600,
  );
}

interface Route {
  destination: string;
  min: number;
  max: number;
}

async function loadRoutes(tenantId: string, warehouseId: string): Promise<Route[]> {
  return fetchWithCache<Route[]>(
    `eta_routes:${warehouseId}`,
    async () => {
      const { data } = await db.from('warehouse_routes').select('destination, transit_min_days, transit_max_days').eq('tenant_id', tenantId).eq('warehouse_id', warehouseId);
      return (data ?? []).map((r: any) => ({ destination: norm(r.destination), min: r.transit_min_days, max: r.transit_max_days }));
    },
    300,
  );
}

export const invalidateEtaCaches = async (warehouseId: string) => {
  const { kvDel } = await import('../lib/kv.js');
  await kvDel(`eta_history:${warehouseId}`, `eta_routes:${warehouseId}`).catch(() => undefined);
};

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[idx];
}

export interface EtaWarehouse {
  warehouse_id: string;
  dispatch_hours: number | null;
  daily_capacity?: number | null;
}

/**
 * The delivery window for one warehouse -> destination pair. Starts from the distance model, then
 *  1. uses the warehouse's configured route (state / PIN prefix) when there is one,
 *  2. blends in how long recent deliveries to this area actually took,
 *  3. adds days when the warehouse currently has more open orders than it can pack in a day.
 */
export async function refineEta(opts: {
  tenantId: string;
  warehouse: EtaWarehouse;
  km: number | null;
  destination: { postalCode?: string | null; state?: string | null };
  settings: CheckoutSettings;
}): Promise<{ eta: Eta; factors: EtaFactors }> {
  const { tenantId, warehouse, km, destination, settings } = opts;
  const base = etaForDistance(km, warehouse.dispatch_hours, settings);
  let min = base.minDays;
  let max = base.maxDays;
  const notes: string[] = [];
  let confidence: EtaFactors['confidence'] = km === null ? 'low' : 'medium';
  let sampleSize = 0;

  try {
    const handlingDays = Math.ceil(Math.max(0, (warehouse.dispatch_hours ?? 24) / 24));
    const pin = pinPrefix(destination.postalCode, 6);
    const state = norm(destination.state);

    // 1. configured route (longest matching PIN prefix wins, then state)
    const routes = await loadRoutes(tenantId, warehouse.warehouse_id);
    const route =
      routes.filter((r) => /^\d+$/.test(r.destination) && pin.startsWith(r.destination)).sort((a, b) => b.destination.length - a.destination.length)[0] ??
      routes.find((r) => !/^\d+$/.test(r.destination) && r.destination === state);
    if (route) {
      min = Math.max(1, handlingDays + route.min);
      max = Math.max(min, handlingDays + route.max);
      notes.push('Uses this warehouse’s usual transit time to your area');
      confidence = 'medium';
    }

    // 2. recent real deliveries to the same area
    const history = await loadHistory(tenantId, warehouse.warehouse_id);
    const near = history.filter((s) => pin.length >= 3 && s.pin.startsWith(pin.slice(0, 3)));
    const sameState = history.filter((s) => state && s.state === state);
    const pool = near.length >= MIN_SAMPLES ? near : sameState.length >= MIN_SAMPLES + 2 ? sameState : [];
    if (pool.length >= MIN_SAMPLES) {
      const days = pool.map((s) => s.days).sort((a, b) => a - b);
      const hMin = Math.ceil(percentile(days, 0.5));
      const hMax = Math.ceil(percentile(days, 0.85));
      const w = Math.min(0.75, pool.length / (pool.length + 4));
      min = Math.round(w * hMin + (1 - w) * min);
      max = Math.round(w * Math.max(hMin, hMax) + (1 - w) * max);
      sampleSize = pool.length;
      notes.push(`Based on ${pool.length} recent deliveries to this area`);
      confidence = pool.length >= 10 ? 'high' : 'medium';
    }

    // 3. current workload at the warehouse
    const { count } = await db
      .from('orders')
      .select('order_id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('fulfillment_warehouse_id', warehouse.warehouse_id)
      .in('status', ['PENDING', 'PROCESSING']);
    const capacity = Math.max(1, warehouse.daily_capacity ?? 50);
    const backlog = count ?? 0;
    const delay = backlog > capacity ? Math.min(5, Math.ceil(backlog / capacity) - 1) : 0;
    if (delay > 0) {
      min += delay;
      max += delay;
      notes.push(`The warehouse is busy right now (+${delay} day${delay > 1 ? 's' : ''})`);
    }
  } catch (error) {
    // Estimates degrade to the distance model rather than failing a checkout.
    console.warn('[eta] refinement failed, using distance model', (error as Error)?.message);
  }

  return { eta: buildEta(min, Math.max(min, max)), factors: { notes, confidence, sampleSize } };
}
