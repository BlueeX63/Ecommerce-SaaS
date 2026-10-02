-- 008_coupons.sql
-- Global Coupon System

CREATE TABLE coupons (
    coupon_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('PERCENTAGE', 'FIXED')),
    discount_amount DECIMAL(12,2) NOT NULL CHECK (discount_amount > 0),
    max_uses INTEGER DEFAULT NULL,
    times_used INTEGER DEFAULT 0,
    expiry_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT true,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id),
    UNIQUE(tenant_id, code)
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for coupons" ON coupons USING (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);
