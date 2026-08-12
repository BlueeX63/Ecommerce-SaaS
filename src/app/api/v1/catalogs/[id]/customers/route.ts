import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth/session';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: catalogId } = await params;
    const db = getAdminClient();
    
    // First verify the catalog belongs to the tenant
    const { data: catalog, error: catalogError } = await db.from('catalogs')
      .select('catalog_id')
      .eq('catalog_id', catalogId)
      .eq('tenant_id', session.tenantId)
      .single();

    if (catalogError || !catalog) {
      return NextResponse.json({ error: 'Catalog not found or unauthorized' }, { status: 404 });
    }

    const { data: catalogCustomers, error } = await db.from('catalog_customers')
      .select('*, customers(first_name, last_name, email)')
      .eq('catalog_id', catalogId)
      .order('added_date', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data: catalogCustomers });
  } catch (error) {
    console.error('Fetch catalog customers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: catalogId } = await params;
    const body = await req.json();
    const db = getAdminClient();
    
    // Verify catalog ownership
    const { data: catalog, error: catalogError } = await db.from('catalogs')
      .select('catalog_id')
      .eq('catalog_id', catalogId)
      .eq('tenant_id', session.tenantId)
      .single();

    if (catalogError || !catalog) {
      return NextResponse.json({ error: 'Catalog not found or unauthorized' }, { status: 404 });
    }

    if (!body.customerId && !body.phoneNumber) {
      return NextResponse.json({ error: 'Customer ID or Phone Number is required' }, { status: 400 });
    }

    const insertData: any = { catalog_id: catalogId };
    if (body.customerId) insertData.customer_id = body.customerId;
    if (body.phoneNumber) insertData.phone_number = body.phoneNumber;

    // Check if customer is already assigned to this catalog to avoid duplicate constraint errors
    let conflictClause = 'catalog_id,customer_id';
    if (body.phoneNumber && !body.customerId) {
        conflictClause = 'catalog_id,phone_number';
    }

    const { data: catalogCustomer, error } = await db.from('catalog_customers')
      .upsert(insertData, { onConflict: conflictClause })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: 'Customer added to catalog', data: catalogCustomer }, { status: 201 });
  } catch (error) {
    console.error('Add catalog customer error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
