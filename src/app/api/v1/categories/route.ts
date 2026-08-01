import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db/client';
import { getSession } from '@/lib/auth/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await getDbClient();
    const { data: categories, error } = await db.from('categories')
      .select('*')
      .eq('tenant_id', session.tenantId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ data: categories });
  } catch (error) {
    console.error('Fetch categories error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { categoryName, slug, description, parentCategoryId } = await req.json();
    if (!categoryName || !slug) return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });

    const db = await getDbClient();
    
    const { data: category, error } = await db.from('categories')
      .insert({
        tenant_id: session.tenantId,
        category_name: categoryName,
        slug: slug,
        description: description,
        parent_category_id: parentCategoryId || null,
        created_by: session.userId
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // unique violation
        return NextResponse.json({ error: 'Category slug already exists' }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ message: 'Category created successfully', data: category }, { status: 201 });
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
