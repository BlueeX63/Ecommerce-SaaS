import { notFound } from "next/navigation";
import { getAdminClient } from "@/lib/supabase/admin";
import { fetchWithCache } from "@/lib/redis";
import MinimalistWishlistPage from "@/app/templates/minimalist/wishlist/page";
import EssenceWishlistPage from "@/app/templates/essence/wishlist/page";
import OriginWishlistPage from "@/app/templates/origin/wishlist/page";
import NexusProWishlistPage from "@/app/templates/nexus-pro/wishlist/page";
import VelocityWishlistPage from "@/app/templates/velocity/wishlist/page";
import QuantumWishlistPage from "@/app/templates/quantum/wishlist/page";

export default async function StoreWishlistPage(props: any) {
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

  let PageComponent = MinimalistWishlistPage;
  if (templateId === "starter-essence") PageComponent = EssenceWishlistPage;
  else if (templateId === "starter-origin") PageComponent = OriginWishlistPage;
  else if (templateId === "growth-nexus-pro") PageComponent = NexusProWishlistPage;
  else if (templateId === "growth-velocity") PageComponent = VelocityWishlistPage;
  else if (templateId === "growth-quantum") PageComponent = QuantumWishlistPage;

  return <PageComponent {...props} />;
}
