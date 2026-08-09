import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { hashPassword } from '@/lib/auth/password';
import { rateLimit } from '@/lib/auth/rate-limiter';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const limit = await rateLimit(`register_${ip}`, 3, 60000 * 60); // 3 registrations per hour per IP
    
    if (!limit.success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const { firstName, lastName, email, password, tenantName } = await req.json();

    if (!firstName || !lastName || !email || !password || !tenantName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getAdminClient();
    
    // Check if user already exists
    const { data: existingUser } = await db.from('users').select('user_id').eq('email', email).single();
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const tenantCode = tenantName.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50);

    // Create tenant
    const { data: tenant, error: tenantError } = await db.from('tenant').insert({
      tenant_name: tenantName,
      code: tenantCode,
      status: 'ACTIVE'
    }).select().single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 });
    }

    // Create user
    const { data: user, error: userError } = await db.from('users').insert({
      tenant_id: tenant.tenant_id,
      first_name: firstName,
      last_name: lastName,
      email: email,
      password_hash: hashedPassword,
      status: 'ACTIVE'
    }).select().single();

    if (userError || !user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // Update tenant created_by
    await db.from('tenant').update({ created_by: user.user_id }).eq('tenant_id', tenant.tenant_id);

    return NextResponse.json({ message: 'Registration successful', userId: user.user_id }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
