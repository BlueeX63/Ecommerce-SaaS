import { notFound } from "next/navigation";
import { getStore, getStoreProducts } from "@/lib/store";
import StarterMinimalistHome from "@/app/templates/minimalist/page";
import EssenceHomePage from "@/app/templates/essence/page";
import OriginHomePage from "@/app/templates/origin/page";
import NexusProHomePage from "@/app/templates/nexus-pro/page";
import VelocityHomePage from "@/app/templates/velocity/page";
import QuantumHomePage from "@/app/templates/quantum/page";
import CanvasHomePage from "@/app/templates/canvas/page";
import HorizonHomePage from "@/app/templates/horizon/page";

export default async function StoreHomePage({
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

  let PageComponent = StarterMinimalistHome;
  if (templateId === "starter-essence") PageComponent = EssenceHomePage;
  else if (templateId === "starter-origin") PageComponent = OriginHomePage;
  else if (templateId === "growth-nexus-pro") PageComponent = NexusProHomePage;
  else if (templateId === "growth-velocity") PageComponent = VelocityHomePage;
  else if (templateId === "growth-quantum") PageComponent = QuantumHomePage;
  else if (templateId === "starter-canvas") PageComponent = CanvasHomePage;
  else if (templateId === "growth-horizon") PageComponent = HorizonHomePage;

  return <PageComponent initialCustomData={customData} initialProducts={mappedProducts} />;
}
