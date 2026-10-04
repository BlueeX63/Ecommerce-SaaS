import { cache } from "react";
import { backendFetch, type ApiResult } from "@/lib/api";
import type { PaymentMethodDetails } from "@/components/storefront/PremiumPaymentSelector";

export interface StoreInfo {
  tenantId: string;
  name: string;
  code: string;
  templateId: string;
  customization: Record<string, unknown>;
  /** Whether the store owner purchased the Online Payment Integration add-on (UPI/netbanking vs. COD only). */
  onlinePaymentsEnabled: boolean;
  /** Which manual payment methods the merchant enabled, and the UPI ID / bank details to show shoppers. */
  paymentMethods: PaymentMethodDetails;
}

/**
 * A product as returned by the public storefront API. Template components accept looser/legacy shapes
 * too (see product-mapper.ts), so this is intentionally permissive about extra fields.
 */
export interface StoreProduct {
  product_id: string;
  product_name: string;
  slug: string;
  description: string | null;
  base_price: number;
  compare_at_price: number | null;
  status: string;
  three_d_model_url: string | null;
  categories: { category_name: string } | null;
  product_images: Array<{ image_url: string; is_primary: boolean; sort_order: number }>;
  [key: string]: unknown;
}

/** Public storefront data. `slug` is the store code or, for custom domains, the whole hostname. */
export const getStore = cache(async (slug: string): Promise<StoreInfo | null> => {
  const result = await backendFetch<StoreInfo>(`/api/v1/public/stores/${encodeURIComponent(slug)}`);
  return result.ok ? result.data : null;
});

/** Active products of the store (already stripped of internal fields by the backend). */
export const getStoreProducts = cache(async (slug: string): Promise<StoreProduct[]> => {
  const result = await backendFetch<{ data: StoreProduct[] }>(`/api/v1/public/stores/${encodeURIComponent(slug)}/products`);
  return result.ok ? result.data.data : [];
});

export async function getStoreProduct(slug: string, id: string): Promise<StoreProduct | null> {
  const result = await backendFetch<{ data: StoreProduct }>(
    `/api/v1/public/stores/${encodeURIComponent(slug)}/products/${encodeURIComponent(id)}`,
  );
  return result.ok ? result.data.data : null;
}

export interface CatalogPayload {
  catalog: { catalog_id: string; catalog_name: string; slug: string; catalog_type: string; description: string | null };
  products: StoreProduct[];
}

/** Forwards the shopper's cookies so special (B2B) catalogs can be access-checked by the backend. */
export function getCatalog(slug: string, catalogSlug: string): Promise<ApiResult<CatalogPayload>> {
  return backendFetch<CatalogPayload>(
    `/api/v1/public/stores/${encodeURIComponent(slug)}/catalogs/${encodeURIComponent(catalogSlug)}`,
    { auth: true },
  );
}
