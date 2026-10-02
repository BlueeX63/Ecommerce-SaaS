import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import MinimalistAboutPage from "@/app/templates/minimalist/about/page";
import EssenceAboutPage from "@/app/templates/essence/about/page";
import OriginAboutPage from "@/app/templates/origin/about/page";
import NexusProAboutPage from "@/app/templates/nexus-pro/about/page";
import VelocityAboutPage from "@/app/templates/velocity/about/page";
import QuantumAboutPage from "@/app/templates/quantum/about/page";
import CanvasAboutPage from "@/app/templates/canvas/about/page";
import HorizonAboutPage from "@/app/templates/horizon/about/page";

export default async function StoreAboutPage(props: any) {
  const { slug } = await (props.params || {});
  if (!slug) return notFound();
  
  const store = await getStore(slug);
  if (!store) return notFound();

  const customData = store.customization;
  const templateId = store.templateId;

  let PageComponent = MinimalistAboutPage;
  if (templateId === "starter-essence") PageComponent = EssenceAboutPage;
  else if (templateId === "starter-origin") PageComponent = OriginAboutPage;
  else if (templateId === "growth-nexus-pro") PageComponent = NexusProAboutPage;
  else if (templateId === "growth-velocity") PageComponent = VelocityAboutPage;
  else if (templateId === "growth-quantum") PageComponent = QuantumAboutPage;
  else if (templateId === "starter-canvas") PageComponent = CanvasAboutPage;
  else if (templateId === "growth-horizon") PageComponent = HorizonAboutPage;

  return <PageComponent {...props} initialCustomData={customData} />;
}
