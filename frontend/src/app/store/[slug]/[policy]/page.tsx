import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import { PolicyPage } from "@/components/storefront/PolicyPage";
import { POLICY_PAGES, type PolicySlug } from "@/lib/storefront/copy";

export default async function StorePolicyPage({ params }: { params: Promise<{ slug: string; policy: string }> }) {
  const { slug, policy } = await params;
  if (!(policy in POLICY_PAGES)) return notFound();

  const store = await getStore(slug);
  if (!store) return notFound();

  return <PolicyPage slug={policy as PolicySlug} initialCustomData={store.customization} />;
}
