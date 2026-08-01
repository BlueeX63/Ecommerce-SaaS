import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db/client';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/rbac';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await getDbClient();
    
    const { data: user, error } = await db.from('users')
      .select('user_id, first_name, last_name, email, status, last_login, created_date, user_profiles(*)')
      .eq('user_id', id)
      .eq('tenant_id', session.tenantId)
      .single();

    if (error || !user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error('Fetch user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const db = await getDbClient();
    
    // In a real app, check PERM_USERS_MANAGE
    
    const { error } = await db.from('users')
      .update({
        first_name: body.firstName,
        last_name: body.lastName,
        status: body.status,
      })
      .eq('user_id', id)
      .eq('tenant_id', session.tenantId);

    if (error) throw error;

    return NextResponse.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Prevent self-deletion
    if (session.userId === id) {
      return NextResponse.json({ error: 'Cannot delete own account' }, { status: 400 });
    }

    const db = await getDbClient();
    
    // Soft delete
    const { error } = await db.from('users')
      .update({ status: 'DELETED' })
      .eq('user_id', id)
      .eq('tenant_id', session.tenantId);

    if (error) throw error;

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
