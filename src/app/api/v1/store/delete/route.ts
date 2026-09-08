import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getSession, encrypt } from '@/lib/auth/session';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tenantId = session.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'No active store to delete' }, { status: 400 });
    }

    const db = getAdminClient();

    // 1. Verify ownership
    const { data: tenant, error: fetchError } = await db
      .from('tenant')
      .select('tenant_id, created_by')
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !tenant) {
      return NextResponse.json({ error: 'Store not found or you lack permission' }, { status: 404 });
    }

    if (tenant.created_by !== session.userId) {
      return NextResponse.json({ error: 'Only the store owner can delete this store' }, { status: 403 });
    }

    // 2. Unlink the tenant from the user so ON DELETE CASCADE doesn't delete the user account!
    await db.from('users').update({ tenant_id: null }).eq('tenant_id', tenantId);

    // 3. Delete the tenant
    const { error: deleteError } = await db
      .from('tenant')
      .delete()
      .eq('tenant_id', tenantId);

    if (deleteError) throw deleteError;

    // 3. Clear session tenantId
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const newSession = await encrypt({
      ...session,
      tenantId: "", // Clear the active store
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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Store deletion error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error?.message || error }, { status: 500 });
  }
}
