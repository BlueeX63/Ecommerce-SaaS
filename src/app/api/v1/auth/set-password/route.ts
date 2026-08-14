import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { hashPassword, comparePassword, validatePasswordStrength } from '@/lib/auth/password';
import { getSession } from '@/lib/auth/session';
import { z } from 'zod';

const setPasswordSchema = z.object({
  oldPassword: z.string().optional(),
  password: z.string(),
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getSession();
    
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = setPasswordSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: parseResult.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { oldPassword, password, firstName, lastName } = parseResult.data;
    const db = getAdminClient();
    
    // Fetch current user details
    const { data: user, error: userError } = await db
      .from('users')
      .select('password_hash')
      .eq('user_id', session.userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.password_hash !== 'OAUTH_PROVIDER') {
      if (!oldPassword) {
        return NextResponse.json({ error: 'Current password is required' }, { status: 400 });
      }
      const isMatch = await comparePassword(oldPassword, user.password_hash);
      if (!isMatch) {
        return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
      }
    }

    const strength = validatePasswordStrength(password);
    if (!strength.isValid) {
      return NextResponse.json({ error: strength.message }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    
    const updateData: any = { password_hash: hashedPassword };
    if (firstName) updateData.first_name = firstName;
    if (lastName) updateData.last_name = lastName;

    const { error } = await db
      .from('users')
      .update(updateData)
      .eq('user_id', session.userId);

    if (error) {
      console.error('Error updating password:', error);
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Password updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Set password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
