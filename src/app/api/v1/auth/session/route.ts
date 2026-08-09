import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ isLoggedIn: false }, { status: 401 });
  }

  const db = getAdminClient();
  const { data: user } = await db.from('users').select('email, first_name, last_name').eq('user_id', session.userId).single();

  return NextResponse.json({ 
    isLoggedIn: true,
    user: {
      userId: session.userId,
      tenantId: session.tenantId,
      role: session.role,
      email: user?.email || 'User',
      first_name: user?.first_name || '',
      last_name: user?.last_name || '-'
    }
  }, { status: 200 });
}
