import { getSession } from "@/lib/auth/session";
import { getAdminClient } from "@/lib/supabase/admin";
import LandingPageClient from "./LandingPageClient";
import { cookies } from "next/headers";

export default async function Page() {
  const session = await getSession();
  const isLoggedIn = !!session;
  let hasStore = false;
  let user = null;

  const cookieStore = await cookies();
  const needsNameSetup = cookieStore.get('needs_name_setup')?.value === 'true';

  if (isLoggedIn && session?.tenantId) {
    const db = getAdminClient();
    const { data: settings } = await db
      .from('tenant_settings')
      .select('setting_value')
      .eq('tenant_id', session.tenantId)
      .eq('setting_key', 'customization')
      .single();
    if (settings) {
      hasStore = true;
    }
    const { data: userData } = await db
      .from('users')
      .select('first_name, last_name, email')
      .eq('user_id', session.userId)
      .single();
      
    user = userData;
  }
  
  return <LandingPageClient initialIsLoggedIn={isLoggedIn} initialHasStore={hasStore} user={user} needsNameSetup={needsNameSetup} />;
}
