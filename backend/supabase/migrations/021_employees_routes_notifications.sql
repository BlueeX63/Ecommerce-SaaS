-- 021_employees_routes_notifications.sql
-- Warehouse employees (separate login), shipping routes, delivery history timestamps and admin notifications.
-- Idempotent: safe to run more than once.

ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;
-- Orders a warehouse can pack per day; a longer queue pushes the delivery estimate back.
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS daily_capacity INTEGER DEFAULT 50;

-- Delivery history, used to learn real transit times per warehouse and area.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_date TIMESTAMP WITH TIME ZONE;
CREATE INDEX IF NOT EXISTS idx_orders_warehouse_status ON orders(tenant_id, fulfillment_warehouse_id, status);

-- Known transit times from a warehouse to a destination (a state name or a PIN-code prefix).
CREATE TABLE IF NOT EXISTS warehouse_routes (
    route_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(warehouse_id) ON DELETE CASCADE,
    destination VARCHAR(60) NOT NULL,
    transit_min_days INTEGER NOT NULL CHECK (transit_min_days >= 0),
    transit_max_days INTEGER NOT NULL CHECK (transit_max_days >= transit_min_days),
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (warehouse_id, destination)
);

-- Warehouse staff. They sign in on the separate employee panel and only ever see their own warehouse.
CREATE TABLE IF NOT EXISTS warehouse_employees (
    employee_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(warehouse_id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(254) NOT NULL,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    -- Bumped on password reset / deactivation so existing sessions stop working.
    token_version INTEGER NOT NULL DEFAULT 0,
    last_login TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(user_id),
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_warehouse_employees_email ON warehouse_employees (lower(email));
CREATE INDEX IF NOT EXISTS idx_warehouse_employees_warehouse ON warehouse_employees(warehouse_id);

-- In-dashboard notifications for the merchant (out-of-stock alerts, ...).
CREATE TABLE IF NOT EXISTS admin_notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id) ON DELETE CASCADE,
    type VARCHAR(40) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    product_id UUID REFERENCES products(product_id) ON DELETE CASCADE,
    warehouse_id UUID REFERENCES warehouses(warehouse_id) ON DELETE CASCADE,
    dedupe_key VARCHAR(200),
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_tenant ON admin_notifications(tenant_id, is_read, created_date DESC);
-- At most one unread alert per product/warehouse situation, so a stock-out doesn't spam the bell.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_admin_notifications_unread ON admin_notifications(tenant_id, dedupe_key) WHERE is_read = false AND dedupe_key IS NOT NULL;

ALTER TABLE warehouse_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation for warehouse_routes" ON warehouse_routes;
CREATE POLICY "Tenant isolation for warehouse_routes" ON warehouse_routes
    USING (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid) WITH CHECK (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);
DROP POLICY IF EXISTS "Tenant isolation for warehouse_employees" ON warehouse_employees;
CREATE POLICY "Tenant isolation for warehouse_employees" ON warehouse_employees
    USING (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid) WITH CHECK (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);
DROP POLICY IF EXISTS "Tenant isolation for admin_notifications" ON admin_notifications;
CREATE POLICY "Tenant isolation for admin_notifications" ON admin_notifications
    USING (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid) WITH CHECK (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);
