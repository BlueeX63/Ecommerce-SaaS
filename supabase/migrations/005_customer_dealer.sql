-- 005_customer_dealer.sql
-- CRM, Customers, and Dealers

-- Customer Groups / Pricing Tiers
CREATE TABLE customer_groups (
    group_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id) ON DELETE CASCADE,
    group_name VARCHAR(100) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id)
);

-- Customers (B2C and basic B2B)
CREATE TABLE customers (
    customer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    company_name VARCHAR(255),
    group_id UUID REFERENCES customer_groups(group_id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id),
    UNIQUE(tenant_id, email)
);

-- Dealers / Wholesale Partners (B2B2B)
CREATE TABLE dealers (
    dealer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50),
    contact_name VARCHAR(200),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    payment_terms VARCHAR(100), -- E.g., 'Net 30', 'Due on Receipt'
    credit_limit DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id),
    UNIQUE(tenant_id, company_name)
);

-- Dealer Branches
CREATE TABLE dealer_branches (
    branch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dealer_id UUID NOT NULL REFERENCES dealers(dealer_id) ON DELETE CASCADE,
    branch_name VARCHAR(150) NOT NULL,
    address_line_1 VARCHAR(255),
    city VARCHAR(100),
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    is_active BOOLEAN DEFAULT true
);

-- RLS Policies
ALTER TABLE customer_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealer_branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for customer_groups" ON customer_groups USING (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);
CREATE POLICY "Tenant isolation for customers" ON customers USING (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);
CREATE POLICY "Tenant isolation for dealers" ON dealers USING (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);
CREATE POLICY "Tenant isolation for dealer_branches" ON dealer_branches USING (dealer_id IN (SELECT dealer_id FROM dealers WHERE tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid));
