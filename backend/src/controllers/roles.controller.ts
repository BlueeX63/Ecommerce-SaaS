import type { Request, Response } from 'express';
import { z } from 'zod';
import { badRequest, notFound, parse, uuid } from '../lib/http.js';
import { db } from '../lib/supabase.js';
import { optionalText } from '../lib/validation.js';
import { assertTenantOwner, tenantCtx } from '../middleware/auth.js';

const permissionIds = z.array(z.string().uuid()).max(500);

export async function assertRoleInTenant(roleId: string, tenantId: string) {
  const { data } = await db.from('roles').select('role_id').eq('role_id', roleId).eq('tenant_id', tenantId).maybeSingle();
  if (!data) throw notFound('Role not found');
}

export async function list(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const { data, error } = await db
    .from('roles')
    .select('role_id, role_name, description, status, created_date')
    .eq('tenant_id', tenantId);
  if (error) throw error;
  res.json({ data });
}

export async function create(req: Request, res: Response) {
  const { tenantId, userId } = tenantCtx(req);
  await assertTenantOwner(tenantId, userId);
  const body = parse(
    z.object({ roleName: z.string().trim().min(1, 'Role name is required').max(100), description: optionalText(255), permissions: permissionIds.optional() }),
    req.body,
  );

  const { data: role, error } = await db
    .from('roles')
    .insert({ tenant_id: tenantId, role_name: body.roleName, description: body.description ?? null, status: 'ACTIVE' })
    .select()
    .single();
  if (error || !role) throw error;

  if (body.permissions?.length) {
    await db
      .from('role_permissions')
      .insert(body.permissions.map((permission_id) => ({ role_id: role.role_id, permission_id, is_allowed: true })));
  }

  res.status(201).json({ message: 'Role created successfully', role });
}

/** All available permissions grouped by module, for building the role-editor checkbox UI. */
export async function listPermissions(_req: Request, res: Response) {
  const { data, error } = await db
    .from('modules')
    .select('module_id, module_name, module_code, sort_order, permissions(permission_id, permission_name, permission_code, description)')
    .eq('status', 'ACTIVE')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  res.json({ data });
}

export async function getById(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const id = uuid(req.params.id);

  const { data: role, error } = await db
    .from('roles')
    .select('*, role_permissions(permission_id, is_allowed, permissions(permission_code, permission_name))')
    .eq('role_id', id)
    .eq('tenant_id', tenantId)
    .maybeSingle();
  if (error) throw error;
  if (!role) throw notFound('Role not found');

  res.json({ data: role });
}

export async function update(req: Request, res: Response) {
  const { tenantId, userId } = tenantCtx(req);
  await assertTenantOwner(tenantId, userId);
  const id = uuid(req.params.id);
  // Ownership must be proven BEFORE touching role_permissions, which has no tenant column of its own.
  await assertRoleInTenant(id, tenantId);

  const body = parse(
    z.object({
      roleName: z.string().trim().min(1).max(100).optional(),
      description: optionalText(255),
      status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
      permissions: permissionIds.optional(),
    }),
    req.body,
  );

  const update: Record<string, unknown> = {};
  if (body.roleName) update.role_name = body.roleName;
  if (body.description !== undefined) update.description = body.description;
  if (body.status) update.status = body.status;
  if (Object.keys(update).length > 0) {
    const { error } = await db.from('roles').update(update).eq('role_id', id).eq('tenant_id', tenantId);
    if (error) throw error;
  }

  if (body.permissions) {
    await db.from('role_permissions').delete().eq('role_id', id);
    if (body.permissions.length) {
      await db.from('role_permissions').insert(body.permissions.map((permission_id) => ({ role_id: id, permission_id, is_allowed: true })));
    }
  }

  res.json({ message: 'Role updated successfully' });
}

export async function remove(req: Request, res: Response) {
  const { tenantId, userId } = tenantCtx(req);
  await assertTenantOwner(tenantId, userId);
  const id = uuid(req.params.id);
  await assertRoleInTenant(id, tenantId);

  const { count } = await db.from('user_roles').select('*', { count: 'exact', head: true }).eq('role_id', id);
  if (count && count > 0) throw badRequest('Cannot delete role assigned to users');

  const { error } = await db.from('roles').delete().eq('role_id', id).eq('tenant_id', tenantId);
  if (error) throw error;

  res.json({ message: 'Role deleted successfully' });
}
