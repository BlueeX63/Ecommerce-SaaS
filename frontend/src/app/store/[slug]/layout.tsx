import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import { resolveStoreBasePath } from "@/lib/store-base-path";
import { StoreAssistant } from "@/components/storefront/StoreAssistant";
import { PreviewBridge } from "@/components/storefront/PreviewBridge";

import { StarterPreviewLayout as MinimalistLayout } from "@/app/templates/minimalist/layout";
import { EssencePreviewLayout as EssenceLayout } from "@/app/templates/essence/layout";
import { OriginPreviewLayout as OriginLayout } from "@/app/templates/origin/layout";
import { NexusProLayout as NexusProLayout } from "@/app/templates/nexus-pro/layout";
import { VelocityLayout as VelocityLayout } from "@/app/templates/velocity/layout";
import { QuantumLayout as QuantumLayout } from "@/app/templates/quantum/layout";
import { CanvasLayout } from "@/app/templates/canvas/layout";
import { HorizonLayout } from "@/app/templates/horizon/layout";








export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await getStore(slug);
  if (!store) return notFound();

  const basePath = await resolveStoreBasePath(slug);

  const customData = store.customization;
  const templateId = store.templateId;

  let LayoutComponent = MinimalistLayout;
  if (templateId === "starter-essence") LayoutComponent = EssenceLayout;
  else if (templateId === "starter-origin") LayoutComponent = OriginLayout;
  else if (templateId === "growth-nexus-pro") LayoutComponent = NexusProLayout;
  else if (templateId === "growth-velocity") LayoutComponent = VelocityLayout;
  else if (templateId === "growth-quantum") LayoutComponent = QuantumLayout;
  else if (templateId === "starter-canvas") LayoutComponent = CanvasLayout;
  else if (templateId === "growth-horizon") LayoutComponent = HorizonLayout;

  return (
    <>
      <LayoutComponent initialCustomData={customData} basePath={basePath}>
        {children}
      </LayoutComponent>
      <PreviewBridge />
      {store.aiAssistantEnabled && <StoreAssistant slug={slug} storeName={store.name} />}
    </>
  );
}
