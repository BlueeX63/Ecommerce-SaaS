import type { CookieOptions, Request, Response } from 'express';
import { isProd } from '../config/env.js';
import { signToken, verifyToken } from './jwt.js';

export const EMPLOYEE_COOKIE = 'employee_session';
const TTL_MS = 12 * 60 * 60 * 1000;

interface EmployeeToken {
  employeeId: string;
  /** Matches warehouse_employees.token_version; bumping it there signs the employee out everywhere. */
  tv: number;
}

/** A signed-in warehouse employee, as loaded fresh from the database on every request. */
export interface EmployeeContext {
  employeeId: string;
  tenantId: string;
  warehouseId: string;
  fullName: string;
  email: string;
}

function cookieOptions(expires?: Date): CookieOptions {
  return { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/', ...(expires ? { expires } : {}) };
}

export async function issueEmployeeSession(res: Response, employeeId: string, tokenVersion: number) {
  const token = await signToken('employee-session', { employeeId, tv: tokenVersion }, '12h');
  res.cookie(EMPLOYEE_COOKIE, token, cookieOptions(new Date(Date.now() + TTL_MS)));
}

export async function readEmployeeToken(req: Request): Promise<EmployeeToken | null> {
  const payload = await verifyToken<EmployeeToken>('employee-session', req.cookies?.[EMPLOYEE_COOKIE]);
  if (!payload?.employeeId || typeof payload.tv !== 'number') return null;
  return { employeeId: payload.employeeId, tv: payload.tv };
}

export function clearEmployeeCookie(res: Response) {
  res.clearCookie(EMPLOYEE_COOKIE, cookieOptions());
}
