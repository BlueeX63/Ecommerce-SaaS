import { notFound } from "next/navigation";
import { getStore, getStoreProducts } from "@/lib/store";
import { renderHomeTemplate } from "./home-template";

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

  return renderHomeTemplate(templateId, { initialCustomData: customData, initialProducts: mappedProducts });
}
