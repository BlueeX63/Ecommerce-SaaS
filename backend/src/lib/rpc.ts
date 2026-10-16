import { db } from './supabase.js';
import { ApiError } from './http.js';

/**
 * Calls one of the atomic SQL functions (see migrations/022). The functions signal business failures with
 * `RAISE EXCEPTION '<CODE>'`, which arrive here as `error.message`; each code maps to a status and a message
 * written for the person using the screen. Deadlocks / serialization failures (Postgres picks a victim when two
 * transactions collide) are retried a couple of times, since the function simply runs again on fresh data.
 */
const KNOWN: Record<string, (detail: string | undefined) => { status: number; message: string }> = {
  INSUFFICIENT_STOCK: (detail) => ({
    status: 409,
    message: detail && detail !== 'Insufficient stock' && detail !== 'Stock cannot be negative' ? `Not enough stock of "${detail}" at that warehouse.` : detail || 'Insufficient stock',
  }),
  ORDER_NOT_FOUND: () => ({ status: 404, message: 'Order not found' }),
  ORDER_LOCKED: (detail) => ({ status: 409, message: `This order is ${String(detail ?? 'closed').toLowerCase().replace(/_/g, ' ')}, so it can no longer be moved.` }),
  ORDER_CHANGED: () => ({ status: 409, message: 'Someone else just changed this order. Refresh and try again.' }),
  ORDER_UNCHANGED: () => ({ status: 409, message: 'The order is already with that warehouse.' }),
  WAREHOUSE_NOT_FOUND: () => ({ status: 404, message: 'Warehouse not found' }),
  WAREHOUSE_INACTIVE: () => ({ status: 409, message: 'That warehouse is switched off.' }),
  VARIANT_NOT_FOUND: () => ({ status: 400, message: 'Invalid product' }),
  BAD_REQUEST: () => ({ status: 400, message: 'Invalid request' }),
};

const RETRYABLE = new Set(['40P01', '40001']);

export function mapRpcError(error: { message?: string; code?: string; details?: string | null }): ApiError {
  const known = KNOWN[String(error.message ?? '')];
  if (known) {
    const { status, message } = known(error.details ?? undefined);
    return new ApiError(status, message, undefined, String(error.message));
  }
  console.error('[rpc] unexpected database error', { code: error.code, message: error.message });
  return new ApiError(500, 'Something went wrong. Please try again.');
}

export async function callRpc<T = unknown>(name: string, args: Record<string, unknown>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const { data, error } = await db.rpc(name, args);
    if (!error) return data as T;
    if (RETRYABLE.has(String(error.code)) && attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, 15 * (attempt + 1) + Math.random() * 25));
      continue;
    }
    throw mapRpcError(error);
  }
}
