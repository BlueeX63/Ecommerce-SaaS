import { getDbClient } from '@/lib/db/client';

export async function hasPermission(userId: string, permissionCode: string): Promise<boolean> {
  const db = await getDbClient();
  
  // Need to join users -> user_roles -> roles -> role_permissions -> permissions
  const { data, error } = await db.from('users')
    .select(`
      user_roles!inner (
        roles!inner (
          role_permissions!inner (
            permissions!inner (
              permission_code
            )
          )
        )
      )
    `)
    .eq('user_id', userId)
    .eq('user_roles.roles.role_permissions.permissions.permission_code', permissionCode)
    .eq('user_roles.roles.role_permissions.is_allowed', true);

  if (error || !data || data.length === 0) {
    return false;
  }
  
  return true;
}
