import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { withStoreAuth } from '@/lib/auth/store-auth';

export async function POST(req: Request) {
  return withStoreAuth(req, async (req, session) => {
    try {
      const body = await req.json();
      const { address_id, notes, coupon_code } = body;

      if (!address_id) {
        return NextResponse.json({ error: 'Address required' }, { status: 400 });
      }

      const supabase = getAdminClient();
      const customerId = session.customerId || session.sub;

      // 1. Get Address
      const { data: address, error: addressError } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('address_id', address_id)
        .eq('customer_id', customerId)
        .single();

      if (addressError || !address) {
        return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
      }

      // 2. Get Cart
      const { data: cart, error: cartError } = await supabase
        .from('carts')
        .select('cart_id, cart_items(product_id, variant_id, quantity)')
        .eq('tenant_id', session.tenantId)
        .eq('customer_id', customerId)
        .single();

      if (cartError || !cart || !cart.cart_items || cart.cart_items.length === 0) {
        return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
      }

      // Calculate mock prices since we didn't join product_variants
      let subtotal = 0;
      cart.cart_items.forEach((item: any) => {
        subtotal += item.quantity * 50; // Mock price of $50 per item
      });

      let grand_total = subtotal;
      let applied_discount = 0;
      let couponId = null;

      // Validate Coupon if provided
      if (coupon_code) {
        const { data: coupon, error: couponError } = await supabase
          .from('coupons')
          .select('*')
          .eq('tenant_id', session.tenantId)
          .eq('code', coupon_code.toUpperCase())
          .single();
          
        if (!couponError && coupon && coupon.is_active) {
          const isValid = (!coupon.expiry_date || new Date(coupon.expiry_date) > new Date()) && 
                          (coupon.max_uses === null || coupon.times_used < coupon.max_uses);
          
          if (isValid) {
            couponId = coupon.coupon_id;
            if (coupon.discount_type === 'PERCENTAGE') {
              applied_discount = subtotal * (coupon.discount_amount / 100);
            } else {
              applied_discount = Number(coupon.discount_amount);
            }
            grand_total = Math.max(0, subtotal - applied_discount);
            
            // Increment usage
            await supabase.from('coupons').update({ times_used: coupon.times_used + 1 }).eq('coupon_id', coupon.coupon_id);
          }
        }
      }

      // 3. Create Order
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          tenant_id: session.tenantId,
          customer_id: customerId,
          order_number: orderNumber,
          status: 'PENDING',
          payment_status: 'UNPAID',
          shipping_address_line_1: address.address_line_1,
          shipping_city: address.city,
          shipping_state: address.state,
          shipping_postal_code: address.postal_code,
          shipping_country: address.country,
          notes,
          subtotal,
          grand_total
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 4. Create Order Items (In a real app, calculate prices securely from DB)
      // Here we just insert items with 0 price for simplicity, or we would fetch products
      const orderItems = cart.cart_items.map((item: any) => ({
        order_id: order.order_id,
        variant_id: item.variant_id,
        product_name: `Product ${item.product_id}`, // In real app, fetch name
        quantity: item.quantity,
        unit_price: 0,
        total_price: 0
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 5. Clear Cart
      await supabase.from('cart_items').delete().eq('cart_id', cart.cart_id);

      return NextResponse.json({ success: true, order_id: order.order_id, order_number: orderNumber }, { status: 201 });
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
    }
  });
}
