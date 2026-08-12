import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { withStoreAuth } from '@/lib/auth/store-auth';

export async function GET(req: Request) {
  return withStoreAuth(req, async (req, session) => {
    const supabase = getAdminClient();
    const customerId = session.customerId || session.sub;

    // Get cart
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('cart_id, cart_items(cart_item_id, product_id, variant_id, quantity)')
      .eq('tenant_id', session.tenantId)
      .eq('customer_id', customerId)
      .maybeSingle();

    if (cartError) {
      return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
    }

    if (!cart) {
      return NextResponse.json({ items: [] });
    }

    return NextResponse.json({ items: cart.cart_items });
  });
}

export async function POST(req: Request) {
  return withStoreAuth(req, async (req, session) => {
    try {
      const body = await req.json();
      const { product_id, variant_id, quantity } = body;

      if (!product_id || !quantity) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      const supabase = getAdminClient();
      const customerId = session.customerId || session.sub;

      // Find or create cart
      let { data: cart, error: cartError } = await supabase
        .from('carts')
        .select('cart_id')
        .eq('tenant_id', session.tenantId)
        .eq('customer_id', customerId)
        .maybeSingle();

      if (!cart) {
        const { data: newCart, error: createError } = await supabase
          .from('carts')
          .insert({ tenant_id: session.tenantId, customer_id: customerId })
          .select('cart_id')
          .single();
        
        if (createError) throw createError;
        cart = newCart;
      }

      // Add or update cart item
      // Check if item exists
      const { data: existingItem, error: findError } = await supabase
        .from('cart_items')
        .select('cart_item_id, quantity')
        .eq('cart_id', cart.cart_id)
        .eq('product_id', product_id)
        .eq('variant_id', variant_id || null)
        .maybeSingle();

      if (existingItem) {
        // Update quantity
        const { data: updated, error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + quantity })
          .eq('cart_item_id', existingItem.cart_item_id)
          .select()
          .single();
          
        if (updateError) throw updateError;
        return NextResponse.json({ item: updated });
      } else {
        // Insert new item
        const { data: inserted, error: insertError } = await supabase
          .from('cart_items')
          .insert({
            cart_id: cart.cart_id,
            product_id,
            variant_id: variant_id || null,
            quantity
          })
          .select()
          .single();
          
        if (insertError) throw insertError;
        return NextResponse.json({ item: inserted }, { status: 201 });
      }

    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
  });
}

export async function DELETE(req: Request) {
  return withStoreAuth(req, async (req, session) => {
    const { searchParams } = new URL(req.url);
    const cart_item_id = searchParams.get('item_id');

    if (!cart_item_id) {
       return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const customerId = session.customerId || session.sub;

    // First verify the item belongs to this customer's cart
    const { data: cart } = await supabase
      .from('carts')
      .select('cart_id')
      .eq('tenant_id', session.tenantId)
      .eq('customer_id', customerId)
      .maybeSingle();

    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    const { error, count } = await supabase
      .from('cart_items')
      .delete({ count: 'exact' })
      .eq('cart_item_id', cart_item_id)
      .eq('cart_id', cart.cart_id);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
    }

    if (count === 0) {
      return NextResponse.json({ error: 'Item not found in your cart' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  });
}
