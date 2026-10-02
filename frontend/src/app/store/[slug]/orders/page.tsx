import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import { resolveStoreBasePath } from "@/lib/store-base-path";
import MinimalistOrdersPage from "@/app/templates/minimalist/orders/page";
import EssenceOrdersPage from "@/app/templates/essence/orders/page";
import OriginOrdersPage from "@/app/templates/origin/orders/page";
import CanvasOrdersPage from "@/app/templates/canvas/orders/page";
import NexusProOrdersPage from "@/app/templates/nexus-pro/orders/page";
import VelocityOrdersPage from "@/app/templates/velocity/orders/page";
import QuantumOrdersPage from "@/app/templates/quantum/orders/page";
import HorizonOrdersPage from "@/app/templates/horizon/orders/page";

export default async function StoreOrdersPage(props: any) {
  const { slug } = await (props.params || {});
  if (!slug) return notFound();

  const store = await getStore(slug);
  if (!store) return notFound();

  const templateId = store.templateId;
  const basePath = await resolveStoreBasePath(slug);

  let PageComponent = MinimalistOrdersPage;
  if (templateId === "starter-essence") PageComponent = EssenceOrdersPage;
  else if (templateId === "starter-origin") PageComponent = OriginOrdersPage;
  else if (templateId === "starter-canvas") PageComponent = CanvasOrdersPage;
  else if (templateId === "growth-nexus-pro") PageComponent = NexusProOrdersPage;
  else if (templateId === "growth-velocity") PageComponent = VelocityOrdersPage;
  else if (templateId === "growth-quantum") PageComponent = QuantumOrdersPage;
  else if (templateId === "growth-horizon") PageComponent = HorizonOrdersPage;

  return <PageComponent {...props} basePath={basePath} />;
}
