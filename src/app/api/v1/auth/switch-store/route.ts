import { NextResponse } from 'next/server';
import { getSession, encrypt } from '@/lib/auth/session';
import { getAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { tenantId } = await req.json();
    if (!tenantId) return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });

    const db = getAdminClient();
    
    // Verify the user actually owns this tenant
    const { data: tenant } = await db.from('tenant')
      .select('tenant_id')
      .eq('tenant_id', tenantId)
      .eq('created_by', session.userId)
      .single();

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found or access denied' }, { status: 403 });
    }

    // Update the session token with the new active tenantId
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const newSession = await encrypt({
      ...session,
      tenantId: tenant.tenant_id,
      expiresAt: expiresAt.toISOString(),
    });

    const cookieStore = await cookies();
    cookieStore.set('session', newSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: expiresAt,
      sameSite: 'lax',
      path: '/',
    });

    return NextResponse.json({ success: true, tenantId: tenant.tenant_id });
  } catch (error: any) {
    console.error('Switch store error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
