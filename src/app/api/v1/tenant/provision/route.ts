import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth/session';

function generateSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
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

    // 1. Update existing Tenant
    const { error: tenantError } = await db.from('tenant').update({
      tenant_name: formData.brandName,
      code: storeSlug,
      description: `Tenant for ${formData.brandName}`
    }).eq('tenant_id', tenantId);

    if (tenantError) throw tenantError;

    // 2. Upsert Tenant Branding
    const { error: brandingError } = await db.from('tenant_branding').upsert({
      tenant_id: tenantId,
      logo_url: formData.aboutImage || '',
      primary_color: formData.primaryColor || '#000000',
      secondary_color: '#ffffff'
    }, { onConflict: 'tenant_id' });

    if (brandingError) throw brandingError;

    // 3. Upsert Tenant Settings
    const { error: settingsError } = await db.from('tenant_settings').upsert({
      tenant_id: tenantId,
      setting_key: 'customization',
      setting_value: JSON.stringify({ ...formData, templateId })
    }, { onConflict: 'tenant_id,setting_key' });

    if (settingsError) throw settingsError;
    
    // 4. Upsert Tenant Domain
    const { error: domainError } = await db.from('tenant_domain').upsert({
      tenant_id: tenantId,
      domain: `${storeSlug}.your-saas.com`,
      is_primary: true
    }, { onConflict: 'domain' });

    if (domainError) throw domainError;

    return NextResponse.json({ success: true, storeSlug, tenantId });
  } catch (error: any) {
    console.error('Provisioning error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
