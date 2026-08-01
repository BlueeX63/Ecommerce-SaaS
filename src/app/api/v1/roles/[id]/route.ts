import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db/client';
import { getSession } from '@/lib/auth/session';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await getDbClient();
    
    const { data: role, error } = await db.from('roles')
      .select('*, role_permissions(permission_id, is_allowed, permissions(permission_code, permission_name))')
      .eq('role_id', id)
      .eq('tenant_id', session.tenantId)
      .single();

    if (error || !role) return NextResponse.json({ error: 'Role not found' }, { status: 404 });

    return NextResponse.json({ data: role });
  } catch (error) {
    console.error('Fetch role error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { roleName, description, status, permissions } = await req.json();
    const db = await getDbClient();
    
    const { error } = await db.from('roles')
      .update({
        role_name: roleName,
        description: description,
        status: status,
      })
      .eq('role_id', id)
      .eq('tenant_id', session.tenantId);

    if (error) throw error;

    // Update permissions if provided
    if (permissions && Array.isArray(permissions)) {
      // Very naive update: delete all and insert new ones.
      // In production, we'd do a proper diff or upsert.
      await db.from('role_permissions').delete().eq('role_id', id);
      
      if (permissions.length > 0) {
        const permsToInsert = permissions.map(permId => ({
          role_id: id,
          permission_id: permId,
          is_allowed: true
        }));
        await db.from('role_permissions').insert(permsToInsert);
      }
    }

    return NextResponse.json({ message: 'Role updated successfully' });
  } catch (error) {
    console.error('Update role error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await getDbClient();
    
    // Prevent deletion of roles currently in use
    const { count } = await db.from('user_roles').select('*', { count: 'exact', head: true }).eq('role_id', id);
    if (count && count > 0) {
      return NextResponse.json({ error: 'Cannot delete role assigned to users' }, { status: 400 });
    }

    const { error } = await db.from('roles')
      .delete()
      .eq('role_id', id)
      .eq('tenant_id', session.tenantId);

    if (error) throw error;

    return NextResponse.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Delete role error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
