import { toFile } from 'openai';
import { env } from '../../config/env.js';
import { providerFailure, openaiClient } from './clients.js';
import { fetchTenantImage } from '../media.js';

const STUDIO_BACKGROUND = 'a pure white seamless studio background with a soft, realistic contact shadow';

const CLEAN_PROMPT = [
  'Turn this into a clean, high-quality e-commerce product photograph.',
  `Place the product on ${STUDIO_BACKGROUND}.`,
  'Remove the original background and any clutter, hands, stands or props.',
  'Correct the lighting and exposure, sharpen the details and keep the image crisp.',
  "Keep the product's exact shape, colours, proportions, text, labels and logos unchanged. Do not add, invent or alter any part of the product.",
  'Do not add any watermark, border or extra text.',
].join(' ');

const IMAGE_SIZE = '1024x1024' as const;

/** Returns a PNG buffer of a studio-quality product photo generated from the product's name and details. */
export async function generateStudioProductImage(input: { productName: string; category?: string; description?: string }): Promise<Buffer> {
  const details = [input.productName, input.category ? `(${input.category})` : '', input.description ? `- ${input.description.slice(0, 300)}` : '']
    .filter(Boolean)
    .join(' ');
  const prompt = [
    `Professional e-commerce studio photograph of: ${details}.`,
    'Single product, centred, fully in frame, sharp focus, soft even studio lighting, high detail.',
    `Background: ${STUDIO_BACKGROUND}.`,
    'No people, no hands, no text, no logos, no watermark.',
  ].join(' ');

  try {
    const response = await openaiClient().images.generate({
      model: env.AI_IMAGE_MODEL,
      prompt,
      size: IMAGE_SIZE,
      quality: 'high',
      output_format: 'png',
      n: 1,
    });
    const b64 = response.data?.[0]?.b64_json;
    if (!b64) throw new Error('Image model returned no image');
    return Buffer.from(b64, 'base64');
  } catch (error) {
    throw providerFailure('product-image-generate', error);
  }
}

/** Re-shoots a tenant's existing product image onto a clean studio background. */
export async function cleanProductImage(imageUrl: string): Promise<Buffer> {
  const { buffer, type } = await fetchTenantImage(imageUrl);
  const extension = type === 'image/jpeg' ? 'jpg' : type === 'image/webp' ? 'webp' : 'png';
  const file = await toFile(buffer, `product.${extension}`, { type });

  try {
    const response = await openaiClient().images.edit({
      model: env.AI_IMAGE_MODEL,
      image: file,
      prompt: CLEAN_PROMPT,
      size: IMAGE_SIZE,
      quality: 'high',
      output_format: 'png',
      n: 1,
    });
    const b64 = response.data?.[0]?.b64_json;
    if (!b64) throw new Error('Image model returned no image');
    return Buffer.from(b64, 'base64');
  } catch (error) {
    throw providerFailure('product-image-clean', error);
  }
}
