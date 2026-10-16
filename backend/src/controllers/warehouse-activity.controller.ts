import type { Request, Response } from 'express';
import { badRequest, parse, str, uuid } from '../lib/http.js';
import { tenantCtx } from '../middleware/auth.js';
import { ACTIVITY_ACTIONS, employeeSummary, listActivity, listStockHistory, type ActivityAction } from '../services/activity.js';
import { assertOwned } from '../services/ownership.js';
import { z } from 'zod';

const optionalId = (value: unknown, label: string) => {
  const v = str(value);
  return v ? uuid(v, label) : undefined;
};

/** Accepts `YYYY-MM-DD` (a day, in UTC) or a full ISO timestamp. `endExclusive` turns a bare date into the start of the next day. */
function dateParam(value: unknown, label: string, endExclusive = false): string | undefined {
  const v = str(value);
  if (!v) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const d = new Date(`${v}T00:00:00.000Z`);
    if (Number.isNaN(d.getTime())) throw badRequest(`Invalid ${label}`);
    if (endExclusive) d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString();
  }
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) throw badRequest(`Invalid ${label}`);
  return d.toISOString();
}

const limitParam = (value: unknown) => Math.min(100, Math.max(1, parseInt(str(value) ?? '30', 10) || 30));

/**
 * The feed of everything warehouse employees (and the owner) changed: stock counts with before/after, order status,
 * claims and reassignments. Filter by employee, warehouse, product, order or kind of action; newest first.
 */
export async function activity(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const actions = str(req.query.actions)
    ?.split(',')
    .map((a) => a.trim())
    .filter(Boolean);
  if (actions?.some((a) => !ACTIVITY_ACTIONS.includes(a as ActivityAction))) throw badRequest('Unknown action filter');
  const actorType = str(req.query.actor);
  if (actorType && actorType !== 'EMPLOYEE' && actorType !== 'ADMIN') throw badRequest('Invalid actor filter');

  const result = await listActivity(tenantId, {
    employeeId: optionalId(req.query.employeeId, 'employeeId'),
    warehouseId: optionalId(req.query.warehouseId, 'warehouseId'),
    productId: optionalId(req.query.productId, 'productId'),
    orderId: optionalId(req.query.orderId, 'orderId'),
    actorType: actorType as 'EMPLOYEE' | 'ADMIN' | undefined,
    actions: actions as ActivityAction[] | undefined,
    from: dateParam(req.query.from, 'from'),
    to: dateParam(req.query.to, 'to', true),
    cursor: str(req.query.cursor),
    limit: limitParam(req.query.limit),
  });
  res.json(result);
}

/** One row per employee for the last N days: actions, units added/removed, orders taken/updated, last seen. */
export async function summary(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const { days } = parse(z.object({ days: z.coerce.number().int().min(1).max(365).default(7) }), { days: str(req.query.days) });
  res.json({ days, data: await employeeSummary(tenantId, days) });
}

/** Every stock movement of one product across all warehouses, with who made it and the resulting quantity. */
export async function stockHistory(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  const productId = uuid(str(req.query.productId), 'productId');
  await assertOwned('products', productId, tenantId, 'product');
  res.json(
    await listStockHistory(tenantId, {
      productId,
      warehouseId: optionalId(req.query.warehouseId, 'warehouseId'),
      employeeId: optionalId(req.query.employeeId, 'employeeId'),
      cursor: str(req.query.cursor),
      limit: limitParam(req.query.limit),
    }),
  );
}
