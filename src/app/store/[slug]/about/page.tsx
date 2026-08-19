import { notFound } from "next/navigation";
import { getAdminClient } from "@/lib/supabase/admin";
import { fetchWithCache } from "@/lib/redis";
import MinimalistAboutPage from "@/app/templates/minimalist/about/page";
import EssenceAboutPage from "@/app/templates/essence/about/page";
import OriginAboutPage from "@/app/templates/origin/about/page";
import NexusProAboutPage from "@/app/templates/nexus-pro/about/page";
import VelocityAboutPage from "@/app/templates/velocity/about/page";
import QuantumAboutPage from "@/app/templates/quantum/about/page";

export default async function StoreAboutPage(props: any) {
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

  let PageComponent = MinimalistAboutPage;
  if (templateId === "starter-essence") PageComponent = EssenceAboutPage;
  else if (templateId === "starter-origin") PageComponent = OriginAboutPage;
  else if (templateId === "growth-nexus-pro") PageComponent = NexusProAboutPage;
  else if (templateId === "growth-velocity") PageComponent = VelocityAboutPage;
  else if (templateId === "growth-quantum") PageComponent = QuantumAboutPage;

  return <PageComponent {...props} />;
}
