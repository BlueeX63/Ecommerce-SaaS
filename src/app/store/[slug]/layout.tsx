import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getAdminClient } from "@/lib/supabase/admin";
import { fetchWithCache } from "@/lib/redis";

import { StarterPreviewLayout as MinimalistLayout } from "@/app/templates/minimalist/layout";
import { EssencePreviewLayout as EssenceLayout } from "@/app/templates/essence/layout";
import { OriginPreviewLayout as OriginLayout } from "@/app/templates/origin/layout";
import { NexusProLayout as NexusProLayout } from "@/app/templates/nexus-pro/layout";
import { VelocityLayout as VelocityLayout } from "@/app/templates/velocity/layout";
import { QuantumLayout as QuantumLayout } from "@/app/templates/quantum/layout";








export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = getAdminClient();
  const tenant = await fetchWithCache(
    `tenant:${slug}`,
    async () => {
      const { data } = await db.from("tenant").select("tenant_id").or(`code.eq.${slug},custom_domain.eq.${slug}`).single();
      return data;
    },
    3600 // 1 hour cache
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

  
  const headersList = await headers();
  const hostname = headersList.get('host') || '';
  const isLocalhost = hostname.includes('localhost');
  const baseDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || (isLocalhost ? 'localhost:3000' : 'your-saas.com');
  let currentHost = '';
  if (hostname !== baseDomain && hostname !== `www.${baseDomain}`) {
    currentHost = hostname.endsWith(`.${baseDomain}`) 
      ? hostname.replace(`.${baseDomain}`, '') 
      : hostname;
  }
  const isSubdomain = !!currentHost;
  const basePath = isSubdomain ? '' : `/store/${slug}`;

  const customData = settings ? JSON.parse(settings.setting_value) : {};
  const templateId = customData.templateId || "starter-minimalist";

  let LayoutComponent = MinimalistLayout;
  if (templateId === "starter-essence") LayoutComponent = EssenceLayout;
  else if (templateId === "starter-origin") LayoutComponent = OriginLayout;
  else if (templateId === "growth-nexus-pro") LayoutComponent = NexusProLayout;
  else if (templateId === "growth-velocity") LayoutComponent = VelocityLayout;
  else if (templateId === "growth-quantum") LayoutComponent = QuantumLayout;
  // Fallback to MinimalistLayout for canvas and horizon or unknown

  return (
    // @ts-ignore
    <LayoutComponent initialCustomData={{ formData: customData }} basePath={basePath}>
      {children}
    </LayoutComponent>
  );
}
