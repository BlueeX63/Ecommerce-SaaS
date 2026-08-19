import { notFound } from "next/navigation";
import { getAdminClient } from "@/lib/supabase/admin";
import { fetchWithCache } from "@/lib/redis";
import StarterMinimalistHome from "@/app/templates/minimalist/page";
import EssenceHomePage from "@/app/templates/essence/page";
import OriginHomePage from "@/app/templates/origin/page";
import NexusProHomePage from "@/app/templates/nexus-pro/page";
import VelocityHomePage from "@/app/templates/velocity/page";
import QuantumHomePage from "@/app/templates/quantum/page";

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
      const { data, error } = await db.from("tenant").select("tenant_id").or(`code.eq.${slug},custom_domain.eq.${slug}`).single();
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
  const templateId = customData.templateId || "starter-minimalist";

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

  let PageComponent = StarterMinimalistHome;
  if (templateId === "starter-essence") PageComponent = EssenceHomePage;
  else if (templateId === "starter-origin") PageComponent = OriginHomePage;
  else if (templateId === "growth-nexus-pro") PageComponent = NexusProHomePage;
  else if (templateId === "growth-velocity") PageComponent = VelocityHomePage;
  else if (templateId === "growth-quantum") PageComponent = QuantumHomePage;
  // Fallback to StarterMinimalistHome for canvas and horizon or unknown

  return <PageComponent initialCustomData={{ formData: customData }} initialProducts={products || []} />;
}
