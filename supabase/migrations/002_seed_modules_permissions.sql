-- 002_seed_modules_permissions.sql
-- Initial seed data for standard SaaS modules and permissions

-- 1. Insert Standard Modules
INSERT INTO modules (module_name, module_code, icon, sort_order) VALUES
('Dashboard', 'MOD_DASHBOARD', 'LayoutDashboard', 10),
('Products', 'MOD_PRODUCTS', 'Package', 20),
('Inventory', 'MOD_INVENTORY', 'Boxes', 30),
('Orders', 'MOD_ORDERS', 'ShoppingCart', 40),
('Customers', 'MOD_CUSTOMERS', 'Users', 50),
('Dealers', 'MOD_DEALERS', 'Briefcase', 60),
('Invoices', 'MOD_INVOICES', 'FileText', 70),
('Payments', 'MOD_PAYMENTS', 'CreditCard', 80),
('Reports', 'MOD_REPORTS', 'BarChart', 90),
('Settings', 'MOD_SETTINGS', 'Settings', 100),
('Users & Roles', 'MOD_USERS', 'ShieldCheck', 110)
ON CONFLICT (module_code) DO NOTHING;

-- Function to safely insert permissions based on module code
CREATE OR REPLACE FUNCTION seed_permissions(p_module_code VARCHAR, p_permissions JSON)
RETURNS void AS $$
DECLARE
    v_module_id UUID;
    v_perm JSON;
BEGIN
    SELECT module_id INTO v_module_id FROM modules WHERE module_code = p_module_code;
    
    IF v_module_id IS NOT NULL THEN
        FOR v_perm IN SELECT * FROM json_array_elements(p_permissions)
        LOOP
            INSERT INTO permissions (module_id, permission_name, permission_code, description)
            VALUES (
                v_module_id, 
                v_perm->>'name', 
                v_perm->>'code', 
                v_perm->>'desc'
            )
            ON CONFLICT (permission_code) DO NOTHING;
        END LOOP;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. Insert Permissions for each module

DO $$ 
BEGIN
-- Dashboard Permissions
PERFORM seed_permissions('MOD_DASHBOARD', '[
    {"name": "View Dashboard", "code": "PERM_DASHBOARD_VIEW", "desc": "Can view the main dashboard metrics"}
]');

-- Products Permissions
PERFORM seed_permissions('MOD_PRODUCTS', '[
    {"name": "View Products", "code": "PERM_PRODUCTS_VIEW", "desc": "Can view product list and details"},
    {"name": "Create Products", "code": "PERM_PRODUCTS_CREATE", "desc": "Can create new products"},
    {"name": "Edit Products", "code": "PERM_PRODUCTS_EDIT", "desc": "Can edit existing products"},
    {"name": "Delete Products", "code": "PERM_PRODUCTS_DELETE", "desc": "Can soft-delete products"},
    {"name": "Manage Categories", "code": "PERM_CATEGORIES_MANAGE", "desc": "Can manage product categories"},
    {"name": "Manage Brands", "code": "PERM_BRANDS_MANAGE", "desc": "Can manage product brands"}
]');

-- Inventory Permissions
PERFORM seed_permissions('MOD_INVENTORY', '[
    {"name": "View Inventory", "code": "PERM_INVENTORY_VIEW", "desc": "Can view stock levels"},
    {"name": "Adjust Stock", "code": "PERM_INVENTORY_ADJUST", "desc": "Can make manual stock adjustments"},
    {"name": "Transfer Stock", "code": "PERM_INVENTORY_TRANSFER", "desc": "Can transfer stock between warehouses"},
    {"name": "Manage Warehouses", "code": "PERM_WAREHOUSE_MANAGE", "desc": "Can manage warehouses, zones, and bins"}
]');

-- Orders Permissions
PERFORM seed_permissions('MOD_ORDERS', '[
    {"name": "View Orders", "code": "PERM_ORDERS_VIEW", "desc": "Can view order list and details"},
    {"name": "Process Orders", "code": "PERM_ORDERS_PROCESS", "desc": "Can update order statuses and process fulfillments"},
    {"name": "Manage Returns", "code": "PERM_ORDERS_RETURNS", "desc": "Can process order returns"}
]');

-- Customers Permissions
PERFORM seed_permissions('MOD_CUSTOMERS', '[
    {"name": "View Customers", "code": "PERM_CUSTOMERS_VIEW", "desc": "Can view customer list and details"},
    {"name": "Manage Customers", "code": "PERM_CUSTOMERS_MANAGE", "desc": "Can create, edit, and delete customers"},
    {"name": "Manage Groups", "code": "PERM_CUSTOMER_GROUPS", "desc": "Can manage customer groups and pricing tiers"}
]');

-- Dealers Permissions
PERFORM seed_permissions('MOD_DEALERS', '[
    {"name": "View Dealers", "code": "PERM_DEALERS_VIEW", "desc": "Can view dealer list and details"},
    {"name": "Manage Dealers", "code": "PERM_DEALERS_MANAGE", "desc": "Can create, edit, and delete dealers and branches"}
]');

-- Invoices Permissions
PERFORM seed_permissions('MOD_INVOICES', '[
    {"name": "View Invoices", "code": "PERM_INVOICES_VIEW", "desc": "Can view invoices and credit notes"},
    {"name": "Generate Invoices", "code": "PERM_INVOICES_CREATE", "desc": "Can generate new invoices"},
    {"name": "Void Invoices", "code": "PERM_INVOICES_VOID", "desc": "Can void existing invoices"}
]');

-- Payments Permissions
PERFORM seed_permissions('MOD_PAYMENTS', '[
    {"name": "View Payments", "code": "PERM_PAYMENTS_VIEW", "desc": "Can view payment history"},
    {"name": "Record Payments", "code": "PERM_PAYMENTS_RECORD", "desc": "Can manually record offline payments"},
    {"name": "Process Refunds", "code": "PERM_PAYMENTS_REFUND", "desc": "Can process payment refunds"}
]');

-- Settings Permissions
PERFORM seed_permissions('MOD_SETTINGS', '[
    {"name": "Manage General Settings", "code": "PERM_SETTINGS_GENERAL", "desc": "Can manage tenant branding, domains, and core settings"},
    {"name": "Manage API Keys", "code": "PERM_SETTINGS_API", "desc": "Can generate and revoke API keys"},
    {"name": "Manage Webhooks", "code": "PERM_SETTINGS_WEBHOOKS", "desc": "Can configure webhooks"}
]');

-- Users & Roles Permissions
PERFORM seed_permissions('MOD_USERS', '[
    {"name": "View Users", "code": "PERM_USERS_VIEW", "desc": "Can view tenant users"},
    {"name": "Manage Users", "code": "PERM_USERS_MANAGE", "desc": "Can invite, edit, and remove users"},
    {"name": "Manage Roles", "code": "PERM_ROLES_MANAGE", "desc": "Can create and edit roles and permissions"}
]');
END $$;

-- Cleanup function
DROP FUNCTION seed_permissions;
