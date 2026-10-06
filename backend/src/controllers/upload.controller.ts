import type { Request, Response } from 'express';
import { badRequest } from '../lib/http.js';
import { tenantCtx } from '../middleware/auth.js';
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, sniffImageType, uploadTenantImage } from '../services/media.js';

export const MAX_FILE_SIZE = MAX_IMAGE_BYTES;
export { ALLOWED_IMAGE_TYPES };

export async function uploadImage(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);

  const file = req.file;
  if (!file) throw badRequest('No file provided');

  const detected = sniffImageType(file.buffer);
  if (!detected || !ALLOWED_IMAGE_TYPES.includes(detected)) {
    throw badRequest(`Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`);
  }

  const { url, publicId } = await uploadTenantImage(tenantId, file.buffer);
  res.json({ url, public_id: publicId });
}
