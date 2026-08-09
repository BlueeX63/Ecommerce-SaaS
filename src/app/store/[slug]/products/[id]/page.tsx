import { notFound } from "next/navigation";
import { getAdminClient } from "@/lib/supabase/admin";
import ProductDetailsPage from "@/app/templates/minimalist/products/[id]/page";

export default async function StoreProductDetailsPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const db = getAdminClient();
  const { data: tenant } = await db
    .from("tenant")
    .select("tenant_id")
    .eq("code", slug)
    .single();

  if (!tenant) return notFound();

  const { data: product } = await db
    .from("products")
    .select("*, categories(category_name), product_images(image_url, is_primary)")
    .eq("tenant_id", tenant.tenant_id)
    .eq("product_id", id)
    .single();

  if (!product) return notFound();

  return <ProductDetailsPage params={params} initialProduct={product} />;
}
