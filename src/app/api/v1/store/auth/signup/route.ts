import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { adminAuth } from '@/lib/firebase-admin';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { rateLimit } from '@/lib/auth/rate-limiter';

const jwtSecret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET;
if (!jwtSecret) {
  throw new Error('FATAL: JWT_SECRET or SUPABASE_JWT_SECRET must be set for store auth.');
}
const JWT_SECRET = new TextEncoder().encode(jwtSecret);

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const limit = await rateLimit(`store_signup_${ip}`, 3, 60 * 60000); // 3 attempts per hour
    if (!limit.success) {
      return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
    }

    const body = await req.json();
    const { slug, idToken, fullName, password, phoneNumber } = body;

    if (!slug || !idToken || !fullName || !password || !phoneNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Verify the Firebase ID Token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (err) {
      console.error('Firebase token verification failed:', err);
      return NextResponse.json({ error: 'Invalid or expired Firebase token' }, { status: 401 });
    }

    // Make sure the phone numbers match (or just trust the token's phone_number)
    const verifiedPhone = decodedToken.phone_number;
    if (!verifiedPhone || verifiedPhone !== phoneNumber) {
      return NextResponse.json({ error: 'Phone number mismatch' }, { status: 403 });
    }

    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    const supabase = getAdminClient();

    // 2. Find the tenant by slug
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenant')
      .select('tenant_id')
      .eq('code', slug)
      .single();

    if (tenantError || !tenantData) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const tenantId = tenantData.tenant_id;

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Upsert Customer in Supabase
    const { data: existingCustomer, error: findError } = await supabase
      .from('customers')
      .select('customer_id')
      .eq('tenant_id', tenantId)
      .eq('phone_number', verifiedPhone)
      .maybeSingle();

    let customerId;

    if (existingCustomer) {
      const { error: updateError } = await supabase
        .from('customers')
        .update({
          first_name: firstName,
          last_name: lastName,
          password_hash: passwordHash,
          is_verified: true,
          status: 'ACTIVE'
        })
        .eq('customer_id', existingCustomer.customer_id);

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
      }
      customerId = existingCustomer.customer_id;
    } else {
      const { data: newCustomer, error: insertError } = await supabase
        .from('customers')
        .insert({
          tenant_id: tenantId,
          first_name: firstName,
          last_name: lastName,
          phone_number: verifiedPhone,
          email: `${verifiedPhone.replace('+', '')}@temp.store.local`,
          password_hash: passwordHash,
          is_verified: true,
          status: 'ACTIVE'
        })
        .select('customer_id')
        .single();

      if (insertError) {
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
      }
      customerId = newCustomer.customer_id;
    }

    // 5. Issue JWT Session Cookie
    const payload = {
      customerId: customerId,
      tenantId: tenantId,
      slug: slug,
      role: 'CUSTOMER',
      phone: verifiedPhone,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    const cookieStore = await cookies();
    cookieStore.set('store_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });

    return NextResponse.json({ message: 'Signup and verification successful' }, { status: 200 });

  } catch (error) {
    console.error('Firebase Signup route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
