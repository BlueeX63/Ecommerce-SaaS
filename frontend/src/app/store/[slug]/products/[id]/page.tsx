import { notFound } from "next/navigation";
import { getStore, getStoreProduct, getStoreProducts } from "@/lib/store";
import MinimalistProductDetailsPage from "@/app/templates/minimalist/products/[id]/page";
import EssenceProductDetailsPage from "@/app/templates/essence/products/[id]/page";
import OriginProductDetailsPage from "@/app/templates/origin/products/[id]/page";
import NexusProProductDetailsPage from "@/app/templates/nexus-pro/products/[id]/page";
import VelocityProductDetailsPage from "@/app/templates/velocity/products/[id]/page";
import QuantumProductDetailsPage from "@/app/templates/quantum/products/[id]/page";
import CanvasProductDetailsPage from "@/app/templates/canvas/products/[id]/page";
import HorizonProductDetailsPage from "@/app/templates/horizon/products/[id]/page";

export default async function StoreProductDetailsPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const store = await getStore(slug);
  if (!store) return notFound();

  const templateId = store.templateId;

  const product = await getStoreProduct(slug, id);
  if (!product) return notFound();

  const { mapDatabaseProductToTemplate, mapLiveProducts } = await import("@/lib/utils/product-mapper");
  const mappedProduct = mapDatabaseProductToTemplate(product);
  // "You may also like" must come from this store, never from a template's demo catalog.
  const relatedPool = mapLiveProducts(await getStoreProducts(slug));

  let PageComponent: any = MinimalistProductDetailsPage;
  if (templateId === "starter-essence") PageComponent = EssenceProductDetailsPage;
  else if (templateId === "starter-origin") PageComponent = OriginProductDetailsPage;
  else if (templateId === "growth-nexus-pro") PageComponent = NexusProProductDetailsPage;
  else if (templateId === "growth-velocity") PageComponent = VelocityProductDetailsPage;
  else if (templateId === "growth-quantum") PageComponent = QuantumProductDetailsPage;
  else if (templateId === "starter-canvas") PageComponent = CanvasProductDetailsPage;
  else if (templateId === "growth-horizon") PageComponent = HorizonProductDetailsPage;

  const FinalPageComponent = PageComponent as any;
  return <FinalPageComponent params={params} initialProduct={mappedProduct} relatedPool={relatedPool} />;
}
