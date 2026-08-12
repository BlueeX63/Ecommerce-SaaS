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
    
    const { data: catalogsData, error, count } = await db.from('catalogs')
      .select('*, tenant:tenant_id(code)', { count: 'exact' })
      .eq('tenant_id', session.tenantId)
      .order('created_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const catalogs = catalogsData?.map((c: any) => ({
      ...c,
      tenant_slug: c.tenant?.code,
      tenant: undefined
    })) || [];

    return NextResponse.json({
      data: catalogs,
      meta: {
        total: count,
        page,
        limit,
        totalPages: count ? Math.ceil(count / limit) : 0
      }
    });
  } catch (error) {
    console.error('Fetch catalogs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const db = getAdminClient();
    
    if (!body.catalogName || !body.slug) {
      return NextResponse.json({ error: 'Catalog name and slug are required' }, { status: 400 });
    }

    const { data: catalog, error } = await db.from('catalogs')
      .insert({
        tenant_id: session.tenantId,
        catalog_name: body.catalogName,
        slug: body.slug,
        catalog_type: body.catalogType || 'GENERAL',
        description: body.description || null,
        is_active: body.isActive !== undefined ? body.isActive : true,
        created_by: session.userId,
        updated_by: session.userId
      })
      .select('*, tenant:tenant_id(code)')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Catalog slug already exists' }, { status: 400 });
      }
      throw error;
    }

    const returnedCatalog = {
      ...catalog,
      tenant_slug: (catalog as any).tenant?.code,
      tenant: undefined
    };

    return NextResponse.json({ message: 'Catalog created successfully', data: returnedCatalog }, { status: 201 });
  } catch (error) {
    console.error('Create catalog error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
