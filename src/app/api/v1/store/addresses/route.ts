import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { withStoreAuth } from '@/lib/auth/store-auth';

export async function GET(req: Request) {
  return withStoreAuth(req, async (req, session) => {
    const supabase = getAdminClient();
    
    const { data: addresses, error } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('tenant_id', session.tenantId)
      .eq('customer_id', session.customerId || session.sub)
      .order('is_default', { ascending: false });

    if (error) {
      console.error('Error fetching addresses:', error);
      return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
    }

    return NextResponse.json({ addresses });
  });
}

export async function POST(req: Request) {
  return withStoreAuth(req, async (req, session) => {
    try {
      const body = await req.json();
      const { address_line_1, address_line_2, city, state, postal_code, country, is_default } = body;

      if (!address_line_1 || !city || !state || !postal_code || !country) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      const supabase = getAdminClient();
      const customerId = session.customerId || session.sub;

      if (is_default) {
        // Unset previous defaults
        await supabase
          .from('customer_addresses')
          .update({ is_default: false })
          .eq('tenant_id', session.tenantId)
          .eq('customer_id', customerId);
      }

      const { data: address, error } = await supabase
        .from('customer_addresses')
        .insert({
          tenant_id: session.tenantId,
          customer_id: customerId,
          address_line_1,
          address_line_2,
          city,
          state,
          postal_code,
          country,
          is_default: is_default || false
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating address:', error);
        return NextResponse.json({ error: 'Failed to create address' }, { status: 500 });
      }

      return NextResponse.json({ address }, { status: 201 });
    } catch (e) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
  });
}
