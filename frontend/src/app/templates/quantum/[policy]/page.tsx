"use client";

import { notFound, useParams } from "next/navigation";
import { PolicyPage } from "@/components/storefront/PolicyPage";
import { POLICY_PAGES, type PolicySlug } from "@/lib/storefront/copy";

export default function PolicyRoute() {
  const { policy } = useParams<{ policy: string }>();
  if (!(policy in POLICY_PAGES)) notFound();
  return <PolicyPage slug={policy as PolicySlug} />;
}
