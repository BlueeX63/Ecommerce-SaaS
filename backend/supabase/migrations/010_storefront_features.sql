-- 010_storefront_features.sql
-- Storefront specific features: carts, wishlists, addresses, auth enhancements

-- 1. Enhance customers table for auth
ALTER TABLE customers ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- 2. Customer Addresses
CREATE TABLE IF NOT EXISTS customer_addresses (
    address_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, customer_id, address_id)
);

-- 3. Carts
CREATE TABLE IF NOT EXISTS carts (
    cart_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(customer_id) ON DELETE CASCADE, -- Nullable for guest carts
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, customer_id) -- A customer can only have one active cart per tenant
);

CREATE TABLE IF NOT EXISTS cart_items (
    cart_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES carts(cart_id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(variant_id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    added_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cart_id, product_id, variant_id)
);

-- 4. Wishlists
CREATE TABLE IF NOT EXISTS wishlists (
    wishlist_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, customer_id) -- One wishlist per customer per tenant
);

CREATE TABLE IF NOT EXISTS wishlist_items (
    wishlist_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wishlist_id UUID NOT NULL REFERENCES wishlists(wishlist_id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    added_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(wishlist_id, product_id)
);

-- 5. Link Reviews to Order Items
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS order_item_id UUID REFERENCES order_items(order_item_id) ON DELETE SET NULL;
-- Ensure a review is strictly linked to an order item and tenant
-- A customer can review an order item only once
ALTER TABLE reviews ADD CONSTRAINT unique_tenant_customer_order_item UNIQUE (tenant_id, customer_id, order_item_id);


-- RLS Policies
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for customer_addresses" ON customer_addresses USING (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);
CREATE POLICY "Tenant isolation for carts" ON carts USING (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);
CREATE POLICY "Tenant isolation for cart_items" ON cart_items USING (cart_id IN (SELECT cart_id FROM carts WHERE tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid));
CREATE POLICY "Tenant isolation for wishlists" ON wishlists USING (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);
CREATE POLICY "Tenant isolation for wishlist_items" ON wishlist_items USING (wishlist_id IN (SELECT wishlist_id FROM wishlists WHERE tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid));
ALTER TABLE customers ADD CONSTRAINT unique_tenant_phone UNIQUE (tenant_id, phone_number);
