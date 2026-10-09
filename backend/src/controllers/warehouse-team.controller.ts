import type { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../lib/supabase.js';
import { badRequest, notFound, parse, uuid } from '../lib/http.js';
import { hashPassword, validatePasswordStrength } from '../lib/password.js';
import { emailField } from '../lib/validation.js';
import { tenantCtx } from '../middleware/auth.js';
import { assertOwned } from '../services/ownership.js';
import { invalidateEtaCaches } from '../services/eta.js';

const EMPLOYEE_COLUMNS = 'employee_id, warehouse_id, full_name, email, is_active, last_login, created_date';

const passwordField = z.string().superRefine((value, ctx) => {
  const check = validatePasswordStrength(value);
  if (!check.isValid) ctx.addIssue({ code: 'custom', message: check.message });
});

// ---------------------------------------------------------------------------------------------
// Employees (credentials the merchant hands to warehouse staff)
// ---------------------------------------------------------------------------------------------

export async function listEmployees(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const warehouseId = uuid(req.params.id);
  await assertOwned('warehouses', warehouseId, tenantId, 'warehouse');
  const { data, error } = await db
    .from('warehouse_employees')
    .select(EMPLOYEE_COLUMNS)
    .eq('tenant_id', tenantId)
    .eq('warehouse_id', warehouseId)
    .order('created_date', { ascending: false });
  if (error) throw error;
  res.json({ data });
}

export async function createEmployee(req: Request, res: Response) {
  const { tenantId, userId } = tenantCtx(req);
  const warehouseId = uuid(req.params.id);
  await assertOwned('warehouses', warehouseId, tenantId, 'warehouse');
  const body = parse(z.object({ fullName: z.string().trim().min(2).max(150), email: emailField, password: passwordField }), req.body);

  const { data, error } = await db
    .from('warehouse_employees')
    .insert({
      tenant_id: tenantId,
      warehouse_id: warehouseId,
      full_name: body.fullName,
      email: body.email,
      password_hash: await hashPassword(body.password),
      created_by: userId,
    })
    .select(EMPLOYEE_COLUMNS)
    .single();
  if (error) {
    if (error.code === '23505') throw badRequest('Someone already uses this email to sign in. Use a different email for this employee.');
    throw error;
  }
  res.status(201).json({ message: 'Employee created', data });
}

export async function updateEmployee(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const warehouseId = uuid(req.params.id);
  const employeeId = uuid(req.params.employeeId, 'employee id');
  const body = parse(
    z.object({ fullName: z.string().trim().min(2).max(150).optional(), isActive: z.boolean().optional(), password: passwordField.optional() }),
    req.body,
  );

  const { data: current } = await db
    .from('warehouse_employees')
    .select('employee_id, token_version')
    .eq('employee_id', employeeId)
    .eq('warehouse_id', warehouseId)
    .eq('tenant_id', tenantId)
    .maybeSingle();
  if (!current) throw notFound('Employee not found');

  const update: Record<string, unknown> = {};
  if (body.fullName !== undefined) update.full_name = body.fullName;
  if (body.isActive !== undefined) update.is_active = body.isActive;
  if (body.password !== undefined) update.password_hash = await hashPassword(body.password);
  // Signing the employee out of every device whenever their access changes.
  if (body.password !== undefined || body.isActive === false) update.token_version = current.token_version + 1;
  if (Object.keys(update).length === 0) throw badRequest('Nothing to update');

  const { data, error } = await db.from('warehouse_employees').update(update).eq('employee_id', employeeId).eq('tenant_id', tenantId).select(EMPLOYEE_COLUMNS).single();
  if (error) throw error;
  res.json({ message: 'Employee updated', data });
}

export async function removeEmployee(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const { error } = await db
    .from('warehouse_employees')
    .delete()
    .eq('employee_id', uuid(req.params.employeeId, 'employee id'))
    .eq('warehouse_id', uuid(req.params.id))
    .eq('tenant_id', tenantId);
  if (error) throw error;
  res.json({ success: true });
}

// ---------------------------------------------------------------------------------------------
// Shipping routes: known transit times from this warehouse to a state or PIN-code prefix
// ---------------------------------------------------------------------------------------------

export async function listRoutes(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const warehouseId = uuid(req.params.id);
  await assertOwned('warehouses', warehouseId, tenantId, 'warehouse');
  const { data, error } = await db
    .from('warehouse_routes')
    .select('route_id, destination, transit_min_days, transit_max_days')
    .eq('tenant_id', tenantId)
    .eq('warehouse_id', warehouseId)
    .order('destination');
  if (error) throw error;
  res.json({ data });
}

const routesSchema = z.object({
  routes: z
    .array(
      z
        .object({
          destination: z.string().trim().toLowerCase().min(2).max(60),
          minDays: z.coerce.number().int().min(0).max(60),
          maxDays: z.coerce.number().int().min(0).max(90),
        })
        .refine((r) => r.maxDays >= r.minDays, 'Slowest days must not be below fastest days'),
    )
    .max(100),
});

/** Replaces the whole route table of a warehouse. */
export async function saveRoutes(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const warehouseId = uuid(req.params.id);
  await assertOwned('warehouses', warehouseId, tenantId, 'warehouse');
  const { routes } = parse(routesSchema, req.body);

  const unique = new Map(routes.map((r) => [r.destination, r]));
  await db.from('warehouse_routes').delete().eq('tenant_id', tenantId).eq('warehouse_id', warehouseId);
  if (unique.size) {
    const { error } = await db.from('warehouse_routes').insert(
      [...unique.values()].map((r) => ({ tenant_id: tenantId, warehouse_id: warehouseId, destination: r.destination, transit_min_days: r.minDays, transit_max_days: r.maxDays })),
    );
    if (error) throw error;
  }
  await invalidateEtaCaches(warehouseId);
  res.json({ message: 'Routes saved', count: unique.size });
}
