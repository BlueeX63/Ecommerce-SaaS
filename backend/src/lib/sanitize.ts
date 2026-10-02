const DANGEROUS_SCHEME = /^[\s\u0000-\u001f]*(javascript|vbscript|data|file)\s*:/i;
const SAFE_DATA_IMAGE = /^\s*data:image\/(png|jpe?g|gif|webp|avif);base64,[a-z0-9+/=\s]+$/i;

const MAX_DEPTH = 6;
const MAX_KEYS = 500;
const MAX_STRING = 20_000;

/**
 * Recursively cleans merchant-supplied customization content before it is stored:
 *  - strips `javascript:` / `vbscript:` / `data:` / `file:` URLs (except inline raster images) that could
 *    become stored XSS when rendered into an href/src,
 *  - drops prototype-pollution keys,
 *  - bounds depth, key count and string length.
 */
export function sanitizeCustomization<T>(input: T): T {
  let keys = 0;

  const walk = (value: unknown, depth: number): unknown => {
    if (depth > MAX_DEPTH) return undefined;

    if (typeof value === 'string') {
      const trimmed = value.length > MAX_STRING && !SAFE_DATA_IMAGE.test(value) ? value.slice(0, MAX_STRING) : value;
      if (DANGEROUS_SCHEME.test(trimmed) && !SAFE_DATA_IMAGE.test(trimmed)) return '';
      return trimmed;
    }
    if (typeof value === 'number' || typeof value === 'boolean' || value === null) return value;

    if (Array.isArray(value)) return value.slice(0, 200).map((v) => walk(v, depth + 1));

    if (typeof value === 'object' && value !== null) {
      const out: Record<string, unknown> = {};
      for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
        if (++keys > MAX_KEYS) break;
        out[key] = walk(v, depth + 1);
      }
      return out;
    }
    return undefined;
  };

  return walk(input, 0) as T;
}

/** URL-safe slug (lowercase letters, digits, hyphens). */
export function slugify(value: string, maxLength = 40): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength)
    .replace(/-+$/g, '');
}

/** Store slugs become subdomains, so they must be valid DNS labels and must not shadow platform hostnames. */
export const STORE_SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])$/;

export const RESERVED_SLUGS = new Set([
  'www', 'api', 'app', 'admin', 'dashboard', 'store', 'stores', 'static', 'assets', 'cdn', 'mail', 'smtp', 'ftp',
  'login', 'signup', 'auth', 'support', 'help', 'billing', 'checkout', 'pricing', 'status', 'blog', 'docs',
  'root', 'localhost', 'staging', 'dev', 'test', 'templates', 'onboarding',
]);

export function isValidStoreSlug(slug: string): boolean {
  return STORE_SLUG_REGEX.test(slug) && !RESERVED_SLUGS.has(slug);
}

const HOSTNAME_LABEL = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/;

/** Validates and normalises a custom domain (no scheme, path, port or IP addresses). */
export function normalizeDomain(raw: string): string | null {
  const domain = raw.trim().toLowerCase().replace(/\.$/, '');
  if (domain.length < 4 || domain.length > 253) return null;
  const labels = domain.split('.');
  if (labels.length < 2) return null;
  if (!labels.every((label) => HOSTNAME_LABEL.test(label))) return null;
  // Reject IPv4-looking hosts and purely numeric TLDs.
  if (/^\d+$/.test(labels[labels.length - 1])) return null;
  if (!/^[a-z]{2,}$|^xn--[a-z0-9-]+$/.test(labels[labels.length - 1])) return null;
  return domain;
}
