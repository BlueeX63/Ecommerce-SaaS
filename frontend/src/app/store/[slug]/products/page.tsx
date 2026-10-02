import { notFound } from "next/navigation";
import { getStore, getStoreProducts } from "@/lib/store";
import MinimalistProductsPage from "@/app/templates/minimalist/products/page";
import EssenceProductsPage from "@/app/templates/essence/products/page";
import OriginProductsPage from "@/app/templates/origin/products/page";
import NexusProProductsPage from "@/app/templates/nexus-pro/products/page";
import VelocityProductsPage from "@/app/templates/velocity/products/page";
import QuantumProductsPage from "@/app/templates/quantum/products/page";
import CanvasProductsPage from "@/app/templates/canvas/products/page";
import HorizonProductsPage from "@/app/templates/horizon/products/page";

export default async function StoreProductsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await getStore(slug);
  if (!store) return notFound();

  const customData = store.customization;
  const templateId = store.templateId;

  const { mapDatabaseProducts } = await import("@/lib/utils/product-mapper");
  const mappedProducts = mapDatabaseProducts(await getStoreProducts(slug));

  let PageComponent = MinimalistProductsPage;
  if (templateId === "starter-essence") PageComponent = EssenceProductsPage;
  else if (templateId === "starter-origin") PageComponent = OriginProductsPage;
  else if (templateId === "growth-nexus-pro") PageComponent = NexusProProductsPage;
  else if (templateId === "growth-velocity") PageComponent = VelocityProductsPage;
  else if (templateId === "growth-quantum") PageComponent = QuantumProductsPage;
  else if (templateId === "starter-canvas") PageComponent = CanvasProductsPage;
  else if (templateId === "growth-horizon") PageComponent = HorizonProductsPage;

  return <PageComponent initialProducts={mappedProducts} initialCustomData={customData} />;
}
