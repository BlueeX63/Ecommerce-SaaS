-- 011_delivery_and_coupons.sql
-- Add Delivery Options and enhance Coupons

CREATE TABLE IF NOT EXISTS delivery_options (
    delivery_option_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    estimated_days VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id)
);

ALTER TABLE delivery_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for delivery_options" ON delivery_options USING (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);

-- Enhance Coupons with is_public
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Enhance Orders with RETURN_REQUESTED status
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'RETURN_REQUESTED'));

-- Enhance Orders with delivery_option_id
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_option_id UUID REFERENCES delivery_options(delivery_option_id) ON DELETE SET NULL;
