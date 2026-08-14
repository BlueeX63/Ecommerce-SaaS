import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';
import { verifyToken } from '@/lib/auth/session';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parseResult = resetPasswordSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: parseResult.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { token, newPassword } = parseResult.data;

    const strength = validatePasswordStrength(newPassword);
    if (!strength.isValid) {
      return NextResponse.json({ error: strength.message }, { status: 400 });
    }

    const payload = await verifyToken(token);

    if (!payload || payload.type !== 'password_reset' || !payload.userId) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    const db = getAdminClient();
    const hashedPassword = await hashPassword(newPassword);
    
    const { error } = await db.from('users')
      .update({ password_hash: hashedPassword })
      .eq('user_id', payload.userId);

    if (error) {
      return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Password reset successfully' }, { status: 200 });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
