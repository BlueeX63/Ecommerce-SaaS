-- Add custom_domain column to tenant table
ALTER TABLE tenant
ADD COLUMN custom_domain TEXT UNIQUE;

-- Create an index for fast lookups
CREATE INDEX IF NOT EXISTS idx_tenant_custom_domain ON tenant(custom_domain);
