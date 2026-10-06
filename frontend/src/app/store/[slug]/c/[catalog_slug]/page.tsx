import { notFound, redirect } from "next/navigation";
import { getCatalog, getStore } from "@/lib/store";
import { renderHomeTemplate } from "../../home-template";
import { mapDatabaseProducts } from "@/lib/utils/product-mapper";

export default async function CatalogHomePage({
  params,
}: {
  params: Promise<{ slug: string; catalog_slug: string }>;
}) {
  const { slug, catalog_slug } = await params;

  const store = await getStore(slug);
  if (!store) return notFound();

  // The backend enforces catalog access: special (B2B) catalogs require a logged-in, authorised customer.
  const result = await getCatalog(slug, catalog_slug);

  if (!result.ok) {
    if (result.status === 401) {
      const back = `/store/${slug}/c/${catalog_slug}`;
      redirect(`/store/${slug}/auth/login?next=${encodeURIComponent(back)}`);
    }

    // Signed in, but not on this catalog's list: show the public store instead of a dead end.
    if (result.status === 403) redirect(`/store/${slug}`);

    return notFound();
  }

  return renderHomeTemplate(store.templateId, {
    initialCustomData: store.customization,
    initialProducts: mapDatabaseProducts(result.data.products),
  });
}
