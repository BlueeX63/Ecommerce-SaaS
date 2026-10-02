import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import MinimalistCartPage from "@/app/templates/minimalist/cart/page";
import EssenceCartPage from "@/app/templates/essence/cart/page";
import OriginCartPage from "@/app/templates/origin/cart/page";
import NexusProCartPage from "@/app/templates/nexus-pro/cart/page";
import CanvasCartPage from "@/app/templates/canvas/cart/page";
import HorizonCartPage from "@/app/templates/horizon/cart/page";

export default async function StoreCartPage(props: any) {
  const { slug } = await (props.params || {});
  if (!slug) return notFound();
  
  const store = await getStore(slug);
  if (!store) return notFound();

  const customData = store.customization;
  const templateId = store.templateId;

  let PageComponent = MinimalistCartPage;
  if (templateId === "starter-essence") PageComponent = EssenceCartPage;
  else if (templateId === "starter-origin") PageComponent = OriginCartPage;
  else if (templateId === "growth-nexus-pro") PageComponent = NexusProCartPage;
  else if (templateId === "starter-canvas") PageComponent = CanvasCartPage;
  else if (templateId === "growth-horizon") PageComponent = HorizonCartPage;

  return <PageComponent {...props} />;
}
