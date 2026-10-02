import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import MinimalistWishlistPage from "@/app/templates/minimalist/wishlist/page";
import EssenceWishlistPage from "@/app/templates/essence/wishlist/page";
import OriginWishlistPage from "@/app/templates/origin/wishlist/page";
import NexusProWishlistPage from "@/app/templates/nexus-pro/wishlist/page";
import VelocityWishlistPage from "@/app/templates/velocity/wishlist/page";
import QuantumWishlistPage from "@/app/templates/quantum/wishlist/page";
import CanvasWishlistPage from "@/app/templates/canvas/wishlist/page";
import HorizonWishlistPage from "@/app/templates/horizon/wishlist/page";

export default async function StoreWishlistPage(props: any) {
  const { slug } = await (props.params || {});
  if (!slug) return notFound();
  
  const store = await getStore(slug);
  if (!store) return notFound();

  const customData = store.customization;
  const templateId = store.templateId;

  let PageComponent = MinimalistWishlistPage;
  if (templateId === "starter-essence") PageComponent = EssenceWishlistPage;
  else if (templateId === "starter-origin") PageComponent = OriginWishlistPage;
  else if (templateId === "growth-nexus-pro") PageComponent = NexusProWishlistPage;
  else if (templateId === "growth-velocity") PageComponent = VelocityWishlistPage;
  else if (templateId === "growth-quantum") PageComponent = QuantumWishlistPage;
  else if (templateId === "starter-canvas") PageComponent = CanvasWishlistPage;
  else if (templateId === "growth-horizon") PageComponent = HorizonWishlistPage;

  return <PageComponent {...props} />;
}
