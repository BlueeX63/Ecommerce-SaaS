import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth/session';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const db = getAdminClient();
    
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
    const db = getAdminClient();
    
    // Minimal required fields
    if (!body.productName || !body.slug) {
      return NextResponse.json({ error: 'Product name and slug are required' }, { status: 400 });
    }
    if (!body.catalogs || body.catalogs.length === 0) {
      return NextResponse.json({ error: 'At least one catalog assignment is required to define pricing' }, { status: 400 });
    }

    let finalSlug = body.slug;
    
    // Check if slug exists
    const { data: existingSlug } = await db.from('products')
      .select('slug')
      .eq('tenant_id', session.tenantId)
      .eq('slug', finalSlug)
      .maybeSingle();
      
    if (existingSlug) {
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      finalSlug = `${finalSlug}-${randomSuffix}`;
    }

    const { data: product, error } = await db.from('products')
      .insert({
        tenant_id: session.tenantId,
        category_id: body.categoryId || null,
        product_name: body.productName,
        slug: finalSlug,
        sku: body.sku || null,
        description: body.description || null,
        base_price: 0, // Default to 0 since pricing is now strictly managed via catalog assignments
        compare_at_price: body.compareAtPrice ? Number(body.compareAtPrice) : null,
        cost_price: body.costPrice ? Number(body.costPrice) : null,
        status: body.status || 'DRAFT',
        three_d_model_url: body.threeDModelUrl || null,
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

    if (body.imageUrls && Array.isArray(body.imageUrls) && body.imageUrls.length > 0) {
      for (let i = 0; i < body.imageUrls.length; i++) {
        const { error: imageError } = await db.from('product_images').insert({
          product_id: product.product_id,
          image_url: body.imageUrls[i],
          is_primary: i === 0,
          sort_order: i + 1
        });

        if (imageError) {
          console.error('Failed to insert product image:', imageError);
        }
      }
    } else if (body.primaryImageUrl) {
      const { error: imageError } = await db.from('product_images').insert({
        product_id: product.product_id,
        image_url: body.primaryImageUrl,
        is_primary: true,
        sort_order: 1
      });

      if (imageError) {
        console.error('Failed to insert product image:', imageError);
      }
    }

    if (body.catalogs && Array.isArray(body.catalogs) && body.catalogs.length > 0) {
      for (const catalog of body.catalogs) {
        if (!catalog.catalogId) continue;
        const { error: catalogError } = await db.from('catalog_products').insert({
          catalog_id: catalog.catalogId,
          product_id: product.product_id,
          price_override: catalog.catalogPriceOverride ? Number(catalog.catalogPriceOverride) : null
        });
        if (catalogError) console.error(`Failed to assign product to catalog ${catalog.catalogId}:`, catalogError);
      }
    }

    return NextResponse.json({ message: 'Product created successfully', data: product }, { status: 201 });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
