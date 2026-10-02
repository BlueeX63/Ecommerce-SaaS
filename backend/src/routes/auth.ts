import { createHash, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { db } from '../lib/supabase.js';
import { ApiError, badRequest, escapeLike, forbidden, parse, str, unauthorized, uuid } from '../lib/http.js';
import { fetchWithCache, kvDel, kvGet, kvIncr, kvSet } from '../lib/kv.js';
import { limit, rateLimit } from '../lib/rate-limit.js';
import {
  MAX_PASSWORD_LENGTH,
  comparePassword,
  fakeCompare,
  hashPassword,
  validatePasswordStrength,
} from '../lib/password.js';
import {
  createSession,
  destroySession,
  getSession,
  revokeUserSessions,
  setSessionTenant,
} from '../lib/session.js';
import { signToken, verifyToken } from '../lib/jwt.js';
import { escapeHtml, sendMail } from '../lib/email.js';
import { requireMerchant } from '../middleware/auth.js';
import { getEntitlements } from '../services/entitlements.js';

export const authRouter = Router();

const OAUTH_MARKER = 'OAUTH_PROVIDER';
const OTP_TTL_SECONDS = 15 * 60;
const OTP_MAX_ATTEMPTS = 5;

const emailSchema = z.string().trim().toLowerCase().pipe(z.email('Invalid email format').max(254));
const nameSchema = (label: string) =>
  z.string().trim().min(2, `${label} must be at least 2 characters`).max(100, `${label} is too long`);

const sha256 = (value: string) => createHash('sha256').update(value).digest();

async function findUserByEmail<T extends string>(email: string, columns: T) {
  const { data } = await db.from('users').select(columns).ilike('email', escapeLike(email)).limit(1).maybeSingle();
  return data as any;
}

// ---------------------------------------------------------------------------------------------
// Register + e-mail OTP verification
// ---------------------------------------------------------------------------------------------

const registerSchema = z.object({
  firstName: nameSchema('First name'),
  lastName: nameSchema('Last name'),
  email: emailSchema,
  password: z.string().max(MAX_PASSWORD_LENGTH, `Password must be at most ${MAX_PASSWORD_LENGTH} characters long.`),
});

authRouter.post('/register', limit('register', 30, 60 * 60_000), async (req, res) => {
  const { firstName, lastName, email, password } = parse(registerSchema, req.body);

  const perEmail = await rateLimit(`register-email:${email}`, 5, 60 * 60_000);
  if (!perEmail.success) throw new ApiError(429, 'Too many requests. Please try again later.');

  const strength = validatePasswordStrength(password);
  if (!strength.isValid) throw badRequest(strength.message);

  const existing = await findUserByEmail(email, 'user_id, email_verified');
  if (existing) {
    if (existing.email_verified) throw badRequest('Email already registered');
    // An unverified registration never proved ownership of the address - let the owner start over.
    await db.from('users').delete().eq('user_id', existing.user_id);
  }

  const { data: user, error } = await db
    .from('users')
    .insert({
      tenant_id: null,
      first_name: firstName,
      last_name: lastName,
      email,
      password_hash: await hashPassword(password),
      status: 'ACTIVE',
      email_verified: false,
    })
    .select('user_id')
    .single();

  if (error || !user) {
    console.error('[auth] failed to create user', error);
    return void res.status(500).json({ error: 'Failed to create user' });
  }

  const otp = randomInt(100_000, 1_000_000).toString();
  await kvSet(`otp:${email}`, { h: sha256(otp).toString('hex') }, OTP_TTL_SECONDS);
  await kvDel(`otp-attempts:${email}`);

  const sent = await sendMail({
    to: email,
    subject: 'Your Verification Code',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; text-align: center;">
        <h2>Welcome to our E-commerce platform!</h2>
        <p>Hi ${escapeHtml(firstName)},</p>
        <p>Thanks for creating an account for your new store. To complete your registration, please enter the verification code below:</p>
        <div style="margin: 30px 0; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #F04438;">${otp}</div>
        <p>This code will expire in 15 minutes.</p>
      </div>`,
  });

  if (!sent) {
    await db.from('users').delete().eq('user_id', user.user_id);
    await kvDel(`otp:${email}`);
    return void res.status(500).json({ error: 'Failed to send verification email. Please try again later.' });
  }

  res.status(201).json({ message: 'Registration successful. Please check your inbox for the verification code.' });
});

const verifyOtpSchema = z.object({ email: emailSchema, otp: z.string().regex(/^\d{6}$/, 'Code must be 6 digits') });

authRouter.post('/verify-otp', limit('verify-otp-ip', 30, 15 * 60_000), async (req, res) => {
  const { email, otp } = parse(verifyOtpSchema, req.body);

  const attempts = await kvIncr(`otp-attempts:${email}`, OTP_TTL_SECONDS * 1000);
  if (attempts > OTP_MAX_ATTEMPTS) {
    await kvDel(`otp:${email}`);
    return void res.status(429).json({ error: 'Too many incorrect attempts. Please request a new code.' });
  }

  const record = await kvGet<{ h: string }>(`otp:${email}`);
  const expected = record?.h ? Buffer.from(record.h, 'hex') : null;
  const actual = sha256(otp);
  if (!expected || expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw badRequest('Invalid or expired verification code');
  }

  await kvDel(`otp:${email}`, `otp-attempts:${email}`);

  const { data: user, error } = await db
    .from('users')
    .update({ email_verified: true })
    .ilike('email', escapeLike(email))
    .eq('status', 'ACTIVE')
    .select('user_id, tenant_id')
    .maybeSingle();

  if (error || !user) throw badRequest('User not found or failed to update');

  await createSession(res, {
    userId: user.user_id,
    tenantId: user.tenant_id,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.json({ message: 'Email verified successfully. You are now logged in.' });
});

// ---------------------------------------------------------------------------------------------
// Login / logout / session
// ---------------------------------------------------------------------------------------------

const loginSchema = z.object({ email: emailSchema, password: z.string().min(1, 'Password is required').max(256) });

authRouter.post('/login', limit('login-ip', 10, 5 * 60_000), async (req, res) => {
  const { email, password } = parse(loginSchema, req.body);

  const perAccount = await rateLimit(`login-email:${email}`, 10, 15 * 60_000);
  if (!perAccount.success) return void res.status(429).json({ error: 'Too many login attempts. Please try again later.' });

  const user = await findUserByEmail(email, 'user_id, tenant_id, password_hash, status, email_verified');

  if (!user) {
    await fakeCompare(password);
    throw unauthorized('Invalid credentials');
  }

  if (user.password_hash === OAUTH_MARKER) {
    await fakeCompare(password);
    throw unauthorized('This account was created with Google. Please log in with Google first to set a password.');
  }

  if (!(await comparePassword(password, user.password_hash))) throw unauthorized('Invalid credentials');

  // Account state is only revealed to someone who knows the password.
  if (user.status !== 'ACTIVE') throw forbidden('Account is disabled');
  if (!user.email_verified) throw forbidden('Email not verified. Please verify your email address first.');

  await createSession(res, {
    userId: user.user_id,
    tenantId: user.tenant_id,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  await db.from('users').update({ last_login: new Date().toISOString() }).eq('user_id', user.user_id);

  res.json({ message: 'Login successful' });
});

authRouter.post('/logout', async (req, res) => {
  await destroySession(req, res);
  res.json({ message: 'Logged out successfully' });
});

authRouter.get('/session', async (req, res) => {
  const session = await getSession(req);
  if (!session) return void res.status(401).json({ isLoggedIn: false });

  const { data: user } = await db
    .from('users')
    .select('email, first_name, last_name')
    .eq('user_id', session.userId)
    .maybeSingle();

  res.json({
    isLoggedIn: true,
    user: {
      userId: session.userId,
      tenantId: session.tenantId,
      role: session.role,
      email: user?.email || 'User',
      first_name: user?.first_name || '',
      last_name: user?.last_name || '-',
    },
  });
});

/**
 * Everything the server-rendered dashboard/landing pages need about the logged-in merchant in one call.
 * 401 when there is no valid session.
 */
const AUTH_CONTEXT_TTL_SECONDS = 20;

async function computeAuthContext(userId: string, tenantId: string | null) {
  const [{ data: user }, { data: stores }, entitlements, role, hasStoreResult] = await Promise.all([
    db.from('users').select('first_name, last_name, email').eq('user_id', userId).maybeSingle(),
    db.from('tenant').select('tenant_id, tenant_name, code, custom_domain').eq('created_by', userId),
    getEntitlements(userId),
    resolveRole(userId, tenantId),
    tenantId
      ? db.from('tenant_settings').select('setting_id').eq('tenant_id', tenantId).eq('setting_key', 'customization').maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const storeList = stores ?? [];
  return {
    user: { userId, tenantId, first_name: user?.first_name, last_name: user?.last_name, email: user?.email, role },
    subscriptionActive: entitlements.active,
    plan: entitlements.active ? { id: entitlements.planTier, name: entitlements.planName, maxStores: entitlements.maxStores } : null,
    featureFlags: entitlements.featureFlags,
    hasStore: !!hasStoreResult.data,
    stores: storeList,
    storesUsed: storeList.length,
    activeStore: storeList.find((s) => s.tenant_id === tenantId) ?? null,
  };
}

authRouter.get('/context', requireMerchant, async (req, res) => {
  const session = req.merchant!;
  const data = await fetchWithCache(
    `auth-context:${session.userId}:${session.tenantId ?? 'none'}`,
    () => computeAuthContext(session.userId, session.tenantId),
    AUTH_CONTEXT_TTL_SECONDS,
  );
  res.json(data);
});

/** "Owner" if this user created the active tenant, else their assigned custom role name, else "Member". */
async function resolveRole(userId: string, tenantId: string | null): Promise<string | null> {
  if (!tenantId) return null;

  const { data: tenant } = await db.from('tenant').select('created_by').eq('tenant_id', tenantId).maybeSingle();
  if (tenant?.created_by === userId) return 'Owner';

  const { data: userRole } = await db
    .from('user_roles')
    .select('roles(role_name)')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();
  const roleName = (userRole?.roles as unknown as { role_name?: string } | null)?.role_name;
  return roleName || 'Member';
}

// ---------------------------------------------------------------------------------------------
// Password reset (single-use, time-limited link that revokes all sessions when used)
// ---------------------------------------------------------------------------------------------

authRouter.post('/forgot-password', limit('forgot-ip', 3, 60 * 60_000), async (req, res) => {
  const { email } = parse(z.object({ email: emailSchema }), req.body);

  const perEmail = await rateLimit(`forgot-email:${email}`, 3, 60 * 60_000);
  const generic = { message: 'If an account exists with that email, a password reset link has been sent.' };
  if (!perEmail.success) return void res.json(generic);

  const user = await findUserByEmail(email, 'user_id, status, password_hash');

  if (user && user.status === 'ACTIVE' && user.password_hash !== OAUTH_MARKER) {
    const jti = randomUUID();
    await kvSet(`pwreset:${jti}`, user.user_id, 3600);
    const token = await signToken('password-reset', { userId: user.user_id, jti }, '1h');
    const resetUrl = `${env.FRONTEND_URL.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;

    await sendMail({
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset your password</h2>
          <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
          <div style="margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p>${resetUrl}</p>
          <p>This link can be used once and expires in 1 hour.</p>
        </div>`,
    });
  }

  res.json(generic);
});

authRouter.post('/reset-password', limit('reset-ip', 10, 60 * 60_000), async (req, res) => {
  const { token, newPassword } = parse(
    z.object({ token: z.string().min(1, 'Token is required').max(4096), newPassword: z.string().max(MAX_PASSWORD_LENGTH) }),
    req.body,
  );

  const strength = validatePasswordStrength(newPassword);
  if (!strength.isValid) throw badRequest(strength.message);

  const payload = await verifyToken<{ userId: string; jti: string }>('password-reset', token);
  if (!payload?.userId || !payload.jti) throw badRequest('Invalid or expired token');

  const stored = await kvGet<string>(`pwreset:${payload.jti}`);
  if (!stored || stored !== payload.userId) throw badRequest('Invalid or expired token');
  await kvDel(`pwreset:${payload.jti}`); // single use

  const { error } = await db
    .from('users')
    .update({ password_hash: await hashPassword(newPassword) })
    .eq('user_id', payload.userId)
    .eq('status', 'ACTIVE');

  if (error) return void res.status(500).json({ error: 'Failed to reset password' });

  await revokeUserSessions(payload.userId);
  res.json({ message: 'Password reset successfully' });
});

// ---------------------------------------------------------------------------------------------
// Team invitations - see routes/team.ts for how an invite is created. Accepting one here creates the
// user account directly under the inviting tenant (never their own store) and logs them straight in.
// ---------------------------------------------------------------------------------------------

type InviteRecord = { tenantId: string; email: string; roleId: string | null };

authRouter.get('/invite-info', limit('invite-info', 30, 10 * 60_000), async (req, res) => {
  const token = str(req.query.token);
  const payload = await verifyToken<{ jti: string }>('team-invite', token);
  if (!payload?.jti) throw badRequest('This invitation link is invalid or has expired.');

  const invite = await kvGet<InviteRecord>(`team-invite:${payload.jti}`);
  if (!invite) throw badRequest('This invitation link is invalid or has expired.');

  const { data: tenant } = await db.from('tenant').select('tenant_name').eq('tenant_id', invite.tenantId).maybeSingle();
  res.json({ email: invite.email, tenantName: tenant?.tenant_name ?? 'this store' });
});

authRouter.post('/accept-invite', limit('accept-invite', 10, 15 * 60_000), async (req, res) => {
  const { token, firstName, lastName, password } = parse(
    z.object({
      token: z.string().min(1, 'Token is required').max(4096),
      firstName: nameSchema('First name'),
      lastName: nameSchema('Last name'),
      password: z.string().max(MAX_PASSWORD_LENGTH),
    }),
    req.body,
  );

  const strength = validatePasswordStrength(password);
  if (!strength.isValid) throw badRequest(strength.message);

  const payload = await verifyToken<{ jti: string }>('team-invite', token);
  if (!payload?.jti) throw badRequest('This invitation link is invalid or has expired.');

  const invite = await kvGet<InviteRecord>(`team-invite:${payload.jti}`);
  if (!invite) throw badRequest('This invitation link is invalid or has expired.');

  // The invite may have gone stale (e.g. someone else registered this address in the meantime).
  const existing = await findUserByEmail(invite.email, 'user_id');
  if (existing) throw badRequest('This email already belongs to an account.');

  const { data: user, error } = await db
    .from('users')
    .insert({
      tenant_id: invite.tenantId,
      first_name: firstName,
      last_name: lastName,
      email: invite.email,
      password_hash: await hashPassword(password),
      status: 'ACTIVE',
      email_verified: true, // the invite link itself was delivered to - and proves control of - this address
    })
    .select('user_id')
    .single();
  if (error || !user) {
    console.error('[auth] failed to create invited user', error);
    throw new ApiError(500, 'Failed to create account');
  }

  if (invite.roleId) {
    await db.from('user_roles').insert({ user_id: user.user_id, role_id: invite.roleId, assigned_by: null });
  }

  await kvDel(`team-invite:${payload.jti}`); // single use
  const { data: settingsRow } = await db
    .from('tenant_settings')
    .select('setting_value')
    .eq('tenant_id', invite.tenantId)
    .eq('setting_key', 'pending_invites')
    .maybeSingle();
  if (settingsRow?.setting_value) {
    try {
      const invites = JSON.parse(settingsRow.setting_value).filter((inv: { jti: string }) => inv.jti !== payload.jti);
      await db.from('tenant_settings').update({ setting_value: JSON.stringify(invites) }).eq('tenant_id', invite.tenantId).eq('setting_key', 'pending_invites');
    } catch {
      // best-effort cleanup of the listing; the single-use KV entry above is what actually prevents reuse
    }
  }

  await createSession(res, { userId: user.user_id, tenantId: invite.tenantId, ip: req.ip, userAgent: req.get('user-agent') });
  res.status(201).json({ message: 'Welcome aboard!' });
});

authRouter.post('/set-password', requireMerchant, limit('set-password', 10, 15 * 60_000), async (req, res) => {
  const session = req.merchant!;
  const { oldPassword, password, firstName, lastName } = parse(
    z.object({
      oldPassword: z.string().max(256).optional(),
      password: z.string().max(MAX_PASSWORD_LENGTH),
      firstName: nameSchema('First name').optional(),
      lastName: nameSchema('Last name').optional(),
    }),
    req.body,
  );

  const { data: user } = await db.from('users').select('password_hash').eq('user_id', session.userId).maybeSingle();
  if (!user) return void res.status(404).json({ error: 'User not found' });

  if (user.password_hash !== OAUTH_MARKER) {
    if (!oldPassword) throw badRequest('Current password is required');
    if (!(await comparePassword(oldPassword, user.password_hash))) throw badRequest('Incorrect current password');
  }

  const strength = validatePasswordStrength(password);
  if (!strength.isValid) throw badRequest(strength.message);

  const update: Record<string, string> = { password_hash: await hashPassword(password) };
  if (firstName) update.first_name = firstName;
  if (lastName) update.last_name = lastName;

  const { error } = await db.from('users').update(update).eq('user_id', session.userId);
  if (error) {
    console.error('[auth] set-password failed', error);
    return void res.status(500).json({ error: 'Failed to update password' });
  }

  // A password change signs the account out everywhere else.
  await revokeUserSessions(session.userId, session.sessionId);
  res.json({ message: 'Password updated successfully' });
});

// ---------------------------------------------------------------------------------------------
// Profile / store switching
// ---------------------------------------------------------------------------------------------

authRouter.post('/switch-store', requireMerchant, async (req, res) => {
  const session = req.merchant!;
  const tenantId = uuid(req.body?.tenantId, 'tenantId');

  const { data: tenant } = await db
    .from('tenant')
    .select('tenant_id')
    .eq('tenant_id', tenantId)
    .eq('created_by', session.userId)
    .maybeSingle();

  if (!tenant) return void res.status(403).json({ error: 'Tenant not found or access denied' });

  await setSessionTenant(res, session, tenant.tenant_id);
  res.json({ success: true, tenantId: tenant.tenant_id });
});

authRouter.post('/update-name', requireMerchant, async (req, res) => {
  const { name } = parse(
    z.object({ name: z.string().trim().min(2, 'Please provide a valid full name.').max(200) }),
    req.body,
  );

  const parts = name.split(/\s+/);
  const firstName = parts[0].slice(0, 100);
  const lastName = (parts.length > 1 ? parts.slice(1).join(' ') : '-').slice(0, 100);

  const { error } = await db
    .from('users')
    .update({ first_name: firstName, last_name: lastName })
    .eq('user_id', req.merchant!.userId);
  if (error) throw error;

  res.clearCookie('needs_name_setup', { path: '/' });
  res.json({ success: true });
});
