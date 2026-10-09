-- 020_logistics_support_refunds.sql
-- Warehouse geo-location (delivery ETA), richer order shipping/tax data, order support requests and refunds.
-- Idempotent: safe to run more than once.

-- ---------------------------------------------------------------------------------------------
-- Warehouses: coordinates + handling time, used to find the nearest warehouse that has stock.
-- ---------------------------------------------------------------------------------------------
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS latitude DECIMAL(9,6);
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS longitude DECIMAL(9,6);
-- Hours between an order arriving and the parcel leaving this warehouse.
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS dispatch_hours INTEGER DEFAULT 24;

-- ---------------------------------------------------------------------------------------------
-- Orders: who/where to deliver, how it was paid, tax mode, ETA and the warehouse that ships it.
-- ---------------------------------------------------------------------------------------------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_name VARCHAR(200);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_phone VARCHAR(30);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_landmark VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_latitude DECIMAL(9,6);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_longitude DECIMAL(9,6);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'cod';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_inclusive BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_breakdown JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_warehouse_id UUID REFERENCES warehouses(warehouse_id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_updated_date TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_inventory_variant ON inventory(variant_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(tenant_id, customer_id, created_date DESC);

-- ---------------------------------------------------------------------------------------------
-- Order support requests: AI-assisted address/phone changes, escalated to the store team when needed.
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_support_requests (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(customer_id) ON DELETE SET NULL,
    category VARCHAR(30) NOT NULL DEFAULT 'GENERAL' CHECK (category IN ('ADDRESS_CHANGE', 'PHONE_CHANGE', 'GENERAL')),
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'AI_RESOLVED', 'ESCALATED', 'RESOLVED', 'CLOSED')),
    handled_by VARCHAR(10) NOT NULL DEFAULT 'AI' CHECK (handled_by IN ('AI', 'STAFF')),
    summary TEXT,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    proposed_changes JSONB,
    resolution_note TEXT,
    resolved_by UUID REFERENCES users(user_id),
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_date TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_support_requests_tenant_status ON order_support_requests(tenant_id, status, updated_date DESC);
CREATE INDEX IF NOT EXISTS idx_support_requests_order ON order_support_requests(order_id);

-- ---------------------------------------------------------------------------------------------
-- Refunds. method = SOURCE (back to the original UPI/netbanking payment) or BANK_TRANSFER (COD: the shopper
-- supplies bank details).
-- ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_refunds (
    refund_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(customer_id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) DEFAULT 'INR',
    method VARCHAR(20) NOT NULL CHECK (method IN ('SOURCE', 'BANK_TRANSFER')),
    source_payment_method VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED', 'APPROVED', 'PROCESSED', 'REJECTED')),
    reason TEXT,
    bank_account_name VARCHAR(150),
    bank_account_number VARCHAR(30),
    bank_ifsc VARCHAR(15),
    bank_name VARCHAR(150),
    reference VARCHAR(255),
    admin_note TEXT,
    processed_by UUID REFERENCES users(user_id),
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_date TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_order_refunds_tenant_status ON order_refunds(tenant_id, status, created_date DESC);
CREATE INDEX IF NOT EXISTS idx_order_refunds_order ON order_refunds(order_id);
-- One live refund per order at a time.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_order_refunds_active ON order_refunds(order_id) WHERE status IN ('REQUESTED', 'APPROVED');

-- RLS (defense in depth - the backend uses the service role and scopes every query by tenant_id)
ALTER TABLE order_support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_refunds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation for order_support_requests" ON order_support_requests;
CREATE POLICY "Tenant isolation for order_support_requests" ON order_support_requests
    USING (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid)
    WITH CHECK (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);

DROP POLICY IF EXISTS "Tenant isolation for order_refunds" ON order_refunds;
CREATE POLICY "Tenant isolation for order_refunds" ON order_refunds
    USING (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid)
    WITH CHECK (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);
