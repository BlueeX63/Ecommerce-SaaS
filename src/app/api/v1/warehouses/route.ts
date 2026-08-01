import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db/client';
import { getSession } from '@/lib/auth/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await getDbClient();
    const { data: warehouses, error } = await db.from('warehouses')
      .select('*')
      .eq('tenant_id', session.tenantId)
      .order('created_date', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ data: warehouses });
  } catch (error) {
    console.error('Fetch warehouses error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { warehouseName, city, country } = await req.json();
    if (!warehouseName) return NextResponse.json({ error: 'Warehouse name is required' }, { status: 400 });

    const db = await getDbClient();
    
    const { data: warehouse, error } = await db.from('warehouses')
      .insert({
        tenant_id: session.tenantId,
        warehouse_name: warehouseName,
        city: city,
        country: country,
        created_by: session.userId
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: 'Warehouse created successfully', data: warehouse }, { status: 201 });
  } catch (error) {
    console.error('Create warehouse error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
