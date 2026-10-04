import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import MinimalistCheckoutPage from "@/app/templates/minimalist/checkout/page";
import EssenceCheckoutPage from "@/app/templates/essence/checkout/page";
import OriginCheckoutPage from "@/app/templates/origin/checkout/page";
import NexusProCheckoutPage from "@/app/templates/nexus-pro/checkout/page";
import VelocityCheckoutPage from "@/app/templates/velocity/checkout/page";
import QuantumCheckoutPage from "@/app/templates/quantum/checkout/page";
import CanvasCheckoutPage from "@/app/templates/canvas/checkout/page";
import HorizonCheckoutPage from "@/app/templates/horizon/checkout/page";

export default async function StoreCheckoutPage(props: any) {
  const { slug } = await (props.params || {});
  if (!slug) return notFound();
  
  const store = await getStore(slug);
  if (!store) return notFound();

  const customData = store.customization;
  const templateId = store.templateId;

  let PageComponent = MinimalistCheckoutPage;
  if (templateId === "starter-essence") PageComponent = EssenceCheckoutPage;
  else if (templateId === "starter-origin") PageComponent = OriginCheckoutPage;
  else if (templateId === "growth-nexus-pro") PageComponent = NexusProCheckoutPage;
  else if (templateId === "growth-velocity") PageComponent = VelocityCheckoutPage;
  else if (templateId === "growth-quantum") PageComponent = QuantumCheckoutPage;
  else if (templateId === "starter-canvas") PageComponent = CanvasCheckoutPage;
  else if (templateId === "growth-horizon") PageComponent = HorizonCheckoutPage;

  return (
    <PageComponent
      {...props}
      initialOnlinePaymentsEnabled={store.onlinePaymentsEnabled}
      initialPaymentMethods={store.paymentMethods}
      initialSlug={slug}
    />
  );
}
