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
    
    const { data: products, error, count } = await db.from('products')
      .select('*, categories(category_name), product_images(image_url, is_primary)', { count: 'exact' })
      .eq('tenant_id', session.tenantId)
      .order('created_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      data: products,
      meta: {
        total: count,
        page,
        limit,
        totalPages: count ? Math.ceil(count / limit) : 0
      }
    });
  } catch (error) {
    console.error('Fetch products error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const db = await getDbClient();
    
    // Minimal required fields
    if (!body.productName || !body.slug || !body.basePrice) {
      return NextResponse.json({ error: 'Product name, slug, and base price are required' }, { status: 400 });
    }

    const { data: product, error } = await db.from('products')
      .insert({
        tenant_id: session.tenantId,
        product_name: body.productName,
        slug: body.slug,
        sku: body.sku,
        description: body.description,
        base_price: body.basePrice,
        compare_at_price: body.compareAtPrice,
        cost_price: body.costPrice,
        category_id: body.categoryId,
        status: body.status || 'DRAFT',
        three_d_model_url: body.threeDModelUrl,
        created_by: session.userId,
        updated_by: session.userId
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Product slug or SKU already exists' }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ message: 'Product created successfully', data: product }, { status: 201 });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
