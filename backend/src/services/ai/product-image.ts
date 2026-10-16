import { aiImage } from './ai-service.js';
import { fetchTenantImage } from '../media.js';

/** Returns a PNG buffer of a studio-quality product photo generated from the product's name and details. */
export function generateStudioProductImage(input: { productName: string; category?: string; description?: string }): Promise<Buffer> {
  return aiImage('/v1/images/generate', {
    product_name: input.productName,
    category: input.category || null,
    description: input.description || null,
  });
}

/**
 * Re-shoots a tenant's existing product image onto a clean studio background. The image is fetched here (with the
 * tenant-ownership and size checks in `fetchTenantImage`) and sent as bytes, so the AI service never fetches a URL.
 */
export async function cleanProductImage(imageUrl: string): Promise<Buffer> {
  const { buffer, type } = await fetchTenantImage(imageUrl);
  return aiImage('/v1/images/clean', { bytes: buffer, type });
}
