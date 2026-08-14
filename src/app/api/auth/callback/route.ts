import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { createSession } from '@/lib/auth/session';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error, data: sessionData } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && sessionData.session) {
      const authUser = sessionData.session.user;
      const db = getAdminClient();
      
      // 1. Check if user already exists in our public.users table
      let { data: customUser } = await db.from('users').select('*').eq('email', authUser.email).single();
      
      if (!customUser) {
        // 2. If not, create a new tenant and user
        const nameParts = (authUser.user_metadata?.full_name || authUser.email || '').split(' ');
        let firstName = nameParts[0] || 'User';
        let lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User';
        
        const tenantName = `${firstName} Store`;
        let baseTenantCode = tenantName.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 45);
        if (baseTenantCode.endsWith('-')) baseTenantCode = baseTenantCode.slice(0, -1);
        
        let tenantCode = baseTenantCode;
        let codeExists = true;
        let counter = 0;
        
        while (codeExists) {
          const { data: existingTenant } = await db.from('tenant').select('tenant_id').eq('code', tenantCode).maybeSingle();
          if (!existingTenant) {
            codeExists = false;
          } else {
            counter++;
            tenantCode = `${baseTenantCode}-${counter}`.substring(0, 50);
          }
        }
        
        // Flag to prompt user for name setup on the dashboard
        const cookieStore = await cookies();
        cookieStore.set('needs_name_setup', 'true', { path: '/', maxAge: 60 * 60 * 24 });
        
        // Create Tenant
        const { data: tenant } = await db.from('tenant').insert({
          tenant_name: tenantName,
          code: tenantCode,
          status: 'ACTIVE'
        }).select().single();
        
        if (tenant) {
          // Create User
          const { data: newUser } = await db.from('users').insert({
            tenant_id: tenant.tenant_id,
            first_name: firstName,
            last_name: lastName,
            email: authUser.email,
            password_hash: 'OAUTH_PROVIDER', // Flag as OAuth
            status: 'ACTIVE',
            email_verified: true
          }).select().single();
          
          if (newUser) {
            // Update created_by
            await db.from('tenant').update({ created_by: newUser.user_id }).eq('tenant_id', tenant.tenant_id);
            customUser = newUser;
          }
        }
      } else {
        // Prevent Account Takeover (ATO): Update email_verified to true since Google verified it,
        // but DO NOT overwrite their password_hash if they previously registered via email.
        if (!customUser.email_verified) {
          await db.from('users').update({ email_verified: true }).eq('user_id', customUser.user_id);
          customUser.email_verified = true;
        }
      }
      
      if (customUser && customUser.status === 'ACTIVE') {
        // 3. Issue Custom Session JWT for the rest of the application
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
        const userAgent = request.headers.get('user-agent') || 'Unknown';
        await createSession(customUser.user_id, customUser.tenant_id, 'owner', ip, userAgent);
        
        if (customUser.password_hash === 'OAUTH_PROVIDER') {
          return NextResponse.redirect(`${origin}/set-password`);
        }

        return NextResponse.redirect(`${origin}/`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could not authenticate with Google`);
}
