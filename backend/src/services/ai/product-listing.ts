import { z } from 'zod';
import { ApiError } from '../../lib/http.js';
import { aiJson } from './ai-service.js';

/** The fields the merchant form can be filled with. Re-validated here: nothing reaches the form unchecked. */
const listingSchema = z.object({
  description: z.string().trim().min(20).max(1500),
  sku: z
    .string()
    .trim()
    .max(40)
    .regex(/^[A-Za-z0-9-]*$/, 'SKU may only contain letters, digits and hyphens'),
  /** One of the category names the merchant already has, or null when none fits. */
  category: z.string().trim().max(100).nullable(),
});

export type ProductListing = z.infer<typeof listingSchema>;

export async function generateProductListing(input: {
  productName: string;
  currentDescription?: string;
  categoryNames: string[];
}): Promise<ProductListing> {
  const reply = await aiJson<unknown>('/v1/listing', {
    product_name: input.productName,
    current_description: input.currentDescription || null,
    category_names: input.categoryNames.map((c) => c.slice(0, 100)),
  });

  const parsed = listingSchema.safeParse(reply);
  if (!parsed.success) {
    console.error('[ai:product-listing] AI service returned an invalid listing');
    throw new ApiError(502, 'The AI service is temporarily unavailable. Please try again.');
  }
  return parsed.data;
}
