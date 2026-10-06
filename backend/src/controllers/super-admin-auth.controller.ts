import type { Request, Response } from 'express';
import { z } from 'zod';
import { comparePassword, fakeCompare } from '../lib/password.js';
import { parse, unauthorized } from '../lib/http.js';
import { findSuperAdminByEmail } from '../lib/super-admins.js';
import { clearSuperAdminCookie, getSuperAdminSession, issueSuperAdminSession } from '../lib/super-admin-session.js';
import { rateLimit } from '../lib/rate-limit.js';
import { ApiError } from '../lib/http.js';

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(256),
});

export async function login(req: Request, res: Response) {
  const { email, password } = parse(loginSchema, req.body);

  const perAccount = await rateLimit(`super-admin-login:${email}`, 5, 15 * 60_000);
  if (!perAccount.success) throw new ApiError(429, 'Too many login attempts. Please try again later.');

  const account = findSuperAdminByEmail(email);
  if (!account) {
    await fakeCompare(password);
    throw unauthorized('Invalid credentials');
  }
  if (!(await comparePassword(password, account.passwordHash))) throw unauthorized('Invalid credentials');

  await issueSuperAdminSession(res, account.email);
  res.json({ message: 'Logged in successfully', email: account.email });
}

export function logout(_req: Request, res: Response) {
  clearSuperAdminCookie(res);
  res.json({ message: 'Logged out successfully' });
}

export async function getCurrentSession(req: Request, res: Response) {
  const session = await getSuperAdminSession(req);
  if (!session) return void res.status(401).json({ isLoggedIn: false });
  res.json({ isLoggedIn: true, email: session.email });
}
