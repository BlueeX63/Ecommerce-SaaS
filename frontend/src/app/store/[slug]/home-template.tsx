import StarterMinimalistHome from "@/app/templates/minimalist/page";
import EssenceHomePage from "@/app/templates/essence/page";
import OriginHomePage from "@/app/templates/origin/page";
import NexusProHomePage from "@/app/templates/nexus-pro/page";
import VelocityHomePage from "@/app/templates/velocity/page";
import QuantumHomePage from "@/app/templates/quantum/page";
import CanvasHomePage from "@/app/templates/canvas/page";
import HorizonHomePage from "@/app/templates/horizon/page";

import type { mapDatabaseProducts } from "@/lib/utils/product-mapper";

interface HomeTemplateProps {
  initialCustomData: unknown;
  initialProducts: ReturnType<typeof mapDatabaseProducts>;
}

/**
 * Renders a store's home page in its own template. Must match the template the store layout wraps every page
 * in (see store/[slug]/layout.tsx), otherwise the page reads a cart context that does not exist.
 */
export function renderHomeTemplate(templateId: string, props: HomeTemplateProps) {
  switch (templateId) {
    case "starter-essence":
      return <EssenceHomePage {...props} />;
    case "starter-origin":
      return <OriginHomePage {...props} />;
    case "growth-nexus-pro":
      return <NexusProHomePage {...props} />;
    case "growth-velocity":
      return <VelocityHomePage {...props} />;
    case "growth-quantum":
      return <QuantumHomePage {...props} />;
    case "starter-canvas":
      return <CanvasHomePage {...props} />;
    case "growth-horizon":
      return <HorizonHomePage {...props} />;
    default:
      return <StarterMinimalistHome {...props} />;
  }
}
