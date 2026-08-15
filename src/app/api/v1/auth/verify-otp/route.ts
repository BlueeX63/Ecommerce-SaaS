import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { createSession } from '@/lib/auth/session';
import { Redis } from '@upstash/redis';
import { z } from 'zod';

const verifySchema = z.object({
  email: z.string().email('Invalid email format'),
  otp: z.string().min(6).max(6),
});

export async function POST(rereqq: Request) {
  try {    const body = await rereqq.json();

    const parseResult = verifySchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: parseResult.error.issues.map(e => e.message) 
      }, { status: 400 });
    }

    const { email, otp } = parseResult.data;

    // Check OTP in Redis
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || '',
      token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    });

    const storedOtp = await redis.get(`otp:${email}`);

    // upstash redis get might return a number if it looks like one, so convert to string safely
    if (!storedOtp || storedOtp.toString() !== otp) {
      return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 });
    }

    // OTP is valid, delete it from Redis
    await redis.del(`otp:${email}`);

    // Update user in database
    const db = getAdminClient();
    const { data: user, error } = await db.from('users')
      .update({ email_verified: true })
      .eq('email', email)
      .select('user_id, tenant_id')
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'User not found or failed to update' }, { status: 500 });
    }

    const role = 'ADMIN';
    const ip = rereqq.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = rereqq.headers.get('user-agent') || 'Unknown';
    
    await createSession(user.user_id, user.tenant_id, role, ip, userAgent);

    return NextResponse.json({ message: 'Email verified successfully. You are now logged in.' }, { status: 200 });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
