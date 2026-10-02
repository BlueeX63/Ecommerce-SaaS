import ClientLayout from './ClientLayout';
import { redirect } from 'next/navigation';
import { getMerchantContext } from '@/lib/api';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const context = await getMerchantContext();

  if (!context) {
    redirect('/login');
  }

  // If the user has no active store, send them back to the store selector
  if (!context.activeStore) {
    redirect('/dashboard');
  }

  const { first_name, last_name, email, role } = context.user;

  return (
    <ClientLayout
      user={{
        first_name,
        last_name,
        email,
        role,
        stores: context.stores,
        activeStore: context.activeStore,
        plan: context.plan,
        storesUsed: context.storesUsed,
        subscriptionActive: context.subscriptionActive,
      }}
    >
      {children}
    </ClientLayout>
  );
}
