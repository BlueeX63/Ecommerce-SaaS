import { notFound, redirect } from "next/navigation";
import { getCatalog, getStore } from "@/lib/store";
import StarterMinimalistHome from "@/app/templates/minimalist/page";

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

    if (result.status === 403) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 font-body text-center">
          <div className="max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h1 className="text-2xl font-heading mb-4 text-red-600">Access Denied</h1>
            <p className="text-gray-600 mb-6">You do not have permission to view this catalog. Please contact the store owner if you believe this is a mistake.</p>
            <a href={`/store/${slug}`} className="text-sm font-medium text-black underline">Return to Main Store</a>
          </div>
        </div>
      );
    }

    return notFound();
  }

  return (
    <StarterMinimalistHome
      initialCustomData={store.customization}
      initialProducts={result.data.products}
    />
  );
}
