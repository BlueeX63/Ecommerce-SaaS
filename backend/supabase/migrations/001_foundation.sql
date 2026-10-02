-- 001_foundation.sql
-- Core Tenant, User, and RBAC Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-----------------------------------------
-- 1. TENANT MANAGEMENT
-----------------------------------------

CREATE TABLE subscription_plan (
    plan_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_name VARCHAR(150) NOT NULL,
    description VARCHAR(255),
    duration_type VARCHAR(250) NOT NULL, -- (Monthly/Yearly)
    price DECIMAL(18,2) NOT NULL,
    max_users INT NOT NULL,
    max_warehouses INT NOT NULL,
    max_products INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE tenant (
    tenant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_name VARCHAR(150) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID -- will refer to user later
);

CREATE TABLE tenant_settings (
    setting_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, setting_key)
);

CREATE TABLE tenant_branding (
    branding_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID UNIQUE NOT NULL REFERENCES tenant(tenant_id) ON DELETE CASCADE,
    logo_url VARCHAR(255),
    favicon_url VARCHAR(255),
    primary_color VARCHAR(20),
    secondary_color VARCHAR(20),
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE tenant_domain (
    domain_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id) ON DELETE CASCADE,
    domain VARCHAR(255) UNIQUE NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    verified BOOLEAN DEFAULT false,
    ssl_status VARCHAR(20),
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE tenant_features (
    tenant_feature_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id) ON DELETE CASCADE,
    feature_code VARCHAR(50) NOT NULL,
    is_enabled BOOLEAN DEFAULT false,
    allowed_limit INT,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, feature_code)
);

CREATE TABLE license (
    license_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID UNIQUE NOT NULL REFERENCES tenant(tenant_id) ON DELETE CASCADE,
    license_key VARCHAR(100) UNIQUE NOT NULL,
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_to TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE api_keys (
    api_key_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id) ON DELETE CASCADE,
    key_name VARCHAR(150) NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_on TIMESTAMP WITH TIME ZONE
);

CREATE TABLE webhooks (
    webhook_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id) ON DELETE CASCADE,
    webhook_url VARCHAR(255) NOT NULL,
    secret_key VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-----------------------------------------
-- 2. USER & RBAC
-----------------------------------------

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenant(tenant_id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add created_by FK to tenant now that users table exists
ALTER TABLE tenant ADD CONSTRAINT fk_tenant_created_by FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL;

CREATE TABLE user_profiles (
    user_profile_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    avatar_url VARCHAR(255),
    date_of_birth DATE,
    gender VARCHAR(20),
    language VARCHAR(20) DEFAULT 'en',
    time_zone VARCHAR(50) DEFAULT 'UTC',
    address TEXT,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    refresh_token VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    logout_time TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE roles (
    role_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenant(tenant_id) ON DELETE CASCADE,
    role_name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, role_name)
);

CREATE TABLE user_roles (
    user_role_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    assigned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    UNIQUE(user_id, role_id)
);

CREATE TABLE role_hierarchy (
    role_hierarchy_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_role_id UUID NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    child_role_id UUID NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(parent_role_id, child_role_id)
);

CREATE TABLE modules (
    module_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_module_id UUID REFERENCES modules(module_id) ON DELETE CASCADE,
    module_name VARCHAR(100) NOT NULL,
    module_code VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(100),
    sort_order INT DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE permissions (
    permission_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES modules(module_id) ON DELETE CASCADE,
    permission_name VARCHAR(100) NOT NULL,
    permission_code VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE role_permissions (
    role_permission_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(permission_id) ON DELETE CASCADE,
    is_allowed BOOLEAN DEFAULT true,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

CREATE TABLE audit_log (
    audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenant(tenant_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    action VARCHAR(150) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-----------------------------------------
-- ROW LEVEL SECURITY (RLS)
-----------------------------------------
-- Enable RLS on all tenant-aware tables

ALTER TABLE tenant ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_domain ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE license ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Default RLS Policies assuming auth.jwt() contains tenant_id
-- These are basic policies to enforce tenant isolation

CREATE POLICY "Tenant isolation for tenant settings" ON tenant_settings
    FOR ALL USING (tenant_id = (select auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "Tenant isolation for tenant branding" ON tenant_branding
    FOR ALL USING (tenant_id = (select auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "Tenant isolation for tenant domain" ON tenant_domain
    FOR ALL USING (tenant_id = (select auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "Tenant isolation for tenant features" ON tenant_features
    FOR ALL USING (tenant_id = (select auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "Tenant isolation for license" ON license
    FOR ALL USING (tenant_id = (select auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "Tenant isolation for api keys" ON api_keys
    FOR ALL USING (tenant_id = (select auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "Tenant isolation for webhooks" ON webhooks
    FOR ALL USING (tenant_id = (select auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "Tenant isolation for users" ON users
    FOR ALL USING (tenant_id = (select auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "Tenant isolation for roles" ON roles
    FOR ALL USING (tenant_id = (select auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "Tenant isolation for audit log" ON audit_log
    FOR ALL USING (tenant_id = (select auth.jwt()->>'tenant_id')::uuid);
