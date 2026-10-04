import type { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../lib/supabase.js';
import { badRequest, notFound, parse, uuid } from '../lib/http.js';
import { optionalText } from '../lib/validation.js';
import { tenantCtx } from '../middleware/auth.js';

export async function list(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const { data, error } = await db
    .from('warehouses')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_date', { ascending: false });
  if (error) throw error;
  res.json({ data });
}

export async function create(req: Request, res: Response) {
  const { tenantId, userId } = tenantCtx(req);
  const body = parse(
    z.object({
      warehouseName: z.string().trim().min(1, 'Warehouse name is required').max(200),
      city: optionalText(100),
      country: optionalText(100),
    }),
    req.body,
  );

  const { data, error } = await db
    .from('warehouses')
    .insert({
      tenant_id: tenantId,
      warehouse_name: body.warehouseName,
      city: body.city ?? null,
      country: body.country ?? null,
      created_by: userId,
    })
    .select()
    .single();
  if (error) throw error;

  res.status(201).json({ message: 'Warehouse created successfully', data });
}

export async function update(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const id = uuid(req.params.id);
  const body = parse(
    z.object({
      warehouseName: z.string().trim().min(1).max(200).optional(),
      city: optionalText(100),
      country: optionalText(100),
      isActive: z.boolean().optional(),
    }),
    req.body,
  );

  const update: Record<string, unknown> = {};
  if (body.warehouseName !== undefined) update.warehouse_name = body.warehouseName;
  if (body.city !== undefined) update.city = body.city;
  if (body.country !== undefined) update.country = body.country;
  if (body.isActive !== undefined) update.is_active = body.isActive;
  if (Object.keys(update).length === 0) throw badRequest('Nothing to update');

  const { data, error } = await db
    .from('warehouses')
    .update(update)
    .eq('warehouse_id', id)
    .eq('tenant_id', tenantId)
    .select('warehouse_id')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound('Warehouse not found');

  res.json({ message: 'Warehouse updated successfully' });
}
