import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { withStoreAuth } from '@/lib/auth/store-auth';

export async function POST(req: Request) {
  return withStoreAuth(req, async (req, session) => {
    try {
      const body = await req.json();
      const { product_id, order_item_id, rating, comment, title } = body;

      if (!product_id || !order_item_id || !rating) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      const supabase = getAdminClient();
      const customerId = session.customerId || session.sub;

      // Verify the order item belongs to the customer and is fulfilled
      const { data: orderItem, error: orderError } = await supabase
        .from('order_items')
        .select('order_item_id, orders!inner(customer_id, fulfillment_status, tenant_id)')
        .eq('order_item_id', order_item_id)
        .eq('orders.customer_id', customerId)
        .eq('orders.tenant_id', session.tenantId)
        .single();

      if (orderError || !orderItem) {
        return NextResponse.json({ error: 'Order item not found or unauthorized' }, { status: 403 });
      }

      // Check if it's delivered/fulfilled
      const orderData = orderItem.orders as any;
      if (orderData.fulfillment_status !== 'FULFILLED') {
        return NextResponse.json({ error: 'You can only review products that have been delivered.' }, { status: 403 });
      }

      // Insert review
      const { data: review, error: reviewError } = await supabase
        .from('reviews')
        .insert({
          tenant_id: session.tenantId,
          product_id,
          customer_id: customerId,
          order_item_id,
          rating,
          title,
          comment,
          status: 'PENDING' // reviews might need approval
        })
        .select()
        .single();

      if (reviewError) {
        if (reviewError.code === '23505') {
          return NextResponse.json({ error: 'You have already reviewed this item.' }, { status: 409 });
        }
        throw reviewError;
      }

      return NextResponse.json({ success: true, review }, { status: 201 });
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
    }
  });
}
