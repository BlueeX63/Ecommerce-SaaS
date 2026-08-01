import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db/client';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/rbac';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // In a real app, you'd check PERM_USERS_VIEW
    // const canView = await hasPermission(session.userId, 'PERM_USERS_VIEW');
    // if (!canView) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const db = await getDbClient();
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const { data: users, error, count } = await db.from('users')
      .select('user_id, first_name, last_name, email, status, last_login, created_date', { count: 'exact' })
      .eq('tenant_id', session.tenantId)
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      data: users,
      meta: {
        total: count,
        page,
        limit,
        totalPages: count ? Math.ceil(count / limit) : 0
      }
    });
  } catch (error) {
    console.error('Fetch users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
