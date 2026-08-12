import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { hashPassword } from '@/lib/auth/password';
import { getSession } from '@/lib/auth/session';
import { z } from 'zod';

const setPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
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
        details: parseResult.error.errors.map(e => e.message) 
      }, { status: 400 });
    }

    const { password } = parseResult.data;
    const db = getAdminClient();
    
    const hashedPassword = await hashPassword(password);
    
    const { error } = await db
      .from('users')
      .update({ password_hash: hashedPassword })
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
