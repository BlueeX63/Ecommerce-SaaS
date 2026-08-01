import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db/client';
import { getSession } from '@/lib/auth/session';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const db = await getDbClient();
    
    const { data: customers, error, count } = await db.from('customers')
      .select('*, customer_groups(group_name)', { count: 'exact' })
      .eq('tenant_id', session.tenantId)
      .order('created_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      data: customers,
      meta: {
        total: count,
        page,
        limit,
        totalPages: count ? Math.ceil(count / limit) : 0
      }
    });
  } catch (error) {
    console.error('Fetch customers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const db = await getDbClient();
    
    if (!body.firstName || !body.lastName || !body.email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const { data: customer, error } = await db.from('customers')
      .insert({
        tenant_id: session.tenantId,
        first_name: body.firstName,
        last_name: body.lastName,
        email: body.email,
        phone_number: body.phoneNumber,
        company_name: body.companyName,
        group_id: body.groupId || null,
        created_by: session.userId
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Customer email already exists' }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ message: 'Customer created successfully', data: customer }, { status: 201 });
  } catch (error) {
    console.error('Create customer error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
