import type { ErrorRequestHandler, Request, RequestHandler } from 'express';
import { z, ZodError } from 'zod';
import { isProd } from '../config/env.js';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
    public code?: string,
  ) {
    super(message);
  }
}

export const badRequest = (message: string, details?: unknown) => new ApiError(400, message, details);
export const unauthorized = (message = 'Unauthorized') => new ApiError(401, message);
export const forbidden = (message = 'Forbidden') => new ApiError(403, message);
export const notFound = (message = 'Not found') => new ApiError(404, message);

export const uuidSchema = z.string().uuid();

/** Parses a body/query/params object with zod, throwing a 400 ApiError on failure. */
export function parse<S extends z.ZodType>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ApiError(
      400,
      'Validation failed',
      result.error.issues.map((issue) => issue.message),
    );
  }
  return result.data;
}

/** Returns the value only if it is a valid UUID, otherwise throws 400. */
export function uuid(value: unknown, label = 'id'): string {
  const result = uuidSchema.safeParse(value);
  if (!result.success) throw badRequest(`Invalid ${label}`);
  return result.data;
}

/** Reads an optional string from a query/body value (first value wins for arrays). */
export function str(value: unknown): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return typeof v === 'string' ? v : undefined;
}

export interface Pagination {
  page: number;
  limit: number;
  offset: number;
}

export function pagination(query: Request['query'], defaultLimit = 20, maxLimit = 100): Pagination {
  const page = Math.max(1, parseInt(str(query.page) ?? '1', 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(str(query.limit) ?? String(defaultLimit), 10) || defaultLimit));
  return { page, limit, offset: (page - 1) * limit };
}

export function pageMeta(total: number | null, { page, limit }: Pagination) {
  return { total: total ?? 0, page, limit, totalPages: total ? Math.ceil(total / limit) : 0 };
}

/** Escapes `%`, `_` and `\` so user input can be used inside an ILIKE pattern as a literal. */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: 'Not found' });
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (res.headersSent) return;

  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: err.message,
      ...(err.details !== undefined ? { details: err.details } : {}),
      ...(err.code ? { code: err.code } : {}),
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation failed', details: err.issues.map((i) => i.message) });
    return;
  }

  // body-parser / multer errors (malformed JSON, payload too large, ...)
  const status = typeof err?.status === 'number' ? err.status : undefined;
  if (status && status >= 400 && status < 500) {
    res.status(status).json({ error: status === 413 ? 'Payload too large' : 'Invalid request' });
    return;
  }

  console.error(`[error] ${req.method} ${req.originalUrl}`, isProd ? err?.message : err);
  res.status(500).json({ error: 'Internal server error' });
};
