import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db/client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, tenantId } = body;
    
    if (!code || !tenantId) {
      return NextResponse.json({ error: 'Coupon code and tenant ID are required' }, { status: 400 });
    }

    const db = await getDbClient();
    
    // We disable RLS here temporarily by using service role OR just querying openly if we pass tenantId explicitly
    // Since this is a public endpoint used by checkout
    const { data: coupon, error } = await db.from('coupons')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('code', code.toUpperCase())
      .single();

    if (error || !coupon) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 404 });
    }

    if (!coupon.is_active) {
      return NextResponse.json({ error: 'Coupon is no longer active' }, { status: 400 });
    }

    if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
      return NextResponse.json({ error: 'Coupon has expired' }, { status: 400 });
    }

    if (coupon.max_uses !== null && coupon.times_used >= coupon.max_uses) {
      return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 });
    }

    return NextResponse.json({ data: coupon });
  } catch (error) {
    console.error('Validate coupon error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
