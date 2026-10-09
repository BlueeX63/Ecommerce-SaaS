export function mapDatabaseProductToTemplate(product: any) {
  if (!product) return null;
  return {
    id: product.product_id || product.id,
    name: product.product_name || product.name,
    price: product.base_price || product.price || 0,
    image: product.product_images?.[0]?.image_url || product.image || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=2000&auto=format&fit=crop",
    category: product.categories?.category_name || product.category || "Uncategorized",
    description: product.description || "A meticulously crafted good designed for the modern lifestyle.",
    sku: product.sku || "",
    stockStatus: product.stock_status || product.stockStatus || "untracked",
    createdAt: product.created_date || product.createdAt || null,
  };
}

export function mapDatabaseProducts(products: any[]) {
  if (!products || !Array.isArray(products)) return [];
  return products.map(mapDatabaseProductToTemplate);
}

/**
 * Live (database) products in the superset shape the richer templates' cards expect - demo-only fields get
 * neutral defaults so a merchant's real catalog renders in every template.
 */
export function mapLiveProducts(products: any[]) {
  return mapDatabaseProducts(products).map((p: any, i: number) => {
    const raw = products[i];
    const gallery = (raw?.product_images ?? []).map((img: any) => img.image_url).filter(Boolean);
    return {
      ...p,
      gallery: gallery.length ? gallery : [p.image],
      brand: "",
      wearType: "other",
      isNew: false,
      rating: 5,
      reviews: [],
      format: "",
      fileSize: "",
      features: [],
      sizes: [],
    };
  });
}
