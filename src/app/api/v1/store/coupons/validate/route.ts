import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const { code, slug } = await req.json();

    if (!code || !slug) {
      return NextResponse.json({ error: 'Code and slug required' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // 1. Get Tenant ID from Slug
    const { data: tenant, error: tenantError } = await supabase
      .from('tenant')
      .select('tenant_id')
      .eq('slug', slug)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // 2. Validate Coupon
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('*')
      .eq('tenant_id', tenant.tenant_id)
      .eq('code', code.toUpperCase())
      .single();

    if (couponError || !coupon || !coupon.is_active) {
      return NextResponse.json({ error: 'Invalid or expired coupon' }, { status: 400 });
    }

    // Check expiry
    if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
      return NextResponse.json({ error: 'Coupon has expired' }, { status: 400 });
    }

    // Check max uses
    if (coupon.max_uses !== null && coupon.times_used >= coupon.max_uses) {
      return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      discount_type: coupon.discount_type,
      discount_amount: coupon.discount_amount
    }, { status: 200 });

  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error validating coupon' }, { status: 500 });
  }
}
