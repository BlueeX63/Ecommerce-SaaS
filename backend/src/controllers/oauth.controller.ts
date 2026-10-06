import type { Request, Response } from 'express';
import { createServerClient } from '@supabase/ssr';
import { env, isProd } from '../config/env.js';
import { db } from '../lib/supabase.js';
import { str } from '../lib/http.js';
import { createSession, revokeUserSessions } from '../lib/session.js';
import { slugify } from '../lib/sanitize.js';

const OAUTH_MARKER = 'OAUTH_PROVIDER';

/**
 * Google OAuth (PKCE) callback. The browser is redirected here by Supabase Auth with a one-time `code`.
 * Redirects are RELATIVE so they always resolve against the public (frontend) origin, whatever host
 * the backend is reachable on.
 */
export async function googleCallback(req: Request, res: Response) {
  const fail = () => res.redirect('/login?error=' + encodeURIComponent('Could not authenticate with Google'));

  const code = str(req.query.code);
  if (!code || code.length > 2048) return fail();

  const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => Object.entries(req.cookies ?? {}).map(([name, value]) => ({ name, value: String(value) })),
      // We only use Supabase Auth to prove the Google identity; our own session cookie is what authenticates
      // the user afterwards. Honour cookie *removals* (PKCE verifier clean-up) but never persist Supabase tokens.
      setAll: (cookies) => {
        for (const { name, value, options } of cookies) {
          if (!value || options?.maxAge === 0) res.clearCookie(name, { path: options?.path ?? '/' });
        }
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  const authUser = data?.session?.user;
  if (error || !authUser?.email || !authUser.email_confirmed_at) return fail();

  const email = authUser.email.trim().toLowerCase();

  let { data: user } = await db.from('users').select('*').ilike('email', email.replace(/[\\%_]/g, (c) => `\\${c}`)).limit(1).maybeSingle();

  if (!user) {
    const fullName: string = authUser.user_metadata?.full_name || authUser.user_metadata?.name || email.split('@')[0];
    const parts = String(fullName).trim().split(/\s+/);
    const firstName = (parts[0] || 'User').slice(0, 100);
    const lastName = (parts.length > 1 ? parts.slice(1).join(' ') : 'User').slice(0, 100);

    // A new account starts with no store. Stores are created only after a plan is purchased (see
    // tenant.controller provision), so signing up never leaves a store behind that the merchant did not ask for.
    const { data: newUser, error: userError } = await db
      .from('users')
      .insert({
        tenant_id: null,
        first_name: firstName,
        last_name: lastName,
        email,
        password_hash: OAUTH_MARKER,
        status: 'ACTIVE',
        email_verified: true,
      })
      .select('*')
      .single();

    if (userError || !newUser) return fail();

    user = newUser;

    // Ask the user to confirm their name on first dashboard visit.
    res.cookie('needs_name_setup', 'true', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });
  } else if (!user.email_verified) {
    // The address was never proven by whoever registered it with a password, but Google has just proven it for
    // the real owner. Drop the password set at registration (it may belong to an attacker who pre-registered the
    // address) and invalidate anything issued with it.
    await db.from('users').update({ email_verified: true, password_hash: OAUTH_MARKER }).eq('user_id', user.user_id);
    await revokeUserSessions(user.user_id);
    user.email_verified = true;
    user.password_hash = OAUTH_MARKER;
  }

  if (!user || user.status !== 'ACTIVE') return fail();

  await createSession(res, {
    userId: user.user_id,
    tenantId: user.tenant_id,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.redirect(user.password_hash === OAUTH_MARKER ? '/set-password' : '/');
}
