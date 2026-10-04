import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { escapeHtml, sendMail } from '../lib/email.js';
import { ApiError, badRequest, notFound, pageMeta, pagination, parse, uuid } from '../lib/http.js';
import { signToken } from '../lib/jwt.js';
import { kvDel, kvSet } from '../lib/kv.js';
import { rateLimit } from '../lib/rate-limit.js';
import { db } from '../lib/supabase.js';
import { emailField } from '../lib/validation.js';
import { assertTenantOwner, tenantCtx } from '../middleware/auth.js';
import { revokeUserSessions } from '../lib/session.js';
import { assertRoleInTenant } from './roles.controller.js';

const USER_COLUMNS = 'user_id, first_name, last_name, email, status, last_login, created_date';
const PENDING_INVITES_KEY = 'pending_invites';
const INVITE_TTL_SECONDS = 7 * 24 * 60 * 60;

type PendingInvite = { jti: string; email: string; roleId: string | null; invitedBy: string; invitedDate: string };

async function readPendingInvites(tenantId: string): Promise<PendingInvite[]> {
  const { data } = await db.from('tenant_settings').select('setting_value').eq('tenant_id', tenantId).eq('setting_key', PENDING_INVITES_KEY).maybeSingle();
  if (!data?.setting_value) return [];
  try {
    const parsed = JSON.parse(data.setting_value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writePendingInvites(tenantId: string, invites: PendingInvite[]) {
  await db
    .from('tenant_settings')
    .upsert({ tenant_id: tenantId, setting_key: PENDING_INVITES_KEY, setting_value: JSON.stringify(invites) }, { onConflict: 'tenant_id,setting_key' });
}

/** Managing teammates is reserved for the store owner. The owner's own account cannot be changed here. */
async function assertManageable(tenantId: string, actorId: string, targetId: string) {
  await assertTenantOwner(tenantId, actorId);
  if (targetId === actorId) throw badRequest('You cannot modify your own account here');
}

export async function list(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const page = pagination(req.query, 10);

  const [{ data, error, count }, { data: tenant }] = await Promise.all([
    db
      .from('users')
      .select(`${USER_COLUMNS}, user_roles(roles(role_name))`, { count: 'exact' })
      .eq('tenant_id', tenantId)
      .range(page.offset, page.offset + page.limit - 1),
    db.from('tenant').select('created_by').eq('tenant_id', tenantId).maybeSingle(),
  ]);
  if (error) throw error;

  const withRole = (data ?? []).map((user: any) => {
    const { user_roles, ...rest } = user;
    const assignedRole = user_roles?.[0]?.roles?.role_name;
    const role = user.user_id === tenant?.created_by ? 'Owner' : assignedRole || 'Member';
    return { ...rest, role };
  });

  res.json({ data: withRole, meta: pageMeta(count, page) });
}

// ---------------------------------------------------------------------------------------------
// Invitations - a user account is created only once the invite is accepted (see controllers/auth.controller.ts
// acceptInvite). Until then the invite is just a pending record + a single-use signed link.
// ---------------------------------------------------------------------------------------------

export async function listInvites(req: Request, res: Response) {
  const { tenantId, userId } = tenantCtx(req);
  await assertTenantOwner(tenantId, userId);
  const invites = await readPendingInvites(tenantId);
  res.json({ data: invites.map(({ jti, email, roleId, invitedDate }) => ({ jti, email, roleId, invitedDate })) });
}

export async function createInvite(req: Request, res: Response) {
  const { tenantId, userId } = tenantCtx(req);
  await assertTenantOwner(tenantId, userId);
  const body = parse(z.object({ email: emailField, roleId: z.string().uuid().optional() }), req.body);

  const perEmail = await rateLimit(`team-invite-email:${body.email}`, 5, 60 * 60_000);
  if (!perEmail.success) throw new ApiError(429, 'Too many invite attempts for this address. Please try again later.');

  const { data: existingUser } = await db.from('users').select('user_id').ilike('email', body.email).maybeSingle();
  if (existingUser) throw badRequest('This email already belongs to an account and cannot be invited.');

  if (body.roleId) {
    const { data: role } = await db.from('roles').select('role_id').eq('role_id', body.roleId).eq('tenant_id', tenantId).maybeSingle();
    if (!role) throw notFound('Role not found');
  }

  const invites = await readPendingInvites(tenantId);
  const alreadyInvited = invites.find((inv) => inv.email.toLowerCase() === body.email.toLowerCase());
  if (alreadyInvited) throw badRequest('An invite is already pending for this email.');

  const { data: tenant } = await db.from('tenant').select('tenant_name').eq('tenant_id', tenantId).maybeSingle();

  const jti = randomUUID();
  await kvSet(`team-invite:${jti}`, { tenantId, email: body.email, roleId: body.roleId ?? null }, INVITE_TTL_SECONDS);
  const token = await signToken('team-invite', { jti }, '7d');
  const acceptUrl = `${env.FRONTEND_URL.replace(/\/$/, '')}/accept-invite?token=${encodeURIComponent(token)}`;

  const sent = await sendMail({
    to: body.email,
    subject: `You've been invited to join ${tenant?.tenant_name ?? 'a store'} on Monolith`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You're invited</h2>
        <p>You've been invited to join <strong>${escapeHtml(tenant?.tenant_name ?? 'a store')}</strong>'s team on Monolith.</p>
        <div style="margin: 30px 0;">
          <a href="${acceptUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Accept Invitation</a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p>${acceptUrl}</p>
        <p>This invitation expires in 7 days. If you weren't expecting this, you can safely ignore this email.</p>
      </div>`,
  });
  if (!sent) {
    await kvDel(`team-invite:${jti}`);
    throw new ApiError(500, 'Failed to send invitation email. Please try again later.');
  }

  invites.push({ jti, email: body.email, roleId: body.roleId ?? null, invitedBy: userId, invitedDate: new Date().toISOString() });
  await writePendingInvites(tenantId, invites);

  res.status(201).json({ message: 'Invitation sent successfully' });
}

export async function revokeInvite(req: Request, res: Response) {
  const { tenantId, userId } = tenantCtx(req);
  await assertTenantOwner(tenantId, userId);
  const jti = uuid(req.params.jti, 'invite id');

  const invites = await readPendingInvites(tenantId);
  const next = invites.filter((inv) => inv.jti !== jti);
  if (next.length === invites.length) throw notFound('Invite not found');

  await writePendingInvites(tenantId, next);
  await kvDel(`team-invite:${jti}`);
  res.json({ message: 'Invitation revoked successfully' });
}

export async function getById(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const id = uuid(req.params.id);

  const { data: user, error } = await db
    .from('users')
    .select(`${USER_COLUMNS}, user_profiles(*)`)
    .eq('user_id', id)
    .eq('tenant_id', tenantId)
    .maybeSingle();
  if (error) throw error;
  if (!user) throw notFound('User not found');

  res.json({ data: user });
}

export async function update(req: Request, res: Response) {
  const { tenantId, userId } = tenantCtx(req);
  const id = uuid(req.params.id);
  await assertManageable(tenantId, userId, id);

  const body = parse(
    z.object({
      firstName: z.string().trim().min(1).max(100).optional(),
      lastName: z.string().trim().min(1).max(100).optional(),
      status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    }),
    req.body,
  );

  const update: Record<string, string> = {};
  if (body.firstName) update.first_name = body.firstName;
  if (body.lastName) update.last_name = body.lastName;
  if (body.status) update.status = body.status;
  if (Object.keys(update).length === 0) throw badRequest('Nothing to update');

  const { data, error } = await db
    .from('users')
    .update(update)
    .eq('user_id', id)
    .eq('tenant_id', tenantId)
    .select('user_id')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound('User not found');

  if (body.status === 'INACTIVE') await revokeUserSessions(id);
  res.json({ message: 'User updated successfully' });
}

export async function updateRole(req: Request, res: Response) {
  const { tenantId, userId } = tenantCtx(req);
  const id = uuid(req.params.id);
  await assertManageable(tenantId, userId, id);

  const { roleId } = parse(z.object({ roleId: z.string().uuid().nullable() }), req.body);
  if (roleId) await assertRoleInTenant(roleId, tenantId);

  const { error: deleteError } = await db.from('user_roles').delete().eq('user_id', id);
  if (deleteError) throw deleteError;

  if (roleId) {
    const { error: insertError } = await db.from('user_roles').insert({ user_id: id, role_id: roleId, assigned_by: userId });
    if (insertError) throw insertError;
  }

  res.json({ message: 'Role assignment updated successfully' });
}

export async function remove(req: Request, res: Response) {
  const { tenantId, userId } = tenantCtx(req);
  const id = uuid(req.params.id);
  if (id === userId) throw badRequest('Cannot delete own account');
  await assertManageable(tenantId, userId, id);

  const { data, error } = await db
    .from('users')
    .update({ status: 'DELETED' })
    .eq('user_id', id)
    .eq('tenant_id', tenantId)
    .select('user_id')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound('User not found');

  await revokeUserSessions(id);
  res.json({ message: 'User deleted successfully' });
}
