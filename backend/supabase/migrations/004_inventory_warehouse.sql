-- 004_inventory_warehouse.sql
-- Inventory and Warehouse Management

-- Warehouses
CREATE TABLE warehouses (
    warehouse_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id) ON DELETE CASCADE,
    warehouse_name VARCHAR(100) NOT NULL,
    address_line_1 VARCHAR(255),
    address_line_2 VARCHAR(255),
    city VARCHAR(100),
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id)
);

-- Inventory (Stock mapping between Variant and Warehouse)
CREATE TABLE inventory (
    inventory_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES product_variants(variant_id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(warehouse_id) ON DELETE CASCADE,
    quantity_available INTEGER DEFAULT 0,
    quantity_reserved INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(variant_id, warehouse_id)
);

-- Inventory Transactions (Audit log for stock changes)
CREATE TABLE inventory_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id) ON DELETE CASCADE,
    inventory_id UUID NOT NULL REFERENCES inventory(inventory_id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('MANUAL_ADJUSTMENT', 'PURCHASE_RECEIPT', 'SALES_ORDER', 'RETURN', 'TRANSFER')),
    quantity_change INTEGER NOT NULL,
    reference_id UUID, -- E.g., Order ID or Transfer ID
    notes TEXT,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id)
);

-- RLS Policies
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for warehouses" ON warehouses USING (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);
CREATE POLICY "Tenant isolation for inventory" ON inventory USING (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);
CREATE POLICY "Tenant isolation for inventory_transactions" ON inventory_transactions USING (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);
