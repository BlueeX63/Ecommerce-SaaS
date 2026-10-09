import type { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../lib/supabase.js';
import { badRequest, notFound, parse, uuid } from '../lib/http.js';
import { optionalNumber, optionalText } from '../lib/validation.js';
import { tenantCtx } from '../middleware/auth.js';
import { geocode, isValidPoint } from '../services/geo.js';

const warehouseFields = {
  warehouseName: z.string().trim().min(1, 'Warehouse name is required').max(100),
  addressLine1: optionalText(255),
  city: optionalText(100),
  state: optionalText(100),
  postalCode: optionalText(20),
  country: optionalText(100),
  latitude: optionalNumber(-90, 90),
  longitude: optionalNumber(-180, 180),
  dispatchHours: optionalNumber(0, 24 * 14),
  dailyCapacity: optionalNumber(1, 100_000),
};

export async function list(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const { data, error } = await db
    .from('warehouses')
    .select('*, warehouse_employees(count)')
    .eq('tenant_id', tenantId)
    .order('created_date', { ascending: true });
  if (error) throw error;
  res.json({ data });
}

/**
 * Coordinates are what delivery estimates are computed from. If the merchant didn't pin the warehouse
 * themselves we look the address up, so a plain address is enough.
 */
async function resolveCoordinates(input: { addressLine1?: string; city?: string; state?: string; postalCode?: string; country?: string }) {
  if (!input.postalCode && !input.city) return null;
  return geocode({ line1: input.addressLine1, city: input.city, state: input.state, postalCode: input.postalCode, country: input.country });
}

export async function create(req: Request, res: Response) {
  const { tenantId, userId } = tenantCtx(req);
  const body = parse(z.object(warehouseFields), req.body);

  let latitude = body.latitude;
  let longitude = body.longitude;
  if (latitude === undefined || longitude === undefined) {
    const point = await resolveCoordinates(body);
    latitude = point?.lat;
    longitude = point?.lng;
  }
  if ((latitude !== undefined || longitude !== undefined) && !isValidPoint(latitude, longitude)) throw badRequest('Invalid coordinates');

  const { count: existing } = await db.from('warehouses').select('warehouse_id', { count: 'exact', head: true }).eq('tenant_id', tenantId);
  const isFirst = (existing ?? 0) === 0;

  const { data, error } = await db
    .from('warehouses')
    .insert({
      tenant_id: tenantId,
      warehouse_name: body.warehouseName,
      address_line_1: body.addressLine1 ?? null,
      city: body.city ?? null,
      state_province: body.state ?? null,
      postal_code: body.postalCode ?? null,
      country: body.country ?? null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      dispatch_hours: Math.round(body.dispatchHours ?? 24),
      daily_capacity: Math.round(body.dailyCapacity ?? 50),
      is_primary: isFirst,
      created_by: userId,
    })
    .select()
    .single();
  if (error) throw error;

  res.status(201).json({ message: 'Warehouse created successfully', data, located: latitude !== undefined });
}

export async function update(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const id = uuid(req.params.id);
  const body = parse(z.object({ ...warehouseFields, warehouseName: warehouseFields.warehouseName.optional(), isActive: z.boolean().optional() }), req.body);

  const { data: current } = await db.from('warehouses').select('*').eq('warehouse_id', id).eq('tenant_id', tenantId).maybeSingle();
  if (!current) throw notFound('Warehouse not found');

  const update: Record<string, unknown> = {};
  if (body.warehouseName !== undefined) update.warehouse_name = body.warehouseName;
  if (body.addressLine1 !== undefined) update.address_line_1 = body.addressLine1;
  if (body.city !== undefined) update.city = body.city;
  if (body.state !== undefined) update.state_province = body.state;
  if (body.postalCode !== undefined) update.postal_code = body.postalCode;
  if (body.country !== undefined) update.country = body.country;
  if (body.dispatchHours !== undefined) update.dispatch_hours = Math.round(body.dispatchHours);
  if (body.dailyCapacity !== undefined) update.daily_capacity = Math.round(body.dailyCapacity);
  if (body.isActive !== undefined) update.is_active = body.isActive;

  if (body.latitude !== undefined && body.longitude !== undefined) {
    if (!isValidPoint(body.latitude, body.longitude)) throw badRequest('Invalid coordinates');
    update.latitude = body.latitude;
    update.longitude = body.longitude;
  } else if (['addressLine1', 'city', 'state', 'postalCode', 'country'].some((k) => (body as Record<string, unknown>)[k] !== undefined)) {
    // Address changed without an explicit pin - re-locate it.
    const point = await resolveCoordinates({
      addressLine1: body.addressLine1 ?? current.address_line_1 ?? undefined,
      city: body.city ?? current.city ?? undefined,
      state: body.state ?? current.state_province ?? undefined,
      postalCode: body.postalCode ?? current.postal_code ?? undefined,
      country: body.country ?? current.country ?? undefined,
    });
    if (point) {
      update.latitude = point.lat;
      update.longitude = point.lng;
    }
  }
  if (Object.keys(update).length === 0) throw badRequest('Nothing to update');

  const { data, error } = await db.from('warehouses').update(update).eq('warehouse_id', id).eq('tenant_id', tenantId).select('*').maybeSingle();
  if (error) throw error;
  if (!data) throw notFound('Warehouse not found');

  res.json({ message: 'Warehouse updated successfully', data });
}
