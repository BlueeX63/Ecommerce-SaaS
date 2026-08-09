import { notFound } from "next/navigation";
import { getAdminClient } from "@/lib/supabase/admin";
import { fetchWithCache } from "@/lib/redis";
import StarterMinimalistHome from "@/app/templates/minimalist/page";

export default async function StoreHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = getAdminClient();
  const tenant = await fetchWithCache(
    `tenant:${slug}`,
    async () => {
      const { data, error } = await db.from("tenant").select("tenant_id").eq("code", slug).single();
      console.log("Looking up tenant:", slug, "Result:", data, "Error:", error);
      return data;
    },
    3600
  );

  if (!tenant) return notFound();

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

  const products = await fetchWithCache(
    `tenant_products:${tenant.tenant_id}`,
    async () => {
      const { data } = await db.from("products")
        .select("*, categories(category_name), product_images(image_url, is_primary)")
        .eq("tenant_id", tenant.tenant_id)
        .eq("status", "ACTIVE")
        .order("created_date", { ascending: false });
      return data;
    },
    300 // 5 min cache for products
  );

  return <StarterMinimalistHome initialCustomData={{ formData: customData }} initialProducts={products || []} />;
}
