import { z } from 'zod';

/** Empty strings from HTML forms are treated as "not provided". */
const blankToUndefined = (value: unknown) => (value === '' || value === null ? undefined : value);

export const optionalText = (max: number) => z.preprocess(blankToUndefined, z.string().trim().max(max).optional());

export const optionalNumber = (min: number, max: number) =>
  z.preprocess(blankToUndefined, z.coerce.number().min(min).max(max).optional());

export const optionalUuid = z.preprocess(blankToUndefined, z.string().uuid().optional());

export const requiredMoney = z.coerce.number().min(0).max(1_000_000_000);

/** http(s) URL only - blocks javascript:, data:, file: and friends. */
export const httpUrl = (max = 255) =>
  z
    .string()
    .trim()
    .max(max)
    .url()
    .refine((value) => /^https?:\/\//i.test(value), 'Must be an http(s) URL');

export const optionalHttpUrl = (max = 255) => z.preprocess(blankToUndefined, httpUrl(max).optional());

/**
 * Normalises a phone number to E.164-like form. Ten bare digits are assumed to be Indian numbers (+91), which
 * matches how storefront sign-up formats numbers, so catalog access by phone number lines up with customers.
 */
export function normalizePhone(raw: string): string {
  const cleaned = raw.replace(/[\s\-().]/g, '');
  if (/^\d{10}$/.test(cleaned)) return `+91${cleaned}`;
  if (/^\d{11,15}$/.test(cleaned)) return `+${cleaned}`;
  return cleaned;
}

export const phoneSchema = z
  .string()
  .trim()
  .transform(normalizePhone)
  .pipe(z.string().regex(/^\+[0-9]{7,15}$/, 'Invalid phone number'));

export const optionalPhone = z.preprocess(blankToUndefined, phoneSchema.optional());

export const emailField = z.string().trim().toLowerCase().pipe(z.email('Invalid email format').max(254));
