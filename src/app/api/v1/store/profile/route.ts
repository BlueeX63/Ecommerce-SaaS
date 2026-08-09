import { NextResponse } from 'next/server';
import { withStoreAuth } from '@/lib/auth/store-auth';
import { getAdminClient } from '@/lib/supabase/admin';

export async function GET(req: Request) {
  return withStoreAuth(req, async (req, session) => {
    const { customerId, tenantId } = session;
    const supabase = getAdminClient();

    const { data: customer, error } = await supabase
      .from('customers')
      .select('first_name, last_name, phone_number, email')
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(customer, { status: 200 });
  });
}
