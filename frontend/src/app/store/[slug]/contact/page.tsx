import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import MinimalistContactPage from "@/app/templates/minimalist/contact/page";
import EssenceContactPage from "@/app/templates/essence/contact/page";
import OriginContactPage from "@/app/templates/origin/contact/page";
import NexusProContactPage from "@/app/templates/nexus-pro/contact/page";
import VelocityContactPage from "@/app/templates/velocity/contact/page";
import QuantumContactPage from "@/app/templates/quantum/contact/page";
import CanvasContactPage from "@/app/templates/canvas/contact/page";
import HorizonContactPage from "@/app/templates/horizon/contact/page";

export default async function StoreContactPage(props: any) {
  const { slug } = await (props.params || {});
  if (!slug) return notFound();
  
  const store = await getStore(slug);
  if (!store) return notFound();

  const customData = store.customization;
  const templateId = store.templateId;

  let PageComponent = MinimalistContactPage;
  if (templateId === "starter-essence") PageComponent = EssenceContactPage;
  else if (templateId === "starter-origin") PageComponent = OriginContactPage;
  else if (templateId === "growth-nexus-pro") PageComponent = NexusProContactPage;
  else if (templateId === "growth-velocity") PageComponent = VelocityContactPage;
  else if (templateId === "growth-quantum") PageComponent = QuantumContactPage;
  else if (templateId === "starter-canvas") PageComponent = CanvasContactPage;
  else if (templateId === "growth-horizon") PageComponent = HorizonContactPage;

  return <PageComponent {...props} initialCustomData={customData} />;
}
