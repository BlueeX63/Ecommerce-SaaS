export function mapDatabaseProductToTemplate(product: any) {
  if (!product) return null;
  return {
    id: product.product_id || product.id,
    name: product.product_name || product.name,
    price: product.base_price || product.price || 0,
    image: product.product_images?.[0]?.image_url || product.image || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=2000&auto=format&fit=crop",
    category: product.categories?.category_name || product.category || "Uncategorized",
    description: product.description || "A meticulously crafted good designed for the modern lifestyle.",
  };
}

export function mapDatabaseProducts(products: any[]) {
  if (!products || !Array.isArray(products)) return [];
  return products.map(mapDatabaseProductToTemplate);
}
