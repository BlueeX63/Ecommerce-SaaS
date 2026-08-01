import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db/client';
import { getSession } from '@/lib/auth/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await getDbClient();
    
    // Fetch roles with their permissions count
    const { data: roles, error } = await db.from('roles')
      .select('role_id, role_name, description, status, created_date')
      .eq('tenant_id', session.tenantId);

    if (error) throw error;

    return NextResponse.json({ data: roles });
  } catch (error) {
    console.error('Fetch roles error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { roleName, description, permissions } = await req.json();
    if (!roleName) return NextResponse.json({ error: 'Role name is required' }, { status: 400 });

    const db = await getDbClient();
    
    // Create role
    const { data: role, error: roleError } = await db.from('roles')
      .insert({
        tenant_id: session.tenantId,
        role_name: roleName,
        description: description,
        status: 'ACTIVE'
      })
      .select()
      .single();

    if (roleError || !role) throw roleError;

    // Attach permissions if any
    if (permissions && Array.isArray(permissions) && permissions.length > 0) {
      const permsToInsert = permissions.map(permId => ({
        role_id: role.role_id,
        permission_id: permId,
        is_allowed: true
      }));

      await db.from('role_permissions').insert(permsToInsert);
    }

    return NextResponse.json({ message: 'Role created successfully', role }, { status: 201 });
  } catch (error) {
    console.error('Create role error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
