import { headers } from "next/headers";

/**
 * A live store is reachable either at a subdomain (foo.your-saas.com) or at a path under the
 * root domain (your-saas.com/store/foo). Every internal link a template renders needs the right
 * prefix for whichever one the shopper is actually on - this mirrors the logic in
 * store/[slug]/layout.tsx so every route resolves it the same way.
 */
export async function resolveStoreBasePath(slug: string): Promise<string> {
  const headersList = await headers();
  const hostname = headersList.get("host") || "";
  const isLocalhost = hostname.includes("localhost");
  const baseDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || (isLocalhost ? "localhost:3000" : "your-saas.com");
  let currentHost = "";
  if (hostname !== baseDomain && hostname !== `www.${baseDomain}`) {
    currentHost = hostname.endsWith(`.${baseDomain}`) ? hostname.replace(`.${baseDomain}`, "") : hostname;
  }
  const isSubdomain = !!currentHost;
  return isSubdomain ? "" : `/store/${slug}`;
}
