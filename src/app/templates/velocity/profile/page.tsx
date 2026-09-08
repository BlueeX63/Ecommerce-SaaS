"use client";
import { useVelocity } from "../VelocityContext";
import PremiumProfile from "@/components/storefront/PremiumProfile";

export default function ProfilePage() {
  return <PremiumProfile basePath="/templates/velocity" theme="dark" />;
}
