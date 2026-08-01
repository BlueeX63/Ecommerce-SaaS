import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db/client';
import { getSession } from '@/lib/auth/session';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await getDbClient();
    
    const { data: order, error } = await db.from('orders')
      .select('*, customers(*), dealers(*), order_items(*), fulfillments(*)')
      .eq('order_id', id)
      .eq('tenant_id', session.tenantId)
      .single();

    if (error || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    return NextResponse.json({ data: order });
  } catch (error) {
    console.error('Fetch order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const db = await getDbClient();
    
    const { error } = await db.from('orders')
      .update({
        status: body.status,
        payment_status: body.paymentStatus,
        fulfillment_status: body.fulfillmentStatus,
        notes: body.notes
      })
      .eq('order_id', id)
      .eq('tenant_id', session.tenantId);

    if (error) throw error;

    return NextResponse.json({ message: 'Order updated successfully' });
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
