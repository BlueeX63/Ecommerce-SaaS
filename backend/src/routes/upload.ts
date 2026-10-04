import { Router } from 'express';
import multer from 'multer';
import { badRequest } from '../lib/http.js';
import { limit } from '../lib/rate-limit.js';
import { requireMerchant } from '../middleware/auth.js';
import { MAX_FILE_SIZE, uploadImage } from '../controllers/upload.controller.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1, fields: 5, parts: 8 },
});

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
  uploadImage,
);
