import 'dotenv/config';
import { z } from 'zod';

const flag = z
  .enum(['true', 'false'])
  .optional()
  .transform((v) => v === 'true');

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== '' ? v : undefined));

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  /** Number of reverse proxies in front of this server (the Next.js server counts as one). */
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(1),

  /** Public URL of the frontend (used in e-mails and Stripe redirect URLs). */
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  /** Base SaaS domain (e.g. monolith.com). Custom domains may not live under it. */
  ROOT_DOMAIN: optionalString,

  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),

  STRIPE_SECRET_KEY: optionalString,
  STRIPE_WEBHOOK_SECRET: optionalString,

  UPSTASH_REDIS_REST_URL: optionalString,
  UPSTASH_REDIS_REST_TOKEN: optionalString,

  CLOUDINARY_CLOUD_NAME: optionalString,
  CLOUDINARY_API_KEY: optionalString,
  CLOUDINARY_API_SECRET: optionalString,

  SMTP_HOST: optionalString,
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: optionalString,
  SMTP_PASS: optionalString,
  SMTP_FROM: optionalString,

  FIREBASE_PROJECT_ID: optionalString,
  FIREBASE_CLIENT_EMAIL: optionalString,
  FIREBASE_PRIVATE_KEY: optionalString,

  /** DEV ONLY: accept the literal "dummy_token" instead of a Firebase ID token for shopper sign-up. */
  ALLOW_DUMMY_OTP: flag,
  /** DEV ONLY: enable the fake "mock-subscribe" endpoint. */
  ALLOW_MOCK_SUBSCRIBE: flag,

  /**
   * Platform operators who can access the Super Admin panel, as a JSON array of
   * [{"email": "...", "passwordHash": "<bcrypt hash>"}]. There is no DB table for this on purpose: super
   * admin identity lives entirely outside the application database, so no SQL-injection or auth-logic bug
   * anywhere in the app can ever grant this privilege - only whoever controls the server's deployment config.
   */
  SUPER_ADMINS_JSON: optionalString,
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(`Invalid or missing environment variables:\n${issues}`);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';

if (isProd) {
  const missing: string[] = [];
  const need = (key: keyof typeof env) => {
    if (!env[key]) missing.push(String(key));
  };
  need('UPSTASH_REDIS_REST_URL');
  need('UPSTASH_REDIS_REST_TOKEN');
  need('STRIPE_SECRET_KEY');
  need('STRIPE_WEBHOOK_SECRET');
  need('CLOUDINARY_CLOUD_NAME');
  need('CLOUDINARY_API_KEY');
  need('CLOUDINARY_API_SECRET');
  need('ROOT_DOMAIN');
  if (missing.length) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }
  if (env.ALLOW_DUMMY_OTP || env.ALLOW_MOCK_SUBSCRIBE) {
    throw new Error('ALLOW_DUMMY_OTP and ALLOW_MOCK_SUBSCRIBE must not be enabled in production.');
  }
  if (!env.FRONTEND_URL.startsWith('https://')) {
    throw new Error('FRONTEND_URL must use https in production.');
  }
}
