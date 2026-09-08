"use client";
import { useCart } from "../CartContext";
import PremiumProfile from "@/components/storefront/PremiumProfile";

export default function ProfilePage() {
  return <PremiumProfile basePath="/templates/essence" theme="light" />;
}
