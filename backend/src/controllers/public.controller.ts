import type { Request, Response } from 'express';
import { db } from '../lib/supabase.js';
import { ApiError, notFound, uuidSchema } from '../lib/http.js';
import { fetchWithCache } from '../lib/kv.js';
import { getStoreEntitlements, hasFeature } from '../services/entitlements.js';
import { getAccessibleSpecialCatalogs } from '../services/pricing.js';
import { getCustomization, getPaymentMethodsSettings, publicPaymentMethods, requireStoreTenant } from '../services/tenants.js';
import { DEFAULT_TEMPLATE } from '../services/templates.js';

const PRODUCT_COLUMNS =
  'product_id, product_name, slug, description, base_price, compare_at_price, status, has_variants, three_d_model_url, created_date, categories(category_name), product_images(image_url, is_primary, sort_order)';

function orderImages<T extends { product_images?: any[] | null }>(product: T): T {
  if (Array.isArray(product.product_images)) {
    product.product_images = [...product.product_images].sort(
      (a, b) => Number(!!b.is_primary) - Number(!!a.is_primary) || (a.sort_order ?? 0) - (b.sort_order ?? 0),
    );
  }
  return product;
}

export async function getStore(req: Request, res: Response) {
  const tenant = await requireStoreTenant(req.params.slug);
  const customization = await getCustomization(tenant.tenant_id);
  // Not cached (unlike the customization above): a merchant who just bought this add-on expects the
  // storefront to reflect it immediately, and a downgrade should stop offering it just as fast.
  const entitlements = await getStoreEntitlements(tenant.tenant_id);
  const paymentMethods = await getPaymentMethodsSettings(tenant.tenant_id);

  res.json({
    tenantId: tenant.tenant_id,
    name: tenant.tenant_name,
    code: tenant.code,
    templateId: customization.templateId || DEFAULT_TEMPLATE,
    customization,
    // Only the one boolean the storefront needs to render checkout - never the merchant's plan/addons.
    onlinePaymentsEnabled: hasFeature(entitlements, 'online_payments'),
    // Only enabled methods, and only the detail fields the merchant actually filled in - never a secret,
    // this is exactly what the merchant wants shoppers to see in order to pay them.
    paymentMethods: publicPaymentMethods(paymentMethods),
  });
}

export async function listStoreProducts(req: Request, res: Response) {
  const tenant = await requireStoreTenant(req.params.slug);

  const products = await fetchWithCache(
    `tenant_products:${tenant.tenant_id}`,
    async () => {
      const { data, error } = await db
        .from('products')
        .select(PRODUCT_COLUMNS)
        .eq('tenant_id', tenant.tenant_id)
        .eq('status', 'ACTIVE')
        .order('created_date', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(orderImages);
    },
    300,
  );

  res.json({ data: products });
}

export async function getStoreProduct(req: Request, res: Response) {
  const tenant = await requireStoreTenant(req.params.slug);
  const productId = uuidSchema.safeParse(req.params.id);
  if (!productId.success) throw notFound('Product not found');

  const { data: product, error } = await db
    .from('products')
    .select(PRODUCT_COLUMNS)
    .eq('tenant_id', tenant.tenant_id)
    .eq('product_id', productId.data)
    .eq('status', 'ACTIVE')
    .maybeSingle();
  if (error) throw error;
  if (!product) throw notFound('Product not found');

  res.json({ data: orderImages(product) });
}

export async function getStoreCatalog(req: Request, res: Response) {
  const tenant = await requireStoreTenant(req.params.slug);
  const catalogSlug = String(req.params.catalogSlug);
  if (!/^[a-z0-9][a-z0-9-]{0,199}$/.test(catalogSlug)) throw notFound('Catalog not found');

  const { data: catalog } = await db
    .from('catalogs')
    .select('catalog_id, catalog_name, slug, catalog_type, description')
    .eq('tenant_id', tenant.tenant_id)
    .eq('slug', catalogSlug)
    .eq('is_active', true)
    .maybeSingle();
  if (!catalog) throw notFound('Catalog not found');

  // Special (B2B) catalogs are restricted to the customers the merchant granted access to.
  if (catalog.catalog_type === 'SPECIAL') {
    const shopper = req.shopper;
    if (!shopper || shopper.tenantId !== tenant.tenant_id) {
      throw new ApiError(401, 'Please log in to view this catalog', undefined, 'LOGIN_REQUIRED');
    }
    const accessible = await getAccessibleSpecialCatalogs(tenant.tenant_id, shopper.customer);
    if (!accessible.some((c) => c.catalog_id === catalog.catalog_id)) {
      throw new ApiError(403, 'You do not have permission to view this catalog', undefined, 'FORBIDDEN');
    }
  }

  const { data: rows, error } = await db
    .from('catalog_products')
    .select(`price_override, compare_at_price_override, products!inner(${PRODUCT_COLUMNS})`)
    .eq('catalog_id', catalog.catalog_id)
    .eq('is_active', true)
    .eq('products.status', 'ACTIVE')
    .eq('products.tenant_id', tenant.tenant_id);
  if (error) throw error;

  const products = (rows ?? [])
    .map((row: any) => {
      const product = Array.isArray(row.products) ? row.products[0] : row.products;
      if (!product) return null;
      if (row.price_override !== null) product.base_price = row.price_override;
      if (row.compare_at_price_override !== null) product.compare_at_price = row.compare_at_price_override;
      return orderImages(product);
    })
    .filter(Boolean)
    .sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());

  res.json({ catalog, products });
}
