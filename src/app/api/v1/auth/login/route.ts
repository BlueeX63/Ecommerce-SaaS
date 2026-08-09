import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { comparePassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { rateLimit } from '@/lib/auth/rate-limiter';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const limit = await rateLimit(`login_${ip}`, 10, 60000 * 5); // 10 logins per 5 minutes
    
    if (!limit.success) {
      return NextResponse.json({ error: 'Too many login attempts. Please try again later.' }, { status: 429 });
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    const db = getAdminClient();
    
    const { data: user, error } = await db.from('users')
      .select('user_id, tenant_id, password_hash, status')
      .eq('email', email)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Account is disabled or pending verification' }, { status: 403 });
    }

    const isMatch = await comparePassword(password, user.password_hash);
    
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Determine role (simplified for now)
    const role = 'ADMIN';

    // Create session (sets HTTP-only cookie)
    await createSession(user.user_id, user.tenant_id, role);

    // Update last login
    await db.from('users').update({ last_login: new Date().toISOString() }).eq('user_id', user.user_id);

    return NextResponse.json({ message: 'Login successful' }, { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
