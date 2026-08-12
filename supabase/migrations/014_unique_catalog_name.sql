ALTER TABLE catalogs ADD CONSTRAINT unique_tenant_catalog_name UNIQUE (tenant_id, catalog_name);
