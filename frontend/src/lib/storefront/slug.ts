/**
 * The key that identifies the current storefront to the backend, resolved in the browser:
 *   - path-based:    https://app.com/store/<slug>/...  -> <slug>
 *   - subdomain:     https://<slug>.app.com/...        -> <slug>
 *   - custom domain: https://www.shop.com/...          -> the hostname (the backend matches `custom_domain`)
 */
export function clientStoreKey(): string {
  if (typeof window === "undefined") return "";
  // The template gallery / store editor preview isn't a real store.
  if (window.location.pathname.startsWith("/templates")) return "";
  const pathMatch = window.location.pathname.match(/^\/store\/([^/]+)/);
  if (pathMatch) return pathMatch[1];

  const host = window.location.hostname.toLowerCase();
  const root = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "").split(":")[0].toLowerCase();
  if (root && host.endsWith(`.${root}`)) return host.slice(0, -(root.length + 1));
  // `<slug>.localhost` during development.
  if (host.endsWith(".localhost")) return host.slice(0, -".localhost".length);
  return host;
}
