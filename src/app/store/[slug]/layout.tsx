import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getAdminClient } from "@/lib/supabase/admin";
import { fetchWithCache } from "@/lib/redis";
import MinimalistLayout from "@/app/templates/minimalist/layout";

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
      const { data } = await db.from("tenant").select("tenant_id").eq("code", slug).single();
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
  let currentHost = hostname.replace(`.${baseDomain}`, '');
  if (currentHost === hostname || currentHost === baseDomain || currentHost === 'www') {
    currentHost = '';
  }
  const isSubdomain = !!currentHost;
  const basePath = isSubdomain ? '' : `/store/${slug}`;

  const customData = settings ? JSON.parse(settings.setting_value) : {};

  return (
    <MinimalistLayout initialCustomData={{ formData: customData }} basePath={basePath}>
      {children}
    </MinimalistLayout>
  );
}
