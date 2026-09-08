import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth/session';

function generateSlug(name: string) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 40);
  return base + '-' + Math.random().toString(36).substring(2, 6);
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { templateId, formData } = await req.json();
    if (!templateId || !formData || !formData.brandName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getAdminClient();
    
    const storeSlug = generateSlug(formData.brandName);
    const tenantId = session.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant associated with user' }, { status: 400 });
    }

    // 1. Check if user has hit subscription limits
    const { count: storeCount } = await db.from('tenant').select('*', { count: 'exact', head: true }).eq('created_by', session.userId);
    // Simple check (ideally fetch plan limit from subscriptions table)
    if (storeCount && storeCount >= 10) { // e.g., max 10 stores
      return NextResponse.json({ error: 'Store limit reached for your subscription.' }, { status: 403 });
    }

    // 2. Insert NEW Tenant instead of updating
    const { data: newTenant, error: tenantError } = await db.from('tenant').insert({
      tenant_name: formData.brandName,
      code: storeSlug,
      description: `Tenant for ${formData.brandName}`,
      created_by: session.userId
    }).select('tenant_id').single();

    if (tenantError) throw tenantError;
    
    const newTenantId = newTenant.tenant_id;

    // 3. Upsert Tenant Branding
    const { error: brandingError } = await db.from('tenant_branding').upsert({
      tenant_id: newTenantId,
      logo_url: formData.logoUrl || formData.aboutHeroImage || '',
      primary_color: formData.primaryColor || '#000000',
      secondary_color: '#ffffff'
    }, { onConflict: 'tenant_id' });

    if (brandingError) throw brandingError;

    // 4. Upsert Tenant Settings
    const { error: settingsError } = await db.from('tenant_settings').upsert({
      tenant_id: newTenantId,
      setting_key: 'customization',
      setting_value: JSON.stringify({ ...formData, templateId })
    }, { onConflict: 'tenant_id,setting_key' });

    if (settingsError) throw settingsError;
    
    // 5. Upsert Tenant Domain
    const { error: domainError } = await db.from('tenant_domain').upsert({
      tenant_id: newTenantId,
      domain: `${storeSlug}.your-saas.com`,
      is_primary: true
    }, { onConflict: 'domain' });

    if (domainError) throw domainError;

    return NextResponse.json({ success: true, storeSlug, tenantId: newTenantId });
  } catch (error: any) {
    console.error('Provisioning error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error?.message || error }, { status: 500 });
  }
}
