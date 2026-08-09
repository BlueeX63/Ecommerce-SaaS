import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'your-256-bit-secret'
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { slug, phone, password } = body;

    if (!slug || !phone || !password) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Find the tenant by slug
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenant')
      .select('tenant_id')
      .eq('code', slug)
      .single();

    if (tenantError || !tenantData) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const tenantId = tenantData.tenant_id;

    // Find customer
    const { data: customer, error: findError } = await supabase
      .from('customers')
      .select('customer_id, first_name, last_name, email, password_hash, is_verified')
      .eq('tenant_id', tenantId)
      .eq('phone_number', phone)
      .maybeSingle();

    if (findError || !customer) {
      return NextResponse.json({ error: 'Invalid phone number or password' }, { status: 401 });
    }

    if (!customer.is_verified) {
      return NextResponse.json({ error: 'Phone number not verified' }, { status: 403 });
    }

    if (!customer.password_hash) {
      return NextResponse.json({ error: 'Invalid account state' }, { status: 401 });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, customer.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid phone number or password' }, { status: 401 });
    }

    // Create session payload
    const payload = {
      customerId: customer.customer_id,
      tenantId: tenantId,
      slug: slug,
      role: 'CUSTOMER',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    const sessionToken = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    const cookieStore = await cookies();
    cookieStore.set('store_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(payload.expiresAt),
      sameSite: 'lax',
      path: '/',
    });

    // Exclude password_hash from response
    const { password_hash, ...customerData } = customer;

    return NextResponse.json({
      message: 'Logged in successfully',
      customer: customerData
    }, { status: 200 });

  } catch (error) {
    console.error('Store login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
