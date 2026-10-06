import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import { ApiError } from '../lib/http.js';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

/** Identifies an image by its magic bytes - the client-declared MIME type is not trustworthy. */
export function sniffImageType(buf: Buffer): string | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png';
  }
  if (buf.length >= 6 && ['GIF87a', 'GIF89a'].includes(buf.subarray(0, 6).toString('ascii'))) return 'image/gif';
  if (buf.length >= 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') {
    return 'image/webp';
  }
  if (buf.length >= 12 && buf.subarray(4, 8).toString('ascii') === 'ftyp') {
    const brand = buf.subarray(8, 12).toString('ascii');
    if (brand === 'avif' || brand === 'avis') return 'image/avif';
  }
  return null;
}

/** Stores an image under the tenant's product folder and returns its public URL. */
export async function uploadTenantImage(tenantId: string, buffer: Buffer, subfolder = 'products'): Promise<{ url: string; publicId: string }> {
  if (!env.CLOUDINARY_CLOUD_NAME) throw new ApiError(503, 'Image uploads are not configured');

  const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: `tenant_${tenantId}/${subfolder}`,
          resource_type: 'image',
          allowed_formats: ['jpg', 'png', 'webp', 'gif', 'avif'],
        },
        (error, uploaded) => (error || !uploaded ? reject(error ?? new Error('Upload failed')) : resolve(uploaded)),
      )
      .end(buffer);
  });

  return { url: result.secure_url, publicId: result.public_id };
}

/**
 * True only for an image URL that lives in this tenant's own Cloudinary folder. Used to make sure AI image
 * tools can only read images the merchant uploaded to their own store - never an arbitrary URL (SSRF) and
 * never another tenant's images.
 */
export function isTenantImageUrl(raw: string, tenantId: string): boolean {
  if (!env.CLOUDINARY_CLOUD_NAME) return false;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  return (
    url.protocol === 'https:' &&
    url.hostname === 'res.cloudinary.com' &&
    url.pathname.startsWith(`/${env.CLOUDINARY_CLOUD_NAME}/image/upload/`) &&
    url.pathname.includes(`/tenant_${tenantId}/`)
  );
}

/** Downloads a tenant-owned image with a hard size and time limit. */
export async function fetchTenantImage(url: string): Promise<{ buffer: Buffer; type: string }> {
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000), redirect: 'error' });
  if (!res.ok) throw new ApiError(400, 'The image could not be loaded');

  const declared = Number(res.headers.get('content-length') ?? 0);
  if (declared > MAX_IMAGE_BYTES) throw new ApiError(400, 'Image is too large to process');

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length > MAX_IMAGE_BYTES) throw new ApiError(400, 'Image is too large to process');

  const type = sniffImageType(buffer);
  if (!type || !ALLOWED_IMAGE_TYPES.includes(type)) throw new ApiError(400, 'Unsupported image type');
  return { buffer, type };
}
