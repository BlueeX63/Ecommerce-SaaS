import { db } from '../lib/supabase.js';
import { escapeLike, notFound } from '../lib/http.js';
import { callRpc } from '../lib/rpc.js';
import { haversineKm, isValidPoint } from './geo.js';

/** Orders still on their way to the shopper. An order from this list whose promised date has passed is "delayed". */
export const IN_TRANSIT_STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED'];

export type RelatedMatch = 'person' | 'address' | 'nearby';
export const RELATED_MATCHES: RelatedMatch[] = ['person', 'address', 'nearby'];
export const DEFAULT_NEARBY_KM = 3;

export interface OrderReference {
  order_id: string;
  order_number: string;
  customer_id: string | null;
  shipping_name: string | null;
  shipping_phone: string | null;
  shipping_address_line_1: string | null;
  shipping_postal_code: string | null;
  shipping_city: string | null;
  shipping_latitude: number | null;
  shipping_longitude: number | null;
}

const REFERENCE_COLUMNS =
  'order_id, order_number, customer_id, shipping_name, shipping_phone, shipping_address_line_1, shipping_postal_code, shipping_city, shipping_latitude, shipping_longitude';

export async function loadReference(tenantId: string, orderId: string): Promise<OrderReference> {
  const { data } = await db.from('orders').select(REFERENCE_COLUMNS).eq('order_id', orderId).eq('tenant_id', tenantId).maybeSingle();
  if (!data) throw notFound('Order not found');
  const n = (v: unknown) => (v === null || v === undefined ? null : Number(v));
  return { ...data, shipping_latitude: n(data.shipping_latitude), shipping_longitude: n(data.shipping_longitude) } as OrderReference;
}

export interface RelatedFilter {
  /** Narrows an `orders` query to the related orders. */
  apply: (query: any) => any;
  /** Exact-distance check for "nearby" (the database only narrows to a box). Absent for the other matches. */
  post?: (row: { shipping_latitude: number | null; shipping_longitude: number | null }) => { keep: boolean; distanceKm: number | null };
}

/** A postal-code prefix that identifies the neighbourhood: 4 of 6 digits for a PIN code, 3 of 5 for a ZIP. */
function areaPrefix(postalCode: string | null): string | null {
  const pin = (postalCode ?? '').replace(/\s+/g, '');
  if (pin.length < 4 || /[,()*%]/.test(pin)) return null;
  return pin.slice(0, Math.max(3, pin.length - 2));
}

const clean = (value: string | null) => (value ?? '').trim();

/**
 * Orders that belong with a reference order:
 *  - person:  the same customer (or, for a guest, the same phone number)
 *  - address: the same street address in the same PIN code / city
 *  - nearby:  delivered to the same area, within `radiusKm` when both addresses are mapped, otherwise the same
 *             postal-code area. Everything that matches "address" is also nearby.
 */
export function relatedFilter(ref: OrderReference, match: RelatedMatch, radiusKm = DEFAULT_NEARBY_KM): RelatedFilter {
  if (match === 'person') {
    return {
      apply: (q) => {
        if (ref.customer_id) return q.eq('customer_id', ref.customer_id);
        if (clean(ref.shipping_phone)) return q.eq('shipping_phone', clean(ref.shipping_phone));
        return q.eq('order_id', ref.order_id);
      },
    };
  }

  if (match === 'address') {
    return {
      apply: (q) => {
        const line = clean(ref.shipping_address_line_1);
        if (!line) return q.eq('order_id', ref.order_id);
        let next = q.ilike('shipping_address_line_1', escapeLike(line));
        if (clean(ref.shipping_postal_code)) next = next.eq('shipping_postal_code', clean(ref.shipping_postal_code));
        else if (clean(ref.shipping_city)) next = next.ilike('shipping_city', escapeLike(clean(ref.shipping_city)));
        return next;
      },
    };
  }

  const prefix = areaPrefix(ref.shipping_postal_code);
  const origin = isValidPoint(ref.shipping_latitude, ref.shipping_longitude) ? { lat: ref.shipping_latitude!, lng: ref.shipping_longitude! } : null;
  return {
    apply: (q) => {
      const clauses: string[] = [];
      if (origin) {
        const dLat = radiusKm / 111;
        const dLng = radiusKm / (111 * Math.max(0.2, Math.cos((origin.lat * Math.PI) / 180)));
        clauses.push(
          `and(shipping_latitude.gte.${origin.lat - dLat},shipping_latitude.lte.${origin.lat + dLat},shipping_longitude.gte.${origin.lng - dLng},shipping_longitude.lte.${origin.lng + dLng})`,
        );
      }
      // Orders without map coordinates can only be matched by area.
      if (prefix) clauses.push(`shipping_postal_code.like.${prefix}*`);
      if (clauses.length === 0) {
        return clean(ref.shipping_city) ? q.ilike('shipping_city', escapeLike(clean(ref.shipping_city))) : q.eq('order_id', ref.order_id);
      }
      return q.or(clauses.join(','));
    },
    post: (row) => {
      if (origin && isValidPoint(Number(row.shipping_latitude), Number(row.shipping_longitude))) {
        const km = haversineKm(origin, { lat: Number(row.shipping_latitude), lng: Number(row.shipping_longitude) });
        return { keep: km <= radiusKm, distanceKm: Math.round(km * 10) / 10 };
      }
      return { keep: true, distanceKm: null };
    },
  };
}

/** Applies the "delayed" rule: still in transit, and the promised delivery date is behind us. */
export function applyDelayed(query: any): any {
  return query.in('status', IN_TRANSIT_STATUSES).not('estimated_delivery_date', 'is', null).lt('estimated_delivery_date', new Date().toISOString());
}

export function delayDays(order: { status: string; estimated_delivery_date: string | null }, now = Date.now()): number {
  if (!order.estimated_delivery_date || !IN_TRANSIT_STATUSES.includes(order.status)) return 0;
  const late = now - new Date(order.estimated_delivery_date).getTime();
  // Whole days late; anything under two days still reads as "1 day" so a late order is never shown as 0.
  return late > 0 ? Math.max(1, Math.floor(late / 86_400_000)) : 0;
}

export interface OrderCounts {
  total: number;
  delayed: number;
  byStatus: Record<string, number>;
  byPayment: Record<string, number>;
}

export async function orderCounts(tenantId: string): Promise<OrderCounts> {
  const rows = await callRpc<Array<{ status: string; payment_status: string; delayed: boolean; n: number | string }>>('order_filter_counts', { p_tenant: tenantId });
  const out: OrderCounts = { total: 0, delayed: 0, byStatus: {}, byPayment: {} };
  for (const r of rows ?? []) {
    const n = Number(r.n);
    out.total += n;
    if (r.delayed) out.delayed += n;
    out.byStatus[r.status] = (out.byStatus[r.status] ?? 0) + n;
    out.byPayment[r.payment_status] = (out.byPayment[r.payment_status] ?? 0) + n;
  }
  return out;
}

/** How many orders each "related" view of an order would show (the reference order itself is not counted). */
export async function relatedCounts(tenantId: string, ref: OrderReference, radiusKm = DEFAULT_NEARBY_KM): Promise<Record<RelatedMatch, number>> {
  const counts = {} as Record<RelatedMatch, number>;
  await Promise.all(
    RELATED_MATCHES.map(async (match) => {
      const filter = relatedFilter(ref, match, radiusKm);
      let query = db.from('orders').select('order_id, shipping_latitude, shipping_longitude', { count: 'exact', head: !filter.post }).eq('tenant_id', tenantId).neq('order_id', ref.order_id);
      query = filter.apply(query);
      if (filter.post) {
        const { data } = await query.limit(500);
        counts[match] = (data ?? []).filter((row: any) => filter.post!(row).keep).length;
      } else {
        const { count } = await query;
        counts[match] = count ?? 0;
      }
    }),
  );
  return counts;
}
