/**
 * Startup validation for required environment variables.
 * Import this module early in the application lifecycle to fail fast
 * if any critical environment variable is missing.
 */

const requiredServerVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
  'STRIPE_SECRET_KEY',
] as const;

const requiredForProduction = [
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'STRIPE_WEBHOOK_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
] as const;

const missing: string[] = [];

for (const key of requiredServerVars) {
  if (!process.env[key]) {
    missing.push(key);
  }
}

if (process.env.NODE_ENV === 'production') {
  for (const key of requiredForProduction) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }
}

if (missing.length > 0) {
  throw new Error(
    `FATAL: Missing required environment variables:\n  - ${missing.join('\n  - ')}\n\nPlease add them to your .env.local file.`
  );
}

export {};
