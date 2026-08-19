import { notFound } from "next/navigation";
import { getAdminClient } from "@/lib/supabase/admin";
import { fetchWithCache } from "@/lib/redis";
import MinimalistContactPage from "@/app/templates/minimalist/contact/page";
import EssenceContactPage from "@/app/templates/essence/contact/page";
import OriginContactPage from "@/app/templates/origin/contact/page";
import NexusProContactPage from "@/app/templates/nexus-pro/contact/page";
import VelocityContactPage from "@/app/templates/velocity/contact/page";
import QuantumContactPage from "@/app/templates/quantum/contact/page";

export default async function StoreContactPage(props: any) {
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

  let PageComponent = MinimalistContactPage;
  if (templateId === "starter-essence") PageComponent = EssenceContactPage;
  else if (templateId === "starter-origin") PageComponent = OriginContactPage;
  else if (templateId === "growth-nexus-pro") PageComponent = NexusProContactPage;
  else if (templateId === "growth-velocity") PageComponent = VelocityContactPage;
  else if (templateId === "growth-quantum") PageComponent = QuantumContactPage;

  return <PageComponent {...props} />;
}
