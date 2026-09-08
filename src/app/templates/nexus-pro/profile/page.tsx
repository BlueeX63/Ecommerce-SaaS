"use client";
import { useShop } from "../ShopContext";
import PremiumProfile from "@/components/storefront/PremiumProfile";

export default function ProfilePage() {
  return <PremiumProfile basePath="/templates/nexus-pro" theme="dark" />;
}
