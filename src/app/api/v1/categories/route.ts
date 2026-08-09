import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getAdminClient();
    const { data: categories, error } = await db.from('categories')
      .select('*')
      .eq('tenant_id', session.tenantId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    
    // Auto-seed categories from customization settings if empty
    if (categories && categories.length === 0) {
      const { data: settingsData } = await db.from('tenant_settings')
        .select('setting_value')
        .eq('tenant_id', session.tenantId)
        .eq('setting_key', 'customization')
        .maybeSingle();
        
      if (settingsData && settingsData.setting_value) {
        let customData: any = {};
        try {
          // Handle possible double-stringified JSON depending on how it was saved
          customData = typeof settingsData.setting_value === 'string' 
            ? JSON.parse(settingsData.setting_value) 
            : settingsData.setting_value;
          if (typeof customData === 'string') {
            customData = JSON.parse(customData);
          }
        } catch (e) {
          console.error('Error parsing customization settings', e);
        }

        const shopCategories = customData?.shopCategories || "";
        if (shopCategories) {
          const catsToInsert = shopCategories
            .split(',')
            .map((c: string) => c.trim())
            .filter((c: string) => c && c.toLowerCase() !== 'all');
            
          if (catsToInsert.length > 0) {
            const insertData = catsToInsert.map((c: string, index: number) => ({
              tenant_id: session.tenantId,
              category_name: c,
              slug: c.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
              sort_order: index,
              created_by: session.userId
            }));

            const { data: insertedCats, error: insertError } = await db.from('categories')
              .insert(insertData)
              .select('*')
              .order('sort_order', { ascending: true });

            if (!insertError && insertedCats) {
              return NextResponse.json({ data: insertedCats });
            }
          }
        }
      }
    }

    console.log("Categories returning:", categories);
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

    const db = getAdminClient();
    
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
