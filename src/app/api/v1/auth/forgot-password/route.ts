import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { createToken } from '@/lib/auth/session';
import { rateLimit } from '@/lib/auth/rate-limiter';
import { sendMail } from '@/lib/email';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const limit = await rateLimit(`forgot_pwd_${ip}`, 3, 60000 * 60); // 3 per hour
    
    if (!limit.success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const body = await req.json();
    const parseResult = forgotPasswordSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: parseResult.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { email } = parseResult.data;
    const db = getAdminClient();
    
    const { data: user } = await db.from('users')
      .select('user_id, status, password_hash')
      .eq('email', email)
      .single();

    // Do not leak information about whether the user exists. Always return success.
    if (user && user.status === 'ACTIVE' && user.password_hash !== 'OAUTH_PROVIDER') {
      const resetToken = await createToken({ userId: user.user_id, email, type: 'password_reset' }, '1h');
      const resetUrl = `${req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/v1/auth/reset-password?token=${resetToken}`;
      
      await sendMail({
        to: email,
        subject: 'Password Reset Request',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Reset your password</h2>
            <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
            <div style="margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
            </div>
            <p>Or copy and paste this link in your browser:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>This link will expire in 1 hour.</p>
          </div>
        `
      });
    }

    return NextResponse.json({ message: 'If an account exists with that email, a password reset link has been generated.' }, { status: 200 });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
