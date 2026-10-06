import { z } from 'zod';
import { env } from '../config/env.js';

const superAdminSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  passwordHash: z.string().min(1),
});

const listSchema = z.array(superAdminSchema);

let cached: z.infer<typeof listSchema> | null = null;

/** The platform operators allowed into the Super Admin panel. Parsed once from SUPER_ADMINS_JSON. */
function loadSuperAdmins(): z.infer<typeof listSchema> {
  if (cached) return cached;
  if (!env.SUPER_ADMINS_JSON) {
    cached = [];
    return cached;
  }
  try {
    const parsed = listSchema.safeParse(JSON.parse(env.SUPER_ADMINS_JSON));
    if (!parsed.success) {
      console.error('[super-admin] SUPER_ADMINS_JSON is malformed:', parsed.error.message);
      cached = [];
      return cached;
    }
    cached = parsed.data;
    return cached;
  } catch (error) {
    console.error('[super-admin] failed to parse SUPER_ADMINS_JSON', error);
    cached = [];
    return cached;
  }
}

export function findSuperAdminByEmail(email: string): { email: string; passwordHash: string } | null {
  const normalized = email.trim().toLowerCase();
  return loadSuperAdmins().find((a) => a.email === normalized) ?? null;
}
