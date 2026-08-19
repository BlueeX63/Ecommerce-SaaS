import { notFound } from "next/navigation";
import { getAdminClient } from "@/lib/supabase/admin";
import { fetchWithCache } from "@/lib/redis";
import MinimalistProfilePage from "@/app/templates/minimalist/profile/page";
import EssenceProfilePage from "@/app/templates/essence/profile/page";
import OriginProfilePage from "@/app/templates/origin/profile/page";
import NexusProProfilePage from "@/app/templates/nexus-pro/profile/page";
import VelocityProfilePage from "@/app/templates/velocity/profile/page";
import QuantumProfilePage from "@/app/templates/quantum/profile/page";

export default async function StoreProfilePage(props: any) {
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

  let PageComponent = MinimalistProfilePage;
  if (templateId === "starter-essence") PageComponent = EssenceProfilePage;
  else if (templateId === "starter-origin") PageComponent = OriginProfilePage;
  else if (templateId === "growth-nexus-pro") PageComponent = NexusProProfilePage;
  else if (templateId === "growth-velocity") PageComponent = VelocityProfilePage;
  else if (templateId === "growth-quantum") PageComponent = QuantumProfilePage;

  return <PageComponent {...props} />;
}
