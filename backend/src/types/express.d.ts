import type { MerchantSession } from '../lib/session.js';
import type { ShopperSession } from '../lib/store-session.js';
import type { SuperAdminSession } from '../lib/super-admin-session.js';
import type { EmployeeContext } from '../lib/employee-session.js';

export interface ShopperCustomer {
  customer_id: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  email: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Set by requireMerchant. */
      merchant?: MerchantSession;
      /** Set by requireShopper / optionalShopper. */
      shopper?: ShopperSession & { customer: ShopperCustomer };
      /** Set by requireSuperAdmin. */
      superAdmin?: SuperAdminSession;
      /** Set by requireEmployee. */
      employee?: EmployeeContext;
    }
  }
}
