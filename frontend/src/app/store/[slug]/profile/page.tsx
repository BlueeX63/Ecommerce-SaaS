import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import { resolveStoreBasePath } from "@/lib/store-base-path";
import MinimalistProfilePage from "@/app/templates/minimalist/profile/page";
import EssenceProfilePage from "@/app/templates/essence/profile/page";
import OriginProfilePage from "@/app/templates/origin/profile/page";
import NexusProProfilePage from "@/app/templates/nexus-pro/profile/page";
import VelocityProfilePage from "@/app/templates/velocity/profile/page";
import QuantumProfilePage from "@/app/templates/quantum/profile/page";
import CanvasProfilePage from "@/app/templates/canvas/profile/page";

export default async function StoreProfilePage(props: any) {
  const { slug } = await (props.params || {});
  if (!slug) return notFound();
  
  const store = await getStore(slug);
  if (!store) return notFound();

  const templateId = store.templateId;
  const basePath = await resolveStoreBasePath(slug);

  let PageComponent = MinimalistProfilePage;
  if (templateId === "starter-essence") PageComponent = EssenceProfilePage;
  else if (templateId === "starter-origin") PageComponent = OriginProfilePage;
  else if (templateId === "growth-nexus-pro") PageComponent = NexusProProfilePage;
  else if (templateId === "growth-velocity") PageComponent = VelocityProfilePage;
  else if (templateId === "growth-quantum") PageComponent = QuantumProfilePage;
  else if (templateId === "starter-canvas") PageComponent = CanvasProfilePage;

  return <PageComponent {...props} basePath={basePath} />;
}
