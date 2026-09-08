import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';
import { rateLimit } from '@/lib/auth/rate-limiter';
import { createToken } from '@/lib/auth/session';
import { sendMail } from '@/lib/email';

import { z } from 'zod';

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string()
});

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const limit = await rateLimit(`register_${ip}`, 30, 60000 * 60); // 30 registrations per hour per IP
    
    if (!limit.success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const body = await req.json();
    const parseResult = registerSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: parseResult.error.issues.map(e => e.message) 
      }, { status: 400 });
    }

    const { firstName, lastName, email, password } = parseResult.data;

    const strength = validatePasswordStrength(password);
    if (!strength.isValid) {
      return NextResponse.json({ error: strength.message }, { status: 400 });
    }

    const db = getAdminClient();
    
    // Check if user already exists
    const { data: existingUser } = await db.from('users').select('user_id, email_verified').eq('email', email).single();
    if (existingUser) {
      if (!existingUser.email_verified) {
        // User exists but hasn't verified their email. 
        // Delete the old unverified user so they can cleanly re-register.
        const { error: delUserError } = await db.from('users').delete().eq('user_id', existingUser.user_id);
        if (delUserError) console.error("Error deleting old user:", delUserError);
        console.log(`Deleted unverified user ${email} to allow re-registration.`);
      } else {
        return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
      }
    }

    const hashedPassword = await hashPassword(password);
    
    // Create user (NO tenant)
    const { data: user, error: userError } = await db.from('users').insert({
      tenant_id: null,
      first_name: firstName,
      last_name: lastName,
      email: email,
      password_hash: hashedPassword,
      status: 'ACTIVE',
      email_verified: false
    }).select().single();

    if (userError || !user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store in Redis (expires in 15 minutes)
    const { Redis } = require('@upstash/redis');
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || '',
      token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    });
    await redis.setex(`otp:${email}`, 900, otp);
    
    // Send email
    const emailSent = await sendMail({
      to: email,
      subject: 'Your Verification Code',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; text-align: center;">
          <h2>Welcome to our E-commerce platform!</h2>
          <p>Hi ${firstName},</p>
          <p>Thanks for creating an account for your new store. To complete your registration, please enter the verification code below:</p>
          <div style="margin: 30px 0; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #F04438;">
            ${otp}
          </div>
          <p>This code will expire in 15 minutes.</p>
        </div>
      `
    });

    if (!emailSent) {
      // Rollback the user creation since email failed to send
      console.warn(`Failed to send verification email to ${email}, rolling back registration`);
      await db.from('users').delete().eq('user_id', user.user_id);
      return NextResponse.json({ error: 'Failed to send verification email. Please check your SMTP configuration or try again later.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Registration successful. Please check your inbox for the verification code.' }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
