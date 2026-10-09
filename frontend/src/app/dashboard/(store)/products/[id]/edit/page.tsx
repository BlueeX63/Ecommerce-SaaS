"use client";

import { use } from "react";
import { ProductForm } from "@/components/dashboard/ProductForm";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ProductForm productId={id} />;
}
