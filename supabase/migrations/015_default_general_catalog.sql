-- 015_default_general_catalog.sql

-- 1. Insert 'General' catalog for all existing tenants that don't have one
INSERT INTO catalogs (tenant_id, catalog_name, slug, catalog_type, description, is_active)
SELECT t.tenant_id, 'General Catalog', 'general-catalog', 'GENERAL', 'Default general catalog for all public products', true
FROM tenant t
WHERE NOT EXISTS (
    SELECT 1 FROM catalogs c WHERE c.tenant_id = t.tenant_id AND c.catalog_type = 'GENERAL'
);

-- 2. Create trigger function to automatically create 'General' catalog for new tenants
CREATE OR REPLACE FUNCTION create_default_catalog_for_tenant()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO catalogs (tenant_id, catalog_name, slug, catalog_type, description, is_active)
    VALUES (NEW.tenant_id, 'General Catalog', 'general-catalog', 'GENERAL', 'Default general catalog for all public products', true);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Attach trigger to tenant table
DROP TRIGGER IF EXISTS trigger_create_default_catalog ON tenant;
CREATE TRIGGER trigger_create_default_catalog
AFTER INSERT ON tenant
FOR EACH ROW
EXECUTE FUNCTION create_default_catalog_for_tenant();
