import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const jwtSecret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET;
if (!jwtSecret) {
  throw new Error('FATAL: JWT_SECRET or SUPABASE_JWT_SECRET must be set for store auth.');
}
const JWT_SECRET = new TextEncoder().encode(jwtSecret);

async function getCustomerSession(slug: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('store_session')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload; // { sub: customerId, tenantId: tenantId }
  } catch (e) {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 });

    const session = await getCustomerSession(slug);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('tenant_id', session.tenantId)
      .eq('customer_id', session.sub)
      .order('created_date', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { slug, items, subtotal, taxTotal, shippingTotal, discountTotal, grandTotal, shippingDetails, deliveryOptionId } = body;

    const session = await getCustomerSession(slug);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getAdminClient();
    const orderNumber = 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    const { data: order, error: orderError } = await supabase.from('orders').insert({
      tenant_id: session.tenantId,
      customer_id: session.sub,
      order_number: orderNumber,
      status: 'PENDING',
      subtotal,
      tax_total: taxTotal,
      shipping_total: shippingTotal,
      discount_total: discountTotal,
      grand_total: grandTotal,
      shipping_address_line_1: shippingDetails?.address,
      shipping_city: 'City', 
      shipping_country: 'Country',
      delivery_option_id: deliveryOptionId || null
    }).select().single();

    if (orderError) throw orderError;

    const orderItems = items.map((item: any) => ({
      order_id: order.order_id,
      product_name: item.product?.name || item.name,
      quantity: item.quantity,
      unit_price: item.product?.price || item.price,
      total_price: (item.product?.price || item.price) * item.quantity
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) throw itemsError;

    return NextResponse.json({ success: true, order_id: order.order_id, order_number: orderNumber });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
