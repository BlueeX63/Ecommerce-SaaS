import { notFound } from "next/navigation";
import { getAdminClient } from "@/lib/supabase/admin";
import { fetchWithCache } from "@/lib/redis";
import MinimalistCheckoutPage from "@/app/templates/minimalist/checkout/page";
import EssenceCheckoutPage from "@/app/templates/essence/checkout/page";
import OriginCheckoutPage from "@/app/templates/origin/checkout/page";
import NexusProCheckoutPage from "@/app/templates/nexus-pro/checkout/page";
import VelocityCheckoutPage from "@/app/templates/velocity/checkout/page";
import QuantumCheckoutPage from "@/app/templates/quantum/checkout/page";

export default async function StoreCheckoutPage(props: any) {
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

  let PageComponent = MinimalistCheckoutPage;
  if (templateId === "starter-essence") PageComponent = EssenceCheckoutPage;
  else if (templateId === "starter-origin") PageComponent = OriginCheckoutPage;
  else if (templateId === "growth-nexus-pro") PageComponent = NexusProCheckoutPage;
  else if (templateId === "growth-velocity") PageComponent = VelocityCheckoutPage;
  else if (templateId === "growth-quantum") PageComponent = QuantumCheckoutPage;

  return <PageComponent {...props} />;
}
