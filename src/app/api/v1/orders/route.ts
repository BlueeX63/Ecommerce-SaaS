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
    
    const { data: orders, error, count } = await db.from('orders')
      .select('*, customers(first_name, last_name, email), dealers(company_name)', { count: 'exact' })
      .eq('tenant_id', session.tenantId)
      .order('created_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      data: orders,
      meta: {
        total: count,
        page,
        limit,
        totalPages: count ? Math.ceil(count / limit) : 0
      }
    });
  } catch (error) {
    console.error('Fetch orders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const db = await getDbClient();
    
    // Minimal validation
    if (!body.orderNumber || !body.grandTotal) {
      return NextResponse.json({ error: 'Order number and grand total are required' }, { status: 400 });
    }

    // In a real scenario, this should be a Postgres transaction (RPC) to insert order AND order_items
    const { data: order, error } = await db.from('orders')
      .insert({
        tenant_id: session.tenantId,
        customer_id: body.customerId,
        dealer_id: body.dealerId,
        order_number: body.orderNumber,
        status: body.status || 'PENDING',
        payment_status: body.paymentStatus || 'UNPAID',
        fulfillment_status: body.fulfillmentStatus || 'UNFULFILLED',
        subtotal: body.subtotal,
        tax_total: body.taxTotal,
        shipping_total: body.shippingTotal,
        discount_total: body.discountTotal,
        grand_total: body.grandTotal,
        created_by: session.userId
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Order number already exists' }, { status: 400 });
      }
      throw error;
    }

    // Insert order items if provided
    if (body.items && body.items.length > 0) {
      const items = body.items.map((item: any) => ({
        order_id: order.order_id,
        variant_id: item.variantId,
        product_name: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.quantity * item.unitPrice
      }));
      
      const { error: itemsError } = await db.from('order_items').insert(items);
      if (itemsError) throw itemsError;
    }

    return NextResponse.json({ message: 'Order created successfully', data: order }, { status: 201 });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
