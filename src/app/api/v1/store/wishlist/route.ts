import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { withStoreAuth } from '@/lib/auth/store-auth';

export async function GET(req: Request) {
  return withStoreAuth(req, async (req, session) => {
    const supabase = getAdminClient();
    const customerId = session.customerId || session.sub;

    const { data: wishlist, error: wishlistError } = await supabase
      .from('wishlists')
      .select('wishlist_id, wishlist_items(wishlist_item_id, product_id)')
      .eq('tenant_id', session.tenantId)
      .eq('customer_id', customerId)
      .maybeSingle();

    if (wishlistError) {
      return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
    }

    if (!wishlist) {
      return NextResponse.json({ items: [] });
    }

    return NextResponse.json({ items: wishlist.wishlist_items });
  });
}

export async function POST(req: Request) {
  return withStoreAuth(req, async (req, session) => {
    try {
      const body = await req.json();
      const { product_id } = body;

      if (!product_id) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      const supabase = getAdminClient();
      const customerId = session.customerId || session.sub;

      // Find or create wishlist
      let { data: wishlist, error: wishlistError } = await supabase
        .from('wishlists')
        .select('wishlist_id')
        .eq('tenant_id', session.tenantId)
        .eq('customer_id', customerId)
        .maybeSingle();

      if (!wishlist) {
        const { data: newWishlist, error: createError } = await supabase
          .from('wishlists')
          .insert({ tenant_id: session.tenantId, customer_id: customerId })
          .select('wishlist_id')
          .single();
        
        if (createError) throw createError;
        wishlist = newWishlist;
      }

      // Add to wishlist
      const { data: inserted, error: insertError } = await supabase
        .from('wishlist_items')
        .insert({
          wishlist_id: wishlist.wishlist_id,
          product_id
        })
        .select()
        .single();
        
      // Ignore unique constraint error if they try to add again
      if (insertError && insertError.code !== '23505') { 
        throw insertError;
      }

      return NextResponse.json({ success: true }, { status: 201 });
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
  });
}

export async function DELETE(req: Request) {
  return withStoreAuth(req, async (req, session) => {
    const { searchParams } = new URL(req.url);
    const product_id = searchParams.get('product_id');

    if (!product_id) {
       return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const supabase = getAdminClient();
    
    // get wishlist id
    const { data: wishlist } = await supabase
        .from('wishlists')
        .select('wishlist_id')
        .eq('tenant_id', session.tenantId)
        .eq('customer_id', session.customerId || session.sub)
        .maybeSingle();
    
    if (wishlist) {
        await supabase
        .from('wishlist_items')
        .delete()
        .eq('wishlist_id', wishlist.wishlist_id)
        .eq('product_id', product_id);
    }

    return NextResponse.json({ success: true });
  });
}
