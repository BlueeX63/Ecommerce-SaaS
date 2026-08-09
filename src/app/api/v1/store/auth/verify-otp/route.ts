import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { redis } from '@/lib/redis';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'your-256-bit-secret'
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { slug, phoneNumber, otp } = body;

    if (!slug || !phoneNumber || !otp) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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

    const redisKey = `store:auth:otp:${tenantId}:${phoneNumber}`;
    const storedOtp = await redis!.get(redisKey);

    if (!storedOtp) {
      return NextResponse.json({ error: 'OTP expired or invalid' }, { status: 400 });
    }

    if (storedOtp !== otp) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    // Verify and get customer
    const { data: customer, error: updateError } = await supabase
      .from('customers')
      .update({ is_verified: true, status: 'ACTIVE' })
      .eq('tenant_id', tenantId)
      .eq('phone_number', phoneNumber)
      .select('customer_id, first_name, last_name, email')
      .single();

    if (updateError || !customer) {
      console.error('Error verifying customer:', updateError);
      return NextResponse.json({ error: 'Failed to verify customer' }, { status: 500 });
    }

    // OTP used, delete it
    await redis!.del(redisKey);

    // Create JWT
    const token = await new SignJWT({
      sub: customer.customer_id,
      tenantId: tenantId,
      role: 'store_customer'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d') // 7 days
      .sign(JWT_SECRET);

    const cookieStore = await cookies();
    cookieStore.set('store_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      sameSite: 'lax',
      path: '/',
    });

    // Provide the token and customer data
    return NextResponse.json({
      message: 'Verified successfully',
      token,
      customer
    }, { status: 200 });

  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
