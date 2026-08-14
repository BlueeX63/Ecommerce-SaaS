import { notFound, redirect } from "next/navigation";
import { getAdminClient } from "@/lib/supabase/admin";
import { fetchWithCache } from "@/lib/redis";
import StarterMinimalistHome from "@/app/templates/minimalist/page";
import { getStoreSession } from "@/lib/auth/store-auth";

export default async function CatalogHomePage({
  params,
}: {
  params: Promise<{ slug: string; catalog_slug: string }>;
}) {
  const { slug, catalog_slug } = await params;
  const db = getAdminClient();
  
  const tenant = await fetchWithCache(
    `tenant:${slug}`,
    async () => {
      const { data } = await db.from("tenant").select("tenant_id").or(`code.eq.${slug},custom_domain.eq.${slug}`).single();
      return data;
    },
    3600
  );

  if (!tenant) return notFound();

  // Fetch Catalog
  const { data: catalog, error: catalogError } = await db.from("catalogs")
    .select("*")
    .eq("tenant_id", tenant.tenant_id)
    .eq("slug", catalog_slug)
    .eq("is_active", true)
    .single();

  if (catalogError || !catalog) {
    return notFound();
  }

  // Authorization check for SPECIAL catalogs
  if (catalog.catalog_type === 'SPECIAL') {
    const storefrontSession = await getStoreSession();
    
    if (!storefrontSession) {
      // Not logged in -> Redirect to login with callback
      redirect(`/store/${slug}/auth/login?callbackUrl=/store/${slug}/c/${catalog_slug}`);
    }

    try {
      // Check if this customer has access to this catalog
      const { data: accessData, error: accessError } = await db.from("catalog_customers")
        .select("catalog_id")
        .eq("catalog_id", catalog.catalog_id)
        .eq("customer_id", storefrontSession.customerId)
        .single();
        
      if (accessError || !accessData) {
        // Logged in but not authorized for this specific catalog
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 font-body text-center">
            <div className="max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h1 className="text-2xl font-heading mb-4 text-red-600">Access Denied</h1>
              <p className="text-gray-600 mb-6">You do not have permission to view this catalog. Please contact the store owner if you believe this is a mistake.</p>
              <a href={`/store/${slug}`} className="text-sm font-medium text-black underline">Return to Main Store</a>
            </div>
          </div>
        );
      }
    } catch (e) {
      redirect(`/store/${slug}/auth/login?callbackUrl=/store/${slug}/c/${catalog_slug}`);
    }
  }

  const settings = await fetchWithCache(
    `tenant_settings:${tenant.tenant_id}`,
    async () => {
      const { data } = await db.from("tenant_settings")
        .select("setting_value")
        .eq("tenant_id", tenant.tenant_id)
        .eq("setting_key", "customization")
        .single();
      return data;
    },
    3600
  );

  const customData = settings ? JSON.parse(settings.setting_value) : {};

  // Fetch products from catalog_products mapping
  const { data: catalogProducts, error: cpError } = await db.from("catalog_products")
    .select(`
      price_override, 
      compare_at_price_override, 
      products (
        *, 
        categories(category_name), 
        product_images(image_url, is_primary)
      )
    `)
    .eq("catalog_id", catalog.catalog_id)
    .eq("is_active", true)
    .eq("products.status", "ACTIVE");
    
  if (cpError) {
    console.error("Failed to fetch catalog products:", cpError);
  }

  // Format products to match the expected format for the template
  // Overriding prices if they exist
  const formattedProducts = (catalogProducts || [])
    .filter((cp: any) => cp.products) // Ensure product exists
    .map((cp: any) => {
      const p = cp.products;
      if (cp.price_override !== null) p.base_price = cp.price_override;
      if (cp.compare_at_price_override !== null) p.compare_at_price = cp.compare_at_price_override;
      return p;
    });

  // Sort them by creation date or some logic (descending by default)
  formattedProducts.sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());

  // Render the storefront template using these specific products
  return (
    <>
      <StarterMinimalistHome initialCustomData={{ formData: customData }} initialProducts={formattedProducts} />
    </>
  );
}
