import { notFound } from "next/navigation";
import { getAdminClient } from "@/lib/supabase/admin";
import { fetchWithCache } from "@/lib/redis";
import MinimalistOrdersPage from "@/app/templates/minimalist/orders/page";
import EssenceOrdersPage from "@/app/templates/essence/orders/page";
import OriginOrdersPage from "@/app/templates/origin/orders/page";
import NexusProOrdersPage from "@/app/templates/nexus-pro/orders/page";
import VelocityOrdersPage from "@/app/templates/velocity/orders/page";
import QuantumOrdersPage from "@/app/templates/quantum/orders/page";

export default async function StoreOrdersPage(props: any) {
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

  let PageComponent = MinimalistOrdersPage;
  if (templateId === "starter-essence") PageComponent = EssenceOrdersPage;
  else if (templateId === "starter-origin") PageComponent = OriginOrdersPage;
  else if (templateId === "growth-nexus-pro") PageComponent = NexusProOrdersPage;
  else if (templateId === "growth-velocity") PageComponent = VelocityOrdersPage;
  else if (templateId === "growth-quantum") PageComponent = QuantumOrdersPage;

  return <PageComponent {...props} />;
}
