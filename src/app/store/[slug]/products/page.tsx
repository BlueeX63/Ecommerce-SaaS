import { notFound } from "next/navigation";
import { getAdminClient } from "@/lib/supabase/admin";
import StarterProductsPage from "@/app/templates/minimalist/products/page";

export default async function StoreProductsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = getAdminClient();
  const { data: tenant, error } = await db
    .from("tenant")
    .select("tenant_id")
    .eq("code", slug)
    .single();

  if (!tenant) return notFound();

  const { data: products } = await db
    .from("products")
    .select("*, categories(category_name), product_images(image_url, is_primary)")
    .eq("tenant_id", tenant.tenant_id)
    .eq("status", "ACTIVE")
    .order("created_date", { ascending: false });

  return <StarterProductsPage initialProducts={products || []} />;
}
