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
    
    const { data: dealers, error, count } = await db.from('dealers')
      .select('*, dealer_branches(branch_name, city)', { count: 'exact' })
      .eq('tenant_id', session.tenantId)
      .order('created_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      data: dealers,
      meta: {
        total: count,
        page,
        limit,
        totalPages: count ? Math.ceil(count / limit) : 0
      }
    });
  } catch (error) {
    console.error('Fetch dealers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const db = await getDbClient();
    
    if (!body.companyName) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    const { data: dealer, error } = await db.from('dealers')
      .insert({
        tenant_id: session.tenantId,
        company_name: body.companyName,
        tax_id: body.taxId,
        contact_name: body.contactName,
        contact_email: body.contactEmail,
        contact_phone: body.contactPhone,
        payment_terms: body.paymentTerms,
        credit_limit: body.creditLimit || 0,
        created_by: session.userId
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Dealer company name already exists' }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ message: 'Dealer created successfully', data: dealer }, { status: 201 });
  } catch (error) {
    console.error('Create dealer error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
