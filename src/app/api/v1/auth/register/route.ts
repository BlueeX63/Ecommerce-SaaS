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
  password: z.string(),
  tenantName: z.string().min(3, 'Tenant name must be at least 3 characters')
    .regex(/^[a-zA-Z0-9\s-']+$/, 'Tenant name can only contain letters, numbers, spaces, hyphens, and apostrophes'),
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

    const { firstName, lastName, email, password, tenantName } = parseResult.data;

    const strength = validatePasswordStrength(password);
    if (!strength.isValid) {
      return NextResponse.json({ error: strength.message }, { status: 400 });
    }

    const db = getAdminClient();
    
    // Check if user already exists
    const { data: existingUser } = await db.from('users').select('user_id, tenant_id, email_verified').eq('email', email).single();
    if (existingUser) {
      if (!existingUser.email_verified) {
        // User exists but hasn't verified their email. 
        // Delete the old unverified user and tenant so they can cleanly re-register.
        if (existingUser.tenant_id) {
          // Break circular dependency if created_by is set
          await db.from('tenant').update({ created_by: null }).eq('tenant_id', existingUser.tenant_id);
        }
        const { error: delUserError } = await db.from('users').delete().eq('user_id', existingUser.user_id);
        if (delUserError) console.error("Error deleting old user:", delUserError);
        
        if (existingUser.tenant_id) {
          const { error: delTenantError } = await db.from('tenant').delete().eq('tenant_id', existingUser.tenant_id);
          if (delTenantError) console.error("Error deleting old tenant:", delTenantError);
        }
        console.log(`Deleted unverified user ${email} to allow re-registration.`);
      } else {
        return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
      }
    }

    const hashedPassword = await hashPassword(password);
    let baseTenantCode = tenantName.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 45);
    if (baseTenantCode.endsWith('-')) baseTenantCode = baseTenantCode.slice(0, -1);
    
    let tenantCode = baseTenantCode;
    let codeExists = true;
    let counter = 0;
    
    while (codeExists) {
      const { data: existingTenant } = await db.from('tenant').select('tenant_id').eq('code', tenantCode).maybeSingle();
      if (!existingTenant) {
        codeExists = false;
      } else {
        counter++;
        tenantCode = `${baseTenantCode}-${counter}`.substring(0, 50);
      }
    }

    // Create tenant
    const { data: tenant, error: tenantError } = await db.from('tenant').insert({
      tenant_name: tenantName,
      code: tenantCode,
      status: 'ACTIVE'
    }).select().single();

    if (tenantError || !tenant) {
      console.error("Tenant creation error:", tenantError);
      return NextResponse.json({ error: `Failed to create tenant: ${tenantError?.message || 'Unknown error'}` }, { status: 500 });
    }

    // Create user
    const { data: user, error: userError } = await db.from('users').insert({
      tenant_id: tenant.tenant_id,
      first_name: firstName,
      last_name: lastName,
      email: email,
      password_hash: hashedPassword,
      status: 'ACTIVE',
      email_verified: false
    }).select().single();

    if (userError || !user) {
      // Rollback tenant creation
      await db.from('tenant').delete().eq('tenant_id', tenant.tenant_id);
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // Update tenant created_by
    await db.from('tenant').update({ created_by: user.user_id }).eq('tenant_id', tenant.tenant_id);

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
      // Rollback the user and tenant creation since email failed to send
      console.warn(`Failed to send verification email to ${email}, rolling back registration`);
      await db.from('users').delete().eq('user_id', user.user_id);
      await db.from('tenant').delete().eq('tenant_id', tenant.tenant_id);
      return NextResponse.json({ error: 'Failed to send verification email. Please check your SMTP configuration or try again later.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Registration successful. Please check your inbox for the verification code.' }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
