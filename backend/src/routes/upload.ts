import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import { ApiError, badRequest } from '../lib/http.js';
import { limit } from '../lib/rate-limit.js';
import { requireMerchant, tenantCtx } from '../middleware/auth.js';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1, fields: 5, parts: 8 },
});

/** Identifies an image by its magic bytes - the client-declared MIME type is not trustworthy. */
function sniffImageType(buf: Buffer): string | null {
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

export const uploadRouter = Router();

uploadRouter.post(
  '/',
  requireMerchant,
  limit('upload', 10, 60_000, (req) => req.merchant?.userId),
  (req, res, next) => {
    upload.single('file')(req, res, (error) => {
      if (error instanceof multer.MulterError) {
        return next(
          error.code === 'LIMIT_FILE_SIZE'
            ? badRequest(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`)
            : badRequest('Invalid upload'),
        );
      }
      next(error);
    });
  },
  async (req, res) => {
    const { tenantId } = tenantCtx(req);
    if (!env.CLOUDINARY_CLOUD_NAME) throw new ApiError(503, 'Image uploads are not configured');

    const file = req.file;
    if (!file) throw badRequest('No file provided');

    const detected = sniffImageType(file.buffer);
    if (!detected || !ALLOWED.includes(detected)) {
      throw badRequest(`Invalid file type. Allowed types: ${ALLOWED.join(', ')}`);
    }

    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: `tenant_${tenantId}/products`,
            resource_type: 'image',
            allowed_formats: ['jpg', 'png', 'webp', 'gif', 'avif'],
          },
          (error, uploaded) => (error || !uploaded ? reject(error ?? new Error('Upload failed')) : resolve(uploaded)),
        )
        .end(file.buffer);
    });

    res.json({ url: result.secure_url, public_id: result.public_id });
  },
);
