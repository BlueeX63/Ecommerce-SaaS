import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth/session';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: catalogId } = await params;
    const db = getAdminClient();
    
    // First verify the catalog belongs to the tenant
    const { data: catalog, error: catalogError } = await db.from('catalogs')
      .select('catalog_id')
      .eq('catalog_id', catalogId)
      .eq('tenant_id', session.tenantId)
      .single();

    if (catalogError || !catalog) {
      return NextResponse.json({ error: 'Catalog not found or unauthorized' }, { status: 404 });
    }

    const { data: catalogProducts, error } = await db.from('catalog_products')
      .select('*, products(*)')
      .eq('catalog_id', catalogId)
      .order('added_date', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data: catalogProducts });
  } catch (error) {
    console.error('Fetch catalog products error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: catalogId } = await params;
    const body = await req.json();
    const db = getAdminClient();
    
    // Verify catalog ownership
    const { data: catalog, error: catalogError } = await db.from('catalogs')
      .select('catalog_id')
      .eq('catalog_id', catalogId)
      .eq('tenant_id', session.tenantId)
      .single();

    if (catalogError || !catalog) {
      return NextResponse.json({ error: 'Catalog not found or unauthorized' }, { status: 404 });
    }

    if (!body.productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const { data: catalogProduct, error } = await db.from('catalog_products')
      .upsert({
        catalog_id: catalogId,
        product_id: body.productId,
        price_override: body.priceOverride ? Number(body.priceOverride) : null,
        compare_at_price_override: body.compareAtPriceOverride ? Number(body.compareAtPriceOverride) : null,
        is_active: body.isActive !== undefined ? body.isActive : true
      }, { onConflict: 'catalog_id,product_id' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: 'Product added to catalog', data: catalogProduct }, { status: 201 });
  } catch (error) {
    console.error('Add catalog product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
