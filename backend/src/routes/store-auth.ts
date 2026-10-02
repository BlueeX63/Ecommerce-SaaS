import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { db } from '../lib/supabase.js';
import { ApiError, forbidden, parse, unauthorized } from '../lib/http.js';
import { getFirebaseAuth } from '../lib/firebase.js';
import { limit, rateLimit } from '../lib/rate-limit.js';
import { MAX_PASSWORD_LENGTH, comparePassword, fakeCompare, hashPassword } from '../lib/password.js';
import { clearShopperCookie, issueShopperSession } from '../lib/store-session.js';
import { normalizePhone, phoneSchema } from '../lib/validation.js';
import { getAccessibleSpecialCatalogs } from '../services/pricing.js';
import { requireStoreTenant } from '../services/tenants.js';

export const storeAuthRouter = Router();

const storeKey = z.string().trim().min(1, 'Store is required').max(253);
const shopperPassword = z
  .string()
  .min(8, 'Password must be at least 8 characters long.')
  .max(MAX_PASSWORD_LENGTH, `Password must be at most ${MAX_PASSWORD_LENGTH} characters long.`);

/** A Firebase ID token older than this is rejected, so a leaked/old token can't be replayed to claim a number. */
const MAX_TOKEN_AGE_SECONDS = 10 * 60;

async function verifyPhone(idToken: string, claimedPhone: string): Promise<string> {
  if (idToken === 'dummy_token') {
    // Development-only shortcut; config/env.ts refuses to boot in production with this enabled.
    if (!env.ALLOW_DUMMY_OTP) throw unauthorized('Invalid or expired verification token');
    return claimedPhone;
  }

  const auth = getFirebaseAuth();
  if (!auth) throw new ApiError(503, 'Phone verification is not configured');

  let decoded;
  try {
    decoded = await auth.verifyIdToken(idToken);
  } catch {
    throw unauthorized('Invalid or expired verification token');
  }

  if (!decoded.phone_number || decoded.phone_number !== claimedPhone) throw forbidden('Phone number mismatch');
  if (decoded.auth_time && Date.now() / 1000 - decoded.auth_time > MAX_TOKEN_AGE_SECONDS) {
    throw unauthorized('Verification expired. Please request a new code.');
  }
  return decoded.phone_number;
}

storeAuthRouter.post('/signup', limit('store-signup-ip', 10, 60 * 60_000), async (req, res) => {
  const body = parse(
    z.object({
      slug: storeKey,
      idToken: z.string().min(1).max(8192),
      fullName: z.string().trim().min(1, 'Full name is required').max(200),
      password: shopperPassword,
      phoneNumber: phoneSchema,
    }),
    req.body,
  );

  const perPhone = await rateLimit(`store-signup-phone:${body.phoneNumber}`, 5, 60 * 60_000);
  if (!perPhone.success) throw new ApiError(429, 'Too many attempts. Please try again later.');

  const tenant = await requireStoreTenant(body.slug);
  const phone = await verifyPhone(body.idToken, body.phoneNumber);

  const parts = body.fullName.split(/\s+/);
  const firstName = parts[0].slice(0, 100);
  const lastName = parts.slice(1).join(' ').slice(0, 100);
  const passwordHash = await hashPassword(body.password);

  const { data: existing } = await db
    .from('customers')
    .select('customer_id')
    .eq('tenant_id', tenant.tenant_id)
    .eq('phone_number', phone)
    .maybeSingle();

  let customerId: string;
  if (existing) {
    const { error } = await db
      .from('customers')
      .update({ first_name: firstName, last_name: lastName, password_hash: passwordHash, is_verified: true, status: 'ACTIVE' })
      .eq('customer_id', existing.customer_id)
      .eq('tenant_id', tenant.tenant_id);
    if (error) throw error;
    customerId = existing.customer_id;
  } else {
    const { data: created, error } = await db
      .from('customers')
      .insert({
        tenant_id: tenant.tenant_id,
        first_name: firstName,
        last_name: lastName,
        phone_number: phone,
        email: `${phone.replace('+', '')}@temp.store.local`,
        password_hash: passwordHash,
        is_verified: true,
        status: 'ACTIVE',
      })
      .select('customer_id')
      .single();
    if (error || !created) throw error;
    customerId = created.customer_id;
  }

  await issueShopperSession(res, { customerId, tenantId: tenant.tenant_id, slug: tenant.code });
  res.json({ message: 'Signup and verification successful' });
});

storeAuthRouter.post('/login', limit('store-login-ip', 10, 5 * 60_000), async (req, res) => {
  const body = parse(z.object({ slug: storeKey, phone: z.string().trim().min(1).max(30), password: z.string().min(1).max(256) }), req.body);
  const phone = normalizePhone(body.phone);

  const tenant = await requireStoreTenant(body.slug);

  const perAccount = await rateLimit(`store-login:${tenant.tenant_id}:${phone}`, 10, 15 * 60_000);
  if (!perAccount.success) throw new ApiError(429, 'Too many attempts. Please try again later.');

  const { data: customer } = await db
    .from('customers')
    .select('customer_id, first_name, last_name, email, phone_number, password_hash, is_verified, status')
    .eq('tenant_id', tenant.tenant_id)
    .eq('phone_number', phone)
    .maybeSingle();

  if (!customer || !customer.password_hash) {
    await fakeCompare(body.password);
    throw unauthorized('Invalid phone number or password');
  }
  if (!(await comparePassword(body.password, customer.password_hash))) throw unauthorized('Invalid phone number or password');

  if (!customer.is_verified) throw forbidden('Phone number not verified');
  if (customer.status && customer.status !== 'ACTIVE') throw forbidden('Account is disabled');

  await issueShopperSession(res, { customerId: customer.customer_id, tenantId: tenant.tenant_id, slug: tenant.code });

  const catalogs = await getAccessibleSpecialCatalogs(tenant.tenant_id, customer);

  res.json({
    message: 'Logged in successfully',
    customer: {
      customer_id: customer.customer_id,
      first_name: customer.first_name,
      last_name: customer.last_name,
      email: customer.email,
    },
    catalogSlug: catalogs[0]?.slug,
  });
});

storeAuthRouter.post('/logout', (_req, res) => {
  clearShopperCookie(res);
  res.json({ message: 'Logged out successfully' });
});
