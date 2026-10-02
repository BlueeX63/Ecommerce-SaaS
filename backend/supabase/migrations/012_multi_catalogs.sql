-- 012_multi_catalogs.sql
-- Adds support for multiple catalogs with custom pricing and access control.

-- Catalogs Table
CREATE TABLE catalogs (
    catalog_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id) ON DELETE CASCADE,
    catalog_name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL,
    catalog_type VARCHAR(20) DEFAULT 'GENERAL' CHECK (catalog_type IN ('GENERAL', 'SPECIAL')),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id),
    updated_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(user_id),
    UNIQUE(tenant_id, slug)
);

-- Catalog Products (Mapping Table for Products in a Catalog)
-- This allows different catalogs to have different products and custom prices.
CREATE TABLE catalog_products (
    catalog_id UUID NOT NULL REFERENCES catalogs(catalog_id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    price_override DECIMAL(12,2), -- Custom price for this product in this catalog (if null, falls back to product base_price)
    compare_at_price_override DECIMAL(12,2),
    is_active BOOLEAN DEFAULT true,
    added_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (catalog_id, product_id)
);

-- Catalog Customers (Access Control for Special Catalogs)
CREATE TABLE catalog_customers (
    catalog_id UUID NOT NULL REFERENCES catalogs(catalog_id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(customer_id) ON DELETE CASCADE,
    phone_number VARCHAR(20),
    added_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Ensure we link either a customer_id or a phone_number
    CHECK (customer_id IS NOT NULL OR phone_number IS NOT NULL),
    UNIQUE(catalog_id, customer_id),
    UNIQUE(catalog_id, phone_number)
);

-- Enable RLS
ALTER TABLE catalogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Tenant isolation for catalogs" ON catalogs 
    USING (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "Tenant isolation for catalog_products" ON catalog_products 
    USING (catalog_id IN (SELECT catalog_id FROM catalogs WHERE tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid));

CREATE POLICY "Tenant isolation for catalog_customers" ON catalog_customers 
    USING (catalog_id IN (SELECT catalog_id FROM catalogs WHERE tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid));

-- Allow storefront API to read catalogs if it is public 'GENERAL' or if they are assigned.
-- (This policy assumes you have an anonymous/public role or a way to distinguish storefront requests)
CREATE POLICY "Storefront read access to catalogs" ON catalogs FOR SELECT
    USING (
        is_active = true AND 
        (
            catalog_type = 'GENERAL' 
            -- Note: Special catalog access will be handled via backend logic matching phone_number/customer_id
        )
    );
