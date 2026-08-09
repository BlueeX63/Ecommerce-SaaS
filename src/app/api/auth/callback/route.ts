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
        let lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '-';
        
        const tenantName = `${firstName}'s Store`;
        const tenantCode = tenantName.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50);
        
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
            status: 'ACTIVE'
          }).select().single();
          
          if (newUser) {
            // Update created_by
            await db.from('tenant').update({ created_by: newUser.user_id }).eq('tenant_id', tenant.tenant_id);
            customUser = newUser;
          }
        }
      }
      
      if (customUser && customUser.status === 'ACTIVE') {
        // 3. Issue Custom Session JWT for the rest of the application
        await createSession(customUser.user_id, customUser.tenant_id, 'owner');
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could not authenticate with Google`);
}
