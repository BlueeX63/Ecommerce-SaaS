-- 003_product_catalog.sql
-- Product Catalog, Categories, and Variants

-- Categories Table
CREATE TABLE categories (
    category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id) ON DELETE CASCADE,
    parent_category_id UUID REFERENCES categories(category_id) ON DELETE SET NULL,
    category_name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id),
    UNIQUE(tenant_id, slug)
);

-- Products Table
CREATE TABLE products (
    product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(category_id),
    product_name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL,
    sku VARCHAR(100),
    barcode VARCHAR(100),
    description TEXT,
    base_price DECIMAL(12,2) NOT NULL,
    compare_at_price DECIMAL(12,2),
    cost_price DECIMAL(12,2),
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'ARCHIVED')),
    has_variants BOOLEAN DEFAULT false,
    three_d_model_url VARCHAR(255),
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id),
    updated_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(user_id),
    UNIQUE(tenant_id, slug),
    UNIQUE(tenant_id, sku)
);

-- Product Images
CREATE TABLE product_images (
    image_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    image_url VARCHAR(255) NOT NULL,
    alt_text VARCHAR(100),
    is_primary BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0
);

-- Product Options (e.g., Size, Color)
CREATE TABLE product_options (
    option_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    option_name VARCHAR(50) NOT NULL, -- e.g., 'Size', 'Color'
    sort_order INTEGER DEFAULT 0,
    UNIQUE(product_id, option_name)
);

-- Product Option Values (e.g., 'Small', 'Red')
CREATE TABLE product_option_values (
    value_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    option_id UUID NOT NULL REFERENCES product_options(option_id) ON DELETE CASCADE,
    value_name VARCHAR(50) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    UNIQUE(option_id, value_name)
);

-- Product Variants
CREATE TABLE product_variants (
    variant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    sku VARCHAR(100),
    barcode VARCHAR(100),
    price DECIMAL(12,2), -- overrides product base_price if set
    compare_at_price DECIMAL(12,2),
    cost_price DECIMAL(12,2),
    inventory_quantity INTEGER DEFAULT 0,
    UNIQUE(product_id, sku)
);

-- Variant Option Map (links a variant to its specific option values)
CREATE TABLE variant_options (
    variant_id UUID NOT NULL REFERENCES product_variants(variant_id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES product_options(option_id) ON DELETE CASCADE,
    value_id UUID NOT NULL REFERENCES product_option_values(value_id) ON DELETE CASCADE,
    PRIMARY KEY (variant_id, option_id)
);

-- RLS Policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_option_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for categories" ON categories USING (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);
CREATE POLICY "Tenant isolation for products" ON products USING (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);
CREATE POLICY "Tenant isolation for product_images" ON product_images USING (product_id IN (SELECT product_id FROM products WHERE tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid));
CREATE POLICY "Tenant isolation for product_options" ON product_options USING (product_id IN (SELECT product_id FROM products WHERE tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid));
CREATE POLICY "Tenant isolation for product_option_values" ON product_option_values USING (option_id IN (SELECT option_id FROM product_options WHERE product_id IN (SELECT product_id FROM products WHERE tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid)));
CREATE POLICY "Tenant isolation for product_variants" ON product_variants USING (product_id IN (SELECT product_id FROM products WHERE tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid));
CREATE POLICY "Tenant isolation for variant_options" ON variant_options USING (variant_id IN (SELECT variant_id FROM product_variants WHERE product_id IN (SELECT product_id FROM products WHERE tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid)));
