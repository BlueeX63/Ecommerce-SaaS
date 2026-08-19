import { notFound } from "next/navigation";
import { getAdminClient } from "@/lib/supabase/admin";
import { fetchWithCache } from "@/lib/redis";
import MinimalistCartPage from "@/app/templates/minimalist/cart/page";
import EssenceCartPage from "@/app/templates/essence/cart/page";
import OriginCartPage from "@/app/templates/origin/cart/page";
import NexusProCartPage from "@/app/templates/nexus-pro/cart/page";
import VelocityCartPage from "@/app/templates/velocity/cart/page";
import QuantumCartPage from "@/app/templates/quantum/cart/page";

export default async function StoreCartPage(props: any) {
  const { slug } = await (props.params || {});
  if (!slug) return notFound();
  
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

  let PageComponent = MinimalistCartPage;
  if (templateId === "starter-essence") PageComponent = EssenceCartPage;
  else if (templateId === "starter-origin") PageComponent = OriginCartPage;
  else if (templateId === "growth-nexus-pro") PageComponent = NexusProCartPage;
  else if (templateId === "growth-velocity") PageComponent = VelocityCartPage;
  else if (templateId === "growth-quantum") PageComponent = QuantumCartPage;

  return <PageComponent {...props} />;
}
