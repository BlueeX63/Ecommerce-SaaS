import type { RequestHandler } from 'express';
import { db } from '../lib/supabase.js';
import { unauthorized } from '../lib/http.js';
import { readEmployeeToken } from '../lib/employee-session.js';

/**
 * Requires a signed-in warehouse employee. The account is re-read on every request, so deactivating an
 * employee or resetting their password takes effect immediately, not when their cookie expires.
 */
export const requireEmployee: RequestHandler = async (req, _res, next) => {
  try {
    const token = await readEmployeeToken(req);
    if (!token) return next(unauthorized());

    const { data: employee } = await db
      .from('warehouse_employees')
      .select('employee_id, tenant_id, warehouse_id, full_name, email, is_active, token_version, warehouses!inner(is_active)')
      .eq('employee_id', token.employeeId)
      .maybeSingle();

    const warehouse: any = Array.isArray(employee?.warehouses) ? employee?.warehouses[0] : employee?.warehouses;
    if (!employee || !employee.is_active || employee.token_version !== token.tv || warehouse?.is_active === false) return next(unauthorized());

    req.employee = {
      employeeId: employee.employee_id,
      tenantId: employee.tenant_id,
      warehouseId: employee.warehouse_id,
      fullName: employee.full_name,
      email: employee.email,
    };
    next();
  } catch (error) {
    next(error);
  }
};
