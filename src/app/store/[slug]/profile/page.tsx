"use client";

import { useParams } from "next/navigation";
import PremiumProfile from "@/components/storefront/PremiumProfile";

export default function AccountPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PremiumProfile basePath={`/store/${slug}`} theme="light" />
    </div>
  );
}
