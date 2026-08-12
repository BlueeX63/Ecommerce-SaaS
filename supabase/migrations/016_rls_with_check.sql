-- 016_rls_with_check.sql
-- Adds WITH CHECK clauses to all RLS policies to prevent cross-tenant data injection

-- 001_foundation.sql
ALTER POLICY "Tenant isolation for tenant settings" ON tenant_settings
    WITH CHECK (tenant_id = (select auth.jwt()->>'tenant_id')::uuid);

ALTER POLICY "Tenant isolation for tenant branding" ON tenant_branding
    WITH CHECK (tenant_id = (select auth.jwt()->>'tenant_id')::uuid);

ALTER POLICY "Tenant isolation for tenant domain" ON tenant_domain
    WITH CHECK (tenant_id = (select auth.jwt()->>'tenant_id')::uuid);

ALTER POLICY "Tenant isolation for tenant features" ON tenant_features
    WITH CHECK (tenant_id = (select auth.jwt()->>'tenant_id')::uuid);

ALTER POLICY "Tenant isolation for license" ON license
    WITH CHECK (tenant_id = (select auth.jwt()->>'tenant_id')::uuid);

ALTER POLICY "Tenant isolation for api keys" ON api_keys
    WITH CHECK (tenant_id = (select auth.jwt()->>'tenant_id')::uuid);

ALTER POLICY "Tenant isolation for webhooks" ON webhooks
    WITH CHECK (tenant_id = (select auth.jwt()->>'tenant_id')::uuid);

ALTER POLICY "Tenant isolation for users" ON users
    WITH CHECK (tenant_id = (select auth.jwt()->>'tenant_id')::uuid);

ALTER POLICY "Tenant isolation for roles" ON roles
    WITH CHECK (tenant_id = (select auth.jwt()->>'tenant_id')::uuid);

ALTER POLICY "Tenant isolation for audit log" ON audit_log
    WITH CHECK (tenant_id = (select auth.jwt()->>'tenant_id')::uuid);


-- 003_product_catalog.sql
ALTER POLICY "Tenant isolation for categories" ON categories 
    WITH CHECK (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);

ALTER POLICY "Tenant isolation for products" ON products 
    WITH CHECK (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);

ALTER POLICY "Tenant isolation for product_images" ON product_images 
    WITH CHECK (product_id IN (SELECT product_id FROM products WHERE tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid));

ALTER POLICY "Tenant isolation for product_options" ON product_options 
    WITH CHECK (product_id IN (SELECT product_id FROM products WHERE tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid));

ALTER POLICY "Tenant isolation for product_option_values" ON product_option_values 
    WITH CHECK (option_id IN (SELECT option_id FROM product_options WHERE product_id IN (SELECT product_id FROM products WHERE tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid)));

ALTER POLICY "Tenant isolation for product_variants" ON product_variants 
    WITH CHECK (product_id IN (SELECT product_id FROM products WHERE tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid));

ALTER POLICY "Tenant isolation for variant_options" ON variant_options 
    WITH CHECK (variant_id IN (SELECT variant_id FROM product_variants WHERE product_id IN (SELECT product_id FROM products WHERE tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid)));


-- 004_inventory_warehouse.sql
ALTER POLICY "Tenant isolation for warehouses" ON warehouses 
    WITH CHECK (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);

ALTER POLICY "Tenant isolation for inventory" ON inventory 
    WITH CHECK (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);

ALTER POLICY "Tenant isolation for inventory_transactions" ON inventory_transactions 
    WITH CHECK (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);


-- 005_customer_dealer.sql
ALTER POLICY "Tenant isolation for customer_groups" ON customer_groups 
    WITH CHECK (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);

ALTER POLICY "Tenant isolation for customers" ON customers 
    WITH CHECK (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);

ALTER POLICY "Tenant isolation for dealers" ON dealers 
    WITH CHECK (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);

ALTER POLICY "Tenant isolation for dealer_branches" ON dealer_branches 
    WITH CHECK (dealer_id IN (SELECT dealer_id FROM dealers WHERE tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid));


-- 006_orders.sql
ALTER POLICY "Tenant isolation for orders" ON orders 
    WITH CHECK (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);

ALTER POLICY "Tenant isolation for order_items" ON order_items 
    WITH CHECK (order_id IN (SELECT order_id FROM orders WHERE tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid));

ALTER POLICY "Tenant isolation for fulfillments" ON fulfillments 
    WITH CHECK (order_id IN (SELECT order_id FROM orders WHERE tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid));


-- 007_payment_invoice.sql
ALTER POLICY "Tenant isolation for invoices" ON invoices 
    WITH CHECK (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);

ALTER POLICY "Tenant isolation for payments" ON payments 
    WITH CHECK (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);


-- 008_coupons.sql
ALTER POLICY "Tenant isolation for coupons" ON coupons 
    WITH CHECK (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);


-- 009_reviews.sql
ALTER POLICY "Tenant isolation for reviews" ON reviews 
    WITH CHECK (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);


-- 010_storefront_features.sql
ALTER POLICY "Tenant isolation for customer_addresses" ON customer_addresses 
    WITH CHECK (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);

ALTER POLICY "Tenant isolation for carts" ON carts 
    WITH CHECK (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);

ALTER POLICY "Tenant isolation for cart_items" ON cart_items 
    WITH CHECK (cart_id IN (SELECT cart_id FROM carts WHERE tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid));

ALTER POLICY "Tenant isolation for wishlists" ON wishlists 
    WITH CHECK (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);

ALTER POLICY "Tenant isolation for wishlist_items" ON wishlist_items 
    WITH CHECK (wishlist_id IN (SELECT wishlist_id FROM wishlists WHERE tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid));


-- 011_delivery_and_coupons.sql
ALTER POLICY "Tenant isolation for delivery_options" ON delivery_options 
    WITH CHECK (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);


-- 012_multi_catalogs.sql
ALTER POLICY "Tenant isolation for catalogs" ON catalogs 
    WITH CHECK (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);

ALTER POLICY "Tenant isolation for catalog_products" ON catalog_products 
    WITH CHECK (catalog_id IN (SELECT catalog_id FROM catalogs WHERE tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid));

ALTER POLICY "Tenant isolation for catalog_customers" ON catalog_customers 
    WITH CHECK (catalog_id IN (SELECT catalog_id FROM catalogs WHERE tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid));
