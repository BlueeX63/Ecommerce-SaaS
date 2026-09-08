import { getSession } from '@/lib/auth/session';
import { getAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

export default async function RootDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  const db = getAdminClient();
  
  // Check subscription status
  const { data: subscription } = await db
    .from('subscriptions')
    .select('status')
    .eq('user_id', session.userId)
    .maybeSingle();

  if (!subscription || subscription.status !== 'active') {
    redirect('/pricing');
  }

  return <>{children}</>;
}
