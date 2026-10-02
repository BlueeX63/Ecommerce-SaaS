import { isIP } from 'node:net';

const PRIVATE_HOSTNAMES = new Set(['localhost', '0.0.0.0', '::1']);

function isPrivateIPv4(ip: string): boolean {
  const [a, b] = ip.split('.').map(Number);
  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

/**
 * Rejects URLs a server-initiated request (webhook delivery, etc.) should never be pointed at: localhost,
 * link-local/private IP ranges, and non-http(s) schemes. This is a first line of defense against SSRF from
 * merchant-supplied URLs - it does not defend against DNS rebinding, which would need a redirect-following
 * proxy that re-validates every hop.
 */
export function isSafeExternalUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (PRIVATE_HOSTNAMES.has(hostname)) return false;
  if (hostname.endsWith('.local') || hostname.endsWith('.internal')) return false;

  const ipVersion = isIP(hostname);
  if (ipVersion === 4 && isPrivateIPv4(hostname)) return false;
  if (ipVersion === 6 && (hostname === '::1' || hostname.startsWith('fc') || hostname.startsWith('fd') || hostname.startsWith('fe80'))) {
    return false;
  }

  return true;
}
