import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getSession, encrypt } from '@/lib/auth/session';
import { cookies } from 'next/headers';
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, slug, template, customizationData } = await req.json();
    if (!name || !slug || !template) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getAdminClient();

    // 1. Check if user has hit subscription limits
    const { count: storeCount } = await db.from('tenant').select('*', { count: 'exact', head: true }).eq('created_by', session.userId);
    if (storeCount && storeCount >= 10) {
      return NextResponse.json({ error: 'Store limit reached for your subscription.' }, { status: 403 });
    }

    // Check if slug is taken
    const { data: existing } = await db.from('tenant').select('tenant_id').eq('code', slug).maybeSingle();
    if (existing) {
      return NextResponse.json({ error: 'Subdomain is already taken.' }, { status: 400 });
    }

    // 2. Insert NEW Tenant
    const { data: newTenant, error: tenantError } = await db.from('tenant').insert({
      tenant_name: name,
      code: slug,
      description: `Store for ${name}`,
      created_by: session.userId
    }).select('tenant_id').single();

    if (tenantError) throw tenantError;
    const newTenantId = newTenant.tenant_id;

    // 3. Upsert Tenant Settings
    const { error: settingsError } = await db.from('tenant_settings').upsert({
      tenant_id: newTenantId,
      setting_key: 'customization',
      setting_value: JSON.stringify(customizationData ? { ...customizationData, templateId: template } : { brandName: name, templateId: template })
    }, { onConflict: 'tenant_id,setting_key' });

    if (settingsError) throw settingsError;

    // 4. Create default catalog
    const { data: catalog, error: catalogError } = await db.from('catalogs').insert({
      tenant_id: newTenantId,
      catalog_name: 'Default Catalog',
      slug: 'default-catalog',
      description: 'Primary product catalog',
      is_active: true
    }).select('catalog_id').single();

    if (catalogError) throw catalogError;

    // 5. Create default category
    const { error: categoryError } = await db.from('categories').insert({
      tenant_id: newTenantId,
      category_name: 'All Products',
      slug: 'all-products',
      is_active: true
    });

    if (categoryError) throw categoryError;

    // 6. Automatically switch session to the new store
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const newSession = await encrypt({
      ...session,
      tenantId: newTenantId,
      expiresAt: expiresAt.toISOString(),
    });

    const cookieStore = await cookies();
    cookieStore.set('session', newSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: expiresAt,
      sameSite: 'lax',
      path: '/'
    });

    return NextResponse.json({ success: true, storeSlug: slug, tenantId: newTenantId });
  } catch (error: any) {
    console.error('Store creation error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error?.message || error }, { status: 500 });
  }
}
