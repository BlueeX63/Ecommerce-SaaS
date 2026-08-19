import { notFound } from "next/navigation";
import { getAdminClient } from "@/lib/supabase/admin";
import { fetchWithCache } from "@/lib/redis";
import MinimalistProductDetailsPage from "@/app/templates/minimalist/products/[id]/page";
import EssenceProductDetailsPage from "@/app/templates/essence/products/[id]/page";
import OriginProductDetailsPage from "@/app/templates/origin/products/[id]/page";
import NexusProProductDetailsPage from "@/app/templates/nexus-pro/products/[id]/page";
import VelocityProductDetailsPage from "@/app/templates/velocity/products/[id]/page";
import QuantumProductDetailsPage from "@/app/templates/quantum/products/[id]/page";

export default async function StoreProductDetailsPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
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

  const { data: product } = await db
    .from("products")
    .select("*, categories(category_name), product_images(image_url, is_primary)")
    .eq("tenant_id", tenant.tenant_id)
    .eq("product_id", id)
    .single();

  if (!product) return notFound();

  let PageComponent = MinimalistProductDetailsPage;
  if (templateId === "starter-essence") PageComponent = EssenceProductDetailsPage;
  else if (templateId === "starter-origin") PageComponent = OriginProductDetailsPage;
  else if (templateId === "growth-nexus-pro") PageComponent = NexusProProductDetailsPage;
  else if (templateId === "growth-velocity") PageComponent = VelocityProductDetailsPage;
  else if (templateId === "growth-quantum") PageComponent = QuantumProductDetailsPage;

  return <PageComponent params={params} initialProduct={product} />;
}
