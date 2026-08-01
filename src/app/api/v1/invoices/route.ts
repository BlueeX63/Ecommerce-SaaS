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
    
    const { data: invoices, error, count } = await db.from('invoices')
      .select('*, customers(first_name, last_name, email), dealers(company_name), orders(order_number)', { count: 'exact' })
      .eq('tenant_id', session.tenantId)
      .order('created_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      data: invoices,
      meta: {
        total: count,
        page,
        limit,
        totalPages: count ? Math.ceil(count / limit) : 0
      }
    });
  } catch (error) {
    console.error('Fetch invoices error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const db = await getDbClient();
    
    if (!body.invoiceNumber || !body.grandTotal) {
      return NextResponse.json({ error: 'Invoice number and grand total are required' }, { status: 400 });
    }

    const { data: invoice, error } = await db.from('invoices')
      .insert({
        tenant_id: session.tenantId,
        order_id: body.orderId || null,
        customer_id: body.customerId || null,
        dealer_id: body.dealerId || null,
        invoice_number: body.invoiceNumber,
        status: body.status || 'DRAFT',
        issue_date: body.issueDate || new Date().toISOString(),
        due_date: body.dueDate || null,
        subtotal: body.subtotal || 0,
        tax_total: body.taxTotal || 0,
        shipping_total: body.shippingTotal || 0,
        grand_total: body.grandTotal,
        amount_due: body.grandTotal,
        created_by: session.userId
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Invoice number already exists' }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ message: 'Invoice created successfully', data: invoice }, { status: 201 });
  } catch (error) {
    console.error('Create invoice error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
