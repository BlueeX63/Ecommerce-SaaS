import type { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../lib/supabase.js';
import { parse, uuid } from '../lib/http.js';
import { optionalText } from '../lib/validation.js';
import { tenantCtx } from '../middleware/auth.js';
import { clearClaim, getAssignmentInfo, moveOrder } from '../services/order-assignment.js';
import type { Actor } from '../services/activity.js';

async function merchantActor(userId: string): Promise<Actor> {
  const { data } = await db.from('users').select('first_name, last_name').eq('user_id', userId).maybeSingle();
  const name = [data?.first_name, data?.last_name].filter(Boolean).join(' ').trim();
  return { type: 'ADMIN', userId, name: name ? `${name} (store owner)` : 'Store owner' };
}

/** Which warehouses could take this order, and whether each has every item in stock. */
export async function getAssignment(req: Request, res: Response) {
  const { tenantId } = tenantCtx(req);
  res.json({ data: await getAssignmentInfo(tenantId, uuid(req.params.id)) });
}

const assignSchema = z.object({
  /** null puts the order back in the pool for any warehouse's employees to take. */
  warehouseId: z.string().uuid().nullable(),
  /** The warehouse the screen last saw (null = unassigned). The move is refused if the order has since changed hands. */
  expectedWarehouseId: z.string().uuid().nullable().optional(),
  note: optionalText(300),
});

/**
 * Moves an order to a warehouse that holds every item: the stock held for it at the old warehouse goes back, the
 * new warehouse's stock is reduced, and the new warehouse's team sees it. All in one database transaction - if the
 * new warehouse is short on any item nothing changes.
 */
export async function assign(req: Request, res: Response) {
  const { tenantId, userId } = tenantCtx(req);
  const orderId = uuid(req.params.id);
  const body = parse(assignSchema, req.body);

  const result = await moveOrder({
    tenantId,
    orderId,
    toWarehouseId: body.warehouseId,
    expectedFrom: body.expectedWarehouseId,
    actor: await merchantActor(userId),
    note: body.note,
  });
  res.json({
    message: body.warehouseId ? `${result.order_number} assigned` : `${result.order_number} is now open for any warehouse to take`,
    data: { orderId, warehouseId: result.to_warehouse_id, stockMoved: result.stock_moved },
  });
}

/** Clears the employee currently handling an order (for example when they are away) so a teammate can pick it up. */
export async function clearOrderClaim(req: Request, res: Response) {
  const { tenantId, userId } = tenantCtx(req);
  await clearClaim(tenantId, uuid(req.params.id), await merchantActor(userId));
  res.json({ message: 'Order is free for the team to pick up' });
}
