import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db/client';
import { getSession } from '@/lib/auth/session';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await getDbClient();
    
    const { data: product, error } = await db.from('products')
      .select('*, categories(*), product_images(*), product_options(*, product_option_values(*)), product_variants(*)')
      .eq('product_id', id)
      .eq('tenant_id', session.tenantId)
      .single();

    if (error || !product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    return NextResponse.json({ data: product });
  } catch (error) {
    console.error('Fetch product error:', error);
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
    
    const { error } = await db.from('products')
      .update({
        product_name: body.productName,
        slug: body.slug,
        sku: body.sku,
        description: body.description,
        base_price: body.basePrice,
        compare_at_price: body.compareAtPrice,
        cost_price: body.costPrice,
        category_id: body.categoryId,
        status: body.status,
        three_d_model_url: body.threeDModelUrl,
        updated_by: session.userId,
        updated_date: new Date().toISOString()
      })
      .eq('product_id', id)
      .eq('tenant_id', session.tenantId);

    if (error) throw error;

    return NextResponse.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await getDbClient();
    
    // Soft delete by updating status to ARCHIVED
    const { error } = await db.from('products')
      .update({ status: 'ARCHIVED' })
      .eq('product_id', id)
      .eq('tenant_id', session.tenantId);

    if (error) throw error;

    return NextResponse.json({ message: 'Product archived successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
