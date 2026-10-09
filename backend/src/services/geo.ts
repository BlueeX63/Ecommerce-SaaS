import { kvGet, kvSet } from '../lib/kv.js';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface AddressParts {
  line1?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
}

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

export function isValidPoint(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

/** Great-circle distance between two points, in kilometres. */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

const norm = (value: string | null | undefined) => (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

/** Coarse distance used when coordinates are unknown: same city, same state, or somewhere else. */
export function roughDistanceKm(from: AddressParts, to: AddressParts): number | null {
  const fromCity = norm(from.city);
  const toCity = norm(to.city);
  if (fromCity && toCity && fromCity === toCity) return 20;
  const fromState = norm(from.state);
  const toState = norm(to.state);
  if (fromState && toState) return fromState === toState ? 300 : 1200;
  const fromPin = norm(from.postalCode);
  const toPin = norm(to.postalCode);
  if (fromPin.length >= 3 && toPin.length >= 3 && fromPin.slice(0, 3) === toPin.slice(0, 3)) return 60;
  return null;
}

// ---------------------------------------------------------------------------------------------
// Geocoding (OpenStreetMap Nominatim). Best effort: any failure just means "no coordinates", and the caller
// falls back to a coarse city/state estimate. Results are cached for 30 days; misses for a day.
// ---------------------------------------------------------------------------------------------

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'MonolithStorefront/1.0 (order delivery estimates)';
const HIT_TTL = 30 * 24 * 3600;
const MISS_TTL = 24 * 3600;

type CacheEntry = { lat: number; lng: number } | { miss: true };

// Nominatim's usage policy allows ~1 request per second; serialise our lookups.
let lastCall = 0;
let queue: Promise<unknown> = Promise.resolve();

function throttled<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const wait = Math.max(0, lastCall + 1100 - Date.now());
    if (wait) await new Promise((r) => setTimeout(r, wait));
    lastCall = Date.now();
    return task();
  });
  queue = run.catch(() => undefined);
  return run;
}

async function lookup(query: string): Promise<GeoPoint | null> {
  const key = `geo:${query}`;
  try {
    const cached = await kvGet<CacheEntry>(key);
    if (cached) return 'miss' in cached ? null : { lat: cached.lat, lng: cached.lng };
  } catch {
    // cache unavailable - carry on without it
  }

  let point: GeoPoint | null = null;
  try {
    point = await throttled(async () => {
      const url = `${NOMINATIM_URL}?${new URLSearchParams({ format: 'json', limit: '1', q: query })}`;
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' }, signal: AbortSignal.timeout(4000) });
      if (!res.ok) return null;
      const rows = (await res.json()) as Array<{ lat?: string; lon?: string }>;
      const lat = Number(rows?.[0]?.lat);
      const lng = Number(rows?.[0]?.lon);
      return isValidPoint(lat, lng) ? { lat, lng } : null;
    });
  } catch {
    return null; // network problems are not cached as misses
  }

  kvSet(key, point ?? { miss: true }, point ? HIT_TTL : MISS_TTL).catch(() => undefined);
  return point;
}

/** Looks up coordinates for an address. Tries the most specific query first, then widens. */
export async function geocode(parts: AddressParts): Promise<GeoPoint | null> {
  const clean = (v?: string | null) => (v ?? '').replace(/[\r\n]+/g, ' ').trim();
  const country = clean(parts.country) || 'India';
  const attempts = [
    [parts.line1, parts.city, parts.state, parts.postalCode, country],
    [parts.postalCode, parts.city, country],
    [parts.city, parts.state, country],
    [parts.postalCode, country],
  ]
    .map((p) => p.map(clean).filter(Boolean).join(', '))
    .filter((q, i, all) => q && q.length > country.length + 2 && all.indexOf(q) === i);

  for (const query of attempts) {
    const point = await lookup(query.toLowerCase().slice(0, 300));
    if (point) return point;
  }
  return null;
}
