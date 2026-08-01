import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db/client';
import { getSession } from '@/lib/auth/session';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const invoiceId = searchParams.get('invoiceId');
    const orderId = searchParams.get('orderId');

    const db = await getDbClient();
    
    let query = db.from('payments').select('*').eq('tenant_id', session.tenantId);

    if (invoiceId) query = query.eq('invoice_id', invoiceId);
    if (orderId) query = query.eq('order_id', orderId);

    const { data: payments, error } = await query.order('payment_date', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ data: payments });
  } catch (error) {
    console.error('Fetch payments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const db = await getDbClient();
    
    if (!body.amount || !body.paymentMethod) {
      return NextResponse.json({ error: 'Amount and payment method are required' }, { status: 400 });
    }

    const { data: payment, error } = await db.from('payments')
      .insert({
        tenant_id: session.tenantId,
        invoice_id: body.invoiceId || null,
        order_id: body.orderId || null,
        payment_method: body.paymentMethod,
        transaction_id: body.transactionId,
        amount: body.amount,
        status: body.status || 'COMPLETED',
        created_by: session.userId
      })
      .select()
      .single();

    if (error) throw error;

    // If invoice payment, we should update the invoice amount_paid in a transaction normally.
    // For this SaaS demo, we will execute a secondary query.
    if (body.invoiceId && body.status === 'COMPLETED') {
      const { data: inv } = await db.from('invoices').select('*').eq('invoice_id', body.invoiceId).single();
      if (inv) {
        const newPaid = Number(inv.amount_paid) + Number(body.amount);
        const newDue = Number(inv.grand_total) - newPaid;
        await db.from('invoices').update({
          amount_paid: newPaid,
          amount_due: newDue,
          status: newDue <= 0 ? 'PAID' : 'SENT'
        }).eq('invoice_id', body.invoiceId);
      }
    }

    return NextResponse.json({ message: 'Payment recorded successfully', data: payment }, { status: 201 });
  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
