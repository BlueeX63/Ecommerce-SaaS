import { getSession } from '@/lib/auth/session';
import { getAdminClient } from '@/lib/supabase/admin';
import ClientLayout from './ClientLayout';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { StoreSelector } from '@/components/dashboard/StoreSelector';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  const db = getAdminClient();
  
  // Fetch all stores owned by this user
  const { data: stores } = await db
    .from('tenant')
    .select('tenant_id, tenant_name, code, custom_domain')
    .eq('created_by', session.userId);

  const { data: user } = await db
    .from('users')
    .select('first_name, last_name, email')
    .eq('user_id', session.userId)
    .single();

  const activeStore = stores?.find(s => s.tenant_id === session.tenantId);
  
  // If user has NO active store, send them back to the Store Selector
  if (!activeStore) {
    redirect('/dashboard');
  }

  // User has stores and an active session.tenantId
  return <ClientLayout user={{...user, stores, activeStore}}>{children}</ClientLayout>;
}
