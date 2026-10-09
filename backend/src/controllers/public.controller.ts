import type { Request, Response } from 'express';
import { db } from '../lib/supabase.js';
import { ApiError, notFound, str, uuidSchema } from '../lib/http.js';
import { fetchWithCache } from '../lib/kv.js';
import { getStoreEntitlements, hasFeature } from '../services/entitlements.js';
import { getAccessibleSpecialCatalogs } from '../services/pricing.js';
import { getCheckoutSettings, publicCheckoutConfig } from '../services/checkout-settings.js';
import { getActiveWarehouses, getTenantStockSummaryCached, planFulfillment } from '../services/fulfillment.js';
import { geocode, isValidPoint } from '../services/geo.js';
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

/** Adds `stock_status` so storefronts can show "Out of stock" and offer an in-stock filter. Never cached with the product list. */
async function withStock<T extends { product_id: string }>(tenantId: string, products: T[]) {
  let totals: Map<string, number>;
  try {
    totals = await getTenantStockSummaryCached(tenantId);
  } catch (error) {
    console.error('[public] stock lookup failed', error);
    totals = new Map();
  }
  return products.map((p) => {
    const total = totals.get(p.product_id);
    return { ...p, stock_status: total === undefined ? 'untracked' : total > 0 ? 'in_stock' : 'out_of_stock' };
  });
}

export async function getStore(req: Request, res: Response) {
  const tenant = await requireStoreTenant(req.params.slug);
  const customization = await getCustomization(tenant.tenant_id);
  // Not cached (unlike the customization above): a merchant who just bought this add-on expects the
  // storefront to reflect it immediately, and a downgrade should stop offering it just as fast.
  const entitlements = await getStoreEntitlements(tenant.tenant_id);
  const paymentMethods = await getPaymentMethodsSettings(tenant.tenant_id);
  const checkoutSettings = await getCheckoutSettings(tenant.tenant_id);

  res.json({
    tenantId: tenant.tenant_id,
    name: tenant.tenant_name,
    code: tenant.code,
    templateId: customization.templateId || DEFAULT_TEMPLATE,
    customization,
    // Only the one boolean the storefront needs to render checkout - never the merchant's plan/addons.
    onlinePaymentsEnabled: hasFeature(entitlements, 'online_payments'),
    // Whether the storefront AI assistant (chat + voice) is switched on for this store.
    aiAssistantEnabled: hasFeature(entitlements, 'ai_tools'),
    // Only enabled methods, and only the detail fields the merchant actually filled in - never a secret,
    // this is exactly what the merchant wants shoppers to see in order to pay them.
    paymentMethods: publicPaymentMethods(paymentMethods),
    // GST / delivery-charge rules so the cart can explain pricing; the checkout quote is the authority.
    checkoutConfig: publicCheckoutConfig(checkoutSettings),
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

  res.json({ data: await withStock(tenant.tenant_id, products) });
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

  res.json({ data: (await withStock(tenant.tenant_id, [orderImages(product)]))[0] });
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

  res.json({ catalog, products: await withStock(tenant.tenant_id, products as any[]) });
}

/**
 * "When will it arrive?" for a product page: the nearest warehouse that has the item in stock, and the
 * resulting delivery window for the shopper's PIN code / city. Public - no login needed.
 */
export async function deliveryEstimate(req: Request, res: Response) {
  const tenant = await requireStoreTenant(req.params.slug);
  const productId = uuidSchema.safeParse(str(req.query.productId));
  if (!productId.success) throw notFound('Product not found');

  const postalCode = str(req.query.pin)?.trim().slice(0, 12);
  const city = str(req.query.city)?.trim().slice(0, 100);
  const state = str(req.query.state)?.trim().slice(0, 100);
  if (!postalCode && !city) throw new ApiError(400, 'Enter a PIN code to check delivery.');
  if (postalCode && !/^[A-Za-z0-9 -]{3,12}$/.test(postalCode)) throw new ApiError(400, 'Enter a valid PIN code.');

  const { data: product } = await db
    .from('products')
    .select('product_id')
    .eq('product_id', productId.data)
    .eq('tenant_id', tenant.tenant_id)
    .eq('status', 'ACTIVE')
    .maybeSingle();
  if (!product) throw notFound('Product not found');

  const settings = await getCheckoutSettings(tenant.tenant_id);
  const warehouses = await getActiveWarehouses(tenant.tenant_id);
  const point = warehouses.some((w) => isValidPoint(w.latitude, w.longitude)) ? await geocode({ postalCode, city, state }) : null;
  const plan = await planFulfillment(tenant.tenant_id, [{ productId: productId.data, quantity: 1 }], { postalCode, city, state, point }, settings, warehouses);

  res.json({
    inStock: plan.allInStock,
    eta: plan.eta,
    basis: plan.basis,
    shipFrom: plan.shipFrom ? { city: plan.shipFrom.city, distanceKm: plan.shipFrom.distanceKm, approximate: plan.shipFrom.approximate } : null,
    delivery: publicCheckoutConfig(settings),
  });
}
