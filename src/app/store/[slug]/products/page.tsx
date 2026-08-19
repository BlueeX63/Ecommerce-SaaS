import { notFound } from "next/navigation";
import { getAdminClient } from "@/lib/supabase/admin";
import { fetchWithCache } from "@/lib/redis";
import MinimalistProductsPage from "@/app/templates/minimalist/products/page";
import EssenceProductsPage from "@/app/templates/essence/products/page";
import OriginProductsPage from "@/app/templates/origin/products/page";
import NexusProProductsPage from "@/app/templates/nexus-pro/products/page";
import VelocityProductsPage from "@/app/templates/velocity/products/page";
import QuantumProductsPage from "@/app/templates/quantum/products/page";

export default async function StoreProductsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = getAdminClient();
  const { data: tenant } = await db
    .from("tenant")
    .select("tenant_id")
    .eq("code", slug)
    .single();

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

  const { data: products } = await db
    .from("products")
    .select("*, categories(category_name), product_images(image_url, is_primary)")
    .eq("tenant_id", tenant.tenant_id)
    .eq("status", "ACTIVE")
    .order("created_date", { ascending: false });

  let PageComponent = MinimalistProductsPage;
  if (templateId === "starter-essence") PageComponent = EssenceProductsPage;
  else if (templateId === "starter-origin") PageComponent = OriginProductsPage;
  else if (templateId === "growth-nexus-pro") PageComponent = NexusProProductsPage;
  else if (templateId === "growth-velocity") PageComponent = VelocityProductsPage;
  else if (templateId === "growth-quantum") PageComponent = QuantumProductsPage;

  return <PageComponent initialProducts={products || []} />;
}
