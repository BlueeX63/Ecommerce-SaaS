-- 022_order_assignment_activity.sql
-- Employee panel, part 2:
--   * an audit trail of what warehouse employees (and the merchant) change, with before/after quantities
--   * orders that can be claimed by an employee, taken from an "unassigned" pool, or moved between warehouses
--   * atomic stock functions, so a stock change / order move is ONE transaction and ONE round trip (no read-modify-write
--     races, no ledger row lost between two statements)
-- Idempotent: safe to run more than once.

-- ---------------------------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------------------------

-- Order lines remember which product they were for, so stock can be moved between warehouses exactly.
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(product_id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- Best-effort backfill for orders that are still open (the only ones that can be moved): SKU first, then exact name.
UPDATE order_items oi SET product_id = p.product_id
FROM orders o, products p
WHERE oi.product_id IS NULL AND o.order_id = oi.order_id AND o.status IN ('PENDING', 'PROCESSING')
  AND p.tenant_id = o.tenant_id AND oi.sku IS NOT NULL AND oi.sku <> '' AND p.sku = oi.sku;
UPDATE order_items oi SET product_id = p.product_id
FROM orders o, products p
WHERE oi.product_id IS NULL AND o.order_id = oi.order_id AND o.status IN ('PENDING', 'PROCESSING')
  AND p.tenant_id = o.tenant_id AND lower(p.product_name) = lower(oi.product_name);

-- Which employee is packing the order, and when it last changed hands.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS claimed_by_employee_id UUID REFERENCES warehouse_employees(employee_id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS claimed_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_date TIMESTAMP WITH TIME ZONE;
-- The "unassigned pool" employees can take orders from.
CREATE INDEX IF NOT EXISTS idx_orders_pool ON orders(tenant_id, created_date) WHERE fulfillment_warehouse_id IS NULL AND status IN ('PENDING', 'PROCESSING');
CREATE INDEX IF NOT EXISTS idx_orders_claimed ON orders(claimed_by_employee_id) WHERE claimed_by_employee_id IS NOT NULL;

-- Stock ledger: who did it and what the quantity became.
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS actor_employee_id UUID REFERENCES warehouse_employees(employee_id) ON DELETE SET NULL;
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS actor_name VARCHAR(150);
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS quantity_after INTEGER;
CREATE INDEX IF NOT EXISTS idx_inv_tx_inventory ON inventory_transactions(tenant_id, inventory_id, created_date DESC);
CREATE INDEX IF NOT EXISTS idx_inv_tx_reference ON inventory_transactions(reference_id) WHERE reference_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inv_tx_actor ON inventory_transactions(tenant_id, actor_employee_id, created_date DESC) WHERE actor_employee_id IS NOT NULL;

-- ---------------------------------------------------------------------------------------------
-- Activity feed (what the merchant monitors)
-- ---------------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS warehouse_activity (
    activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id) ON DELETE CASCADE,
    actor_type VARCHAR(10) NOT NULL DEFAULT 'EMPLOYEE' CHECK (actor_type IN ('EMPLOYEE', 'ADMIN')),
    employee_id UUID REFERENCES warehouse_employees(employee_id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    -- Names are copied in so history stays readable after an employee, product or warehouse is renamed or removed.
    actor_name VARCHAR(150),
    warehouse_id UUID REFERENCES warehouses(warehouse_id) ON DELETE SET NULL,
    warehouse_name VARCHAR(100),
    action VARCHAR(40) NOT NULL,
    product_id UUID REFERENCES products(product_id) ON DELETE SET NULL,
    product_name VARCHAR(255),
    order_id UUID REFERENCES orders(order_id) ON DELETE SET NULL,
    order_number VARCHAR(100),
    quantity_before INTEGER,
    quantity_after INTEGER,
    quantity_change INTEGER,
    note TEXT,
    details JSONB,
    created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_wh_activity_feed ON warehouse_activity(tenant_id, created_date DESC, activity_id DESC);
CREATE INDEX IF NOT EXISTS idx_wh_activity_employee ON warehouse_activity(tenant_id, employee_id, created_date DESC);
CREATE INDEX IF NOT EXISTS idx_wh_activity_product ON warehouse_activity(tenant_id, product_id, created_date DESC);
CREATE INDEX IF NOT EXISTS idx_wh_activity_warehouse ON warehouse_activity(tenant_id, warehouse_id, created_date DESC);
CREATE INDEX IF NOT EXISTS idx_wh_activity_order ON warehouse_activity(order_id) WHERE order_id IS NOT NULL;

ALTER TABLE warehouse_activity ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for warehouse_activity" ON warehouse_activity;
CREATE POLICY "Tenant isolation for warehouse_activity" ON warehouse_activity
    USING (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid) WITH CHECK (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);

-- ---------------------------------------------------------------------------------------------
-- adjust_inventory: add/remove units (or set the exact quantity) at one warehouse - atomically.
-- Locks the stock row, so concurrent changes queue up instead of overwriting each other, and writes the ledger row
-- (with the actor and the resulting quantity) in the same transaction.
-- ---------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION adjust_inventory(
    p_tenant UUID, p_warehouse UUID, p_variant UUID,
    p_change INTEGER DEFAULT NULL, p_set_to INTEGER DEFAULT NULL,
    p_type TEXT DEFAULT 'MANUAL_ADJUSTMENT', p_notes TEXT DEFAULT NULL,
    p_user UUID DEFAULT NULL, p_employee UUID DEFAULT NULL, p_actor_name TEXT DEFAULT NULL
) RETURNS TABLE (inventory_id UUID, quantity_before INTEGER, quantity_after INTEGER)
LANGUAGE plpgsql AS $$
DECLARE
    inv inventory%ROWTYPE;
    v_change INTEGER;
BEGIN
    IF (p_change IS NULL) = (p_set_to IS NULL) THEN
        RAISE EXCEPTION 'BAD_REQUEST' USING ERRCODE = 'P0001', DETAIL = 'Provide exactly one of p_change / p_set_to';
    END IF;
    IF p_set_to IS NOT NULL AND p_set_to < 0 THEN
        RAISE EXCEPTION 'INSUFFICIENT_STOCK' USING ERRCODE = 'P0001', DETAIL = 'Stock cannot be negative';
    END IF;

    PERFORM 1 FROM warehouses w WHERE w.warehouse_id = p_warehouse AND w.tenant_id = p_tenant;
    IF NOT FOUND THEN RAISE EXCEPTION 'WAREHOUSE_NOT_FOUND' USING ERRCODE = 'P0001'; END IF;
    PERFORM 1 FROM product_variants v JOIN products p ON p.product_id = v.product_id WHERE v.variant_id = p_variant AND p.tenant_id = p_tenant;
    IF NOT FOUND THEN RAISE EXCEPTION 'VARIANT_NOT_FOUND' USING ERRCODE = 'P0001'; END IF;

    -- Make sure the row exists (tracking a product at a warehouse with nothing on hand is a valid state), then lock it.
    -- A failed negative change rolls this insert back with the rest of the transaction.
    INSERT INTO inventory AS i (tenant_id, variant_id, warehouse_id, quantity_available)
    VALUES (p_tenant, p_variant, p_warehouse, 0)
    ON CONFLICT (variant_id, warehouse_id) DO NOTHING;
    SELECT * INTO inv FROM inventory i WHERE i.variant_id = p_variant AND i.warehouse_id = p_warehouse AND i.tenant_id = p_tenant FOR UPDATE;

    v_change := COALESCE(p_change, p_set_to - inv.quantity_available);
    IF inv.quantity_available + v_change < 0 THEN
        RAISE EXCEPTION 'INSUFFICIENT_STOCK' USING ERRCODE = 'P0001', DETAIL = 'Insufficient stock';
    END IF;

    inventory_id := inv.inventory_id;
    quantity_before := inv.quantity_available;
    quantity_after := inv.quantity_available + v_change;
    IF v_change = 0 THEN RETURN NEXT; RETURN; END IF;

    UPDATE inventory i SET quantity_available = quantity_after, last_updated = now() WHERE i.inventory_id = inv.inventory_id;
    INSERT INTO inventory_transactions (tenant_id, inventory_id, transaction_type, quantity_change, quantity_after, notes, created_by, actor_employee_id, actor_name)
    VALUES (p_tenant, inv.inventory_id, p_type, v_change, quantity_after, p_notes, p_user, p_employee, p_actor_name);
    RETURN NEXT;
END $$;

-- ---------------------------------------------------------------------------------------------
-- allocate_order_stock: checkout takes the ordered quantities out of the planned warehouses - one call, one
-- transaction. If any line cannot be covered, INSUFFICIENT_STOCK is raised and nothing was taken (no manual rollback).
--   p_lines: [{"product_id": "...", "warehouse_id": "...", "quantity": 2}, ...]  (only tracked lines)
-- ---------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION allocate_order_stock(p_tenant UUID, p_order UUID, p_lines JSONB)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    l RECORD;
    v_row RECORD;
    v_need INTEGER;
    v_take INTEGER;
    v_after INTEGER;
    v_lock_ids UUID[];
BEGIN
    -- Same global lock order as move_order_to_warehouse, so concurrent checkouts and moves cannot deadlock.
    SELECT array_agg(DISTINCT i.inventory_id ORDER BY i.inventory_id) INTO v_lock_ids
    FROM jsonb_to_recordset(p_lines) AS x(product_id UUID, warehouse_id UUID, quantity INTEGER)
    JOIN product_variants v ON v.product_id = x.product_id
    JOIN inventory i ON i.variant_id = v.variant_id AND i.warehouse_id = x.warehouse_id AND i.tenant_id = p_tenant;
    IF v_lock_ids IS NOT NULL THEN
        PERFORM 1 FROM inventory i WHERE i.inventory_id = ANY (v_lock_ids) ORDER BY i.inventory_id FOR UPDATE;
    END IF;

    FOR l IN SELECT * FROM jsonb_to_recordset(p_lines) AS x(product_id UUID, warehouse_id UUID, quantity INTEGER) LOOP
        v_need := l.quantity;
        FOR v_row IN
            SELECT i.inventory_id, i.quantity_available, i.quantity_reserved
            FROM inventory i JOIN product_variants v ON v.variant_id = i.variant_id
            WHERE i.tenant_id = p_tenant AND i.warehouse_id = l.warehouse_id AND v.product_id = l.product_id
              AND i.quantity_available - coalesce(i.quantity_reserved, 0) > 0
            ORDER BY i.quantity_available - coalesce(i.quantity_reserved, 0) DESC, i.inventory_id
        LOOP
            EXIT WHEN v_need <= 0;
            v_take := LEAST(v_need, v_row.quantity_available - coalesce(v_row.quantity_reserved, 0));
            UPDATE inventory i SET quantity_available = i.quantity_available - v_take, last_updated = now()
            WHERE i.inventory_id = v_row.inventory_id RETURNING i.quantity_available INTO v_after;
            INSERT INTO inventory_transactions (tenant_id, inventory_id, transaction_type, quantity_change, quantity_after, reference_id, notes)
            VALUES (p_tenant, v_row.inventory_id, 'SALES_ORDER', -v_take, v_after, p_order, 'Stock allocated to online order');
            v_need := v_need - v_take;
        END LOOP;
        IF v_need > 0 THEN RAISE EXCEPTION 'INSUFFICIENT_STOCK' USING ERRCODE = 'P0001'; END IF;
    END LOOP;
END $$;

-- ---------------------------------------------------------------------------------------------
-- release_order_stock: puts back whatever an order still holds. Net-based, so it is safe to call twice and works
-- no matter how often the order was moved between warehouses.
-- ---------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION release_order_stock(p_tenant UUID, p_order UUID, p_note TEXT DEFAULT 'Stock returned: order cancelled')
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
    r RECORD;
    v_after INTEGER;
    v_total INTEGER := 0;
BEGIN
    FOR r IN
        SELECT t.inventory_id, (-sum(t.quantity_change))::INTEGER AS outstanding
        FROM inventory_transactions t
        WHERE t.tenant_id = p_tenant AND t.reference_id = p_order AND t.transaction_type IN ('SALES_ORDER', 'RETURN', 'TRANSFER')
        GROUP BY t.inventory_id
        HAVING -sum(t.quantity_change) > 0
        ORDER BY t.inventory_id
    LOOP
        UPDATE inventory i SET quantity_available = i.quantity_available + r.outstanding, last_updated = now()
        WHERE i.inventory_id = r.inventory_id AND i.tenant_id = p_tenant
        RETURNING i.quantity_available INTO v_after;
        IF FOUND THEN
            INSERT INTO inventory_transactions (tenant_id, inventory_id, transaction_type, quantity_change, quantity_after, reference_id, notes)
            VALUES (p_tenant, r.inventory_id, 'RETURN', r.outstanding, v_after, p_order, p_note);
            v_total := v_total + r.outstanding;
        END IF;
    END LOOP;
    RETURN v_total;
END $$;

-- ---------------------------------------------------------------------------------------------
-- move_order_to_warehouse: the one place an order changes warehouse.
--   p_to = NULL       -> release to the pool (stock goes back, nobody is responsible until someone takes it)
--   p_to = warehouse  -> that warehouse fulfils it: stock is returned where it was held and taken from p_to
-- Everything happens under row locks in one transaction; if p_to cannot supply every tracked line the whole move is
-- rejected (INSUFFICIENT_STOCK, DETAIL = product name) and nothing changes.
-- ---------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION move_order_to_warehouse(
    p_tenant UUID, p_order UUID, p_to UUID,
    p_check_from BOOLEAN DEFAULT false, p_expected_from UUID DEFAULT NULL,
    p_claim BOOLEAN DEFAULT false,
    p_actor_type TEXT DEFAULT 'ADMIN', p_employee UUID DEFAULT NULL, p_user UUID DEFAULT NULL, p_actor_name TEXT DEFAULT NULL,
    p_note TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    o orders%ROWTYPE;
    r RECORD;
    v_from_name TEXT;
    v_to_name TEXT;
    v_to_active BOOLEAN;
    v_lock_ids UUID[];
    v_after INTEGER;
    v_take INTEGER;
    v_need INTEGER;
    v_row RECORD;
    v_moved JSONB := '[]'::jsonb;
    v_action TEXT;
    v_label TEXT;
BEGIN
    SELECT * INTO o FROM orders x WHERE x.order_id = p_order AND x.tenant_id = p_tenant FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND' USING ERRCODE = 'P0001'; END IF;
    IF o.status NOT IN ('PENDING', 'PROCESSING') THEN RAISE EXCEPTION 'ORDER_LOCKED' USING ERRCODE = 'P0001', DETAIL = o.status; END IF;
    IF p_check_from AND o.fulfillment_warehouse_id IS DISTINCT FROM p_expected_from THEN
        RAISE EXCEPTION 'ORDER_CHANGED' USING ERRCODE = 'P0001';
    END IF;

    IF p_to IS NOT NULL THEN
        SELECT w.warehouse_name, w.is_active INTO v_to_name, v_to_active FROM warehouses w WHERE w.warehouse_id = p_to AND w.tenant_id = p_tenant;
        IF NOT FOUND THEN RAISE EXCEPTION 'WAREHOUSE_NOT_FOUND' USING ERRCODE = 'P0001'; END IF;
        IF v_to_active = false THEN RAISE EXCEPTION 'WAREHOUSE_INACTIVE' USING ERRCODE = 'P0001'; END IF;
    END IF;
    IF o.fulfillment_warehouse_id IS NOT NULL THEN
        SELECT w.warehouse_name INTO v_from_name FROM warehouses w WHERE w.warehouse_id = o.fulfillment_warehouse_id;
    END IF;

    -- Same warehouse: nothing to move (taking your own warehouse's order is just a claim).
    IF o.fulfillment_warehouse_id IS NOT DISTINCT FROM p_to THEN
        RAISE EXCEPTION 'ORDER_UNCHANGED' USING ERRCODE = 'P0001';
    END IF;

    -- Lock every stock row we may touch, in one global order, so two moves can never deadlock each other.
    SELECT array_agg(DISTINCT id ORDER BY id) INTO v_lock_ids FROM (
        SELECT t.inventory_id AS id FROM inventory_transactions t
        WHERE t.tenant_id = p_tenant AND t.reference_id = p_order AND t.transaction_type IN ('SALES_ORDER', 'RETURN', 'TRANSFER')
        UNION
        SELECT i.inventory_id FROM inventory i
        JOIN product_variants v ON v.variant_id = i.variant_id
        WHERE p_to IS NOT NULL AND i.tenant_id = p_tenant AND i.warehouse_id = p_to AND v.product_id IN (
            SELECT coalesce(oi.product_id,
                   (SELECT p.product_id FROM products p WHERE p.tenant_id = p_tenant AND oi.sku IS NOT NULL AND oi.sku <> '' AND p.sku = oi.sku LIMIT 1),
                   (SELECT p.product_id FROM products p WHERE p.tenant_id = p_tenant AND lower(p.product_name) = lower(oi.product_name) ORDER BY p.created_date DESC LIMIT 1))
            FROM order_items oi WHERE oi.order_id = p_order)
    ) s;
    IF v_lock_ids IS NOT NULL THEN
        PERFORM 1 FROM inventory i WHERE i.inventory_id = ANY (v_lock_ids) ORDER BY i.inventory_id FOR UPDATE;
    END IF;

    -- 1) Put back what the order currently holds (net of earlier moves).
    FOR r IN
        SELECT t.inventory_id, (-sum(t.quantity_change))::INTEGER AS outstanding
        FROM inventory_transactions t
        WHERE t.tenant_id = p_tenant AND t.reference_id = p_order AND t.transaction_type IN ('SALES_ORDER', 'RETURN', 'TRANSFER')
        GROUP BY t.inventory_id HAVING -sum(t.quantity_change) > 0
        ORDER BY t.inventory_id
    LOOP
        UPDATE inventory i SET quantity_available = i.quantity_available + r.outstanding, last_updated = now()
        WHERE i.inventory_id = r.inventory_id AND i.tenant_id = p_tenant RETURNING i.quantity_available INTO v_after;
        IF FOUND THEN
            INSERT INTO inventory_transactions (tenant_id, inventory_id, transaction_type, quantity_change, quantity_after, reference_id, notes, created_by, actor_employee_id, actor_name)
            VALUES (p_tenant, r.inventory_id, 'TRANSFER', r.outstanding, v_after, p_order,
                    format('Order %s moved%s', o.order_number, CASE WHEN v_from_name IS NOT NULL THEN ' from ' || v_from_name ELSE '' END),
                    p_user, p_employee, p_actor_name);
        END IF;
    END LOOP;

    -- 2) Take what it needs from the new warehouse. Products with no stock records anywhere are untracked: no stock to move.
    IF p_to IS NOT NULL THEN
        FOR r IN
            SELECT l.product_id, min(l.product_name) AS product_name, sum(l.quantity)::INTEGER AS needed
            FROM (
                SELECT coalesce(oi.product_id,
                       (SELECT p.product_id FROM products p WHERE p.tenant_id = p_tenant AND oi.sku IS NOT NULL AND oi.sku <> '' AND p.sku = oi.sku LIMIT 1),
                       (SELECT p.product_id FROM products p WHERE p.tenant_id = p_tenant AND lower(p.product_name) = lower(oi.product_name) ORDER BY p.created_date DESC LIMIT 1)) AS product_id,
                       oi.product_name, oi.quantity
                FROM order_items oi WHERE oi.order_id = p_order
            ) l
            WHERE l.product_id IS NOT NULL
            GROUP BY l.product_id
        LOOP
            PERFORM 1 FROM inventory i JOIN product_variants v ON v.variant_id = i.variant_id WHERE i.tenant_id = p_tenant AND v.product_id = r.product_id;
            IF NOT FOUND THEN CONTINUE; END IF;

            v_need := r.needed;
            FOR v_row IN
                SELECT i.inventory_id, i.quantity_available, i.quantity_reserved
                FROM inventory i JOIN product_variants v ON v.variant_id = i.variant_id
                WHERE i.tenant_id = p_tenant AND i.warehouse_id = p_to AND v.product_id = r.product_id
                  AND i.quantity_available - coalesce(i.quantity_reserved, 0) > 0
                ORDER BY i.quantity_available - coalesce(i.quantity_reserved, 0) DESC, i.inventory_id
            LOOP
                EXIT WHEN v_need <= 0;
                v_take := LEAST(v_need, v_row.quantity_available - coalesce(v_row.quantity_reserved, 0));
                UPDATE inventory i SET quantity_available = i.quantity_available - v_take, last_updated = now()
                WHERE i.inventory_id = v_row.inventory_id RETURNING i.quantity_available INTO v_after;
                INSERT INTO inventory_transactions (tenant_id, inventory_id, transaction_type, quantity_change, quantity_after, reference_id, notes, created_by, actor_employee_id, actor_name)
                VALUES (p_tenant, v_row.inventory_id, 'TRANSFER', -v_take, v_after, p_order, format('Order %s assigned to %s', o.order_number, v_to_name), p_user, p_employee, p_actor_name);
                v_need := v_need - v_take;
            END LOOP;
            IF v_need > 0 THEN
                RAISE EXCEPTION 'INSUFFICIENT_STOCK' USING ERRCODE = 'P0001', DETAIL = r.product_name;
            END IF;
            v_moved := v_moved || jsonb_build_object('product_id', r.product_id, 'product_name', r.product_name, 'quantity', r.needed);
        END LOOP;
    END IF;

    UPDATE orders x SET
        fulfillment_warehouse_id = p_to,
        claimed_by_employee_id = CASE WHEN p_claim AND p_to IS NOT NULL THEN p_employee ELSE NULL END,
        claimed_date = CASE WHEN p_claim AND p_to IS NOT NULL THEN now() ELSE NULL END,
        assigned_date = now()
    WHERE x.order_id = p_order AND x.tenant_id = p_tenant;

    v_action := CASE
        WHEN p_to IS NULL AND p_actor_type = 'EMPLOYEE' THEN 'ORDER_RELEASED'
        WHEN p_to IS NULL THEN 'ORDER_UNASSIGNED'
        WHEN p_claim THEN 'ORDER_TAKEN'
        ELSE 'ORDER_ASSIGNED' END;
    v_label := coalesce(v_to_name, v_from_name);
    INSERT INTO warehouse_activity (tenant_id, actor_type, employee_id, user_id, actor_name, warehouse_id, warehouse_name, action, order_id, order_number, note, details)
    VALUES (p_tenant, p_actor_type, p_employee, p_user, p_actor_name, coalesce(p_to, o.fulfillment_warehouse_id), v_label, v_action, p_order, o.order_number, p_note,
            jsonb_build_object('from_warehouse_id', o.fulfillment_warehouse_id, 'from_warehouse', v_from_name, 'to_warehouse_id', p_to, 'to_warehouse', v_to_name, 'stock_moved', v_moved));

    RETURN jsonb_build_object('order_id', p_order, 'order_number', o.order_number, 'from_warehouse_id', o.fulfillment_warehouse_id, 'to_warehouse_id', p_to, 'stock_moved', v_moved);
END $$;

-- ---------------------------------------------------------------------------------------------
-- Aggregates for the merchant's monitoring screens
-- ---------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION employee_activity_summary(p_tenant UUID, p_since TIMESTAMP WITH TIME ZONE)
RETURNS TABLE (
    employee_id UUID, employee_name TEXT, warehouse_id UUID, warehouse_name TEXT,
    total_actions BIGINT, stock_changes BIGINT, units_added BIGINT, units_removed BIGINT,
    orders_taken BIGINT, orders_updated BIGINT, last_active TIMESTAMP WITH TIME ZONE
) LANGUAGE sql STABLE AS $$
    SELECT a.employee_id,
           max(a.actor_name)::TEXT,
           (array_agg(a.warehouse_id ORDER BY a.created_date DESC))[1],
           (array_agg(a.warehouse_name ORDER BY a.created_date DESC))[1]::TEXT,
           count(*),
           count(*) FILTER (WHERE a.action IN ('STOCK_SET', 'STOCK_ADJUST')),
           coalesce(sum(a.quantity_change) FILTER (WHERE a.action IN ('STOCK_SET', 'STOCK_ADJUST') AND a.quantity_change > 0), 0)::BIGINT,
           coalesce(-sum(a.quantity_change) FILTER (WHERE a.action IN ('STOCK_SET', 'STOCK_ADJUST') AND a.quantity_change < 0), 0)::BIGINT,
           count(*) FILTER (WHERE a.action IN ('ORDER_TAKEN', 'ORDER_CLAIMED')),
           count(*) FILTER (WHERE a.action IN ('ORDER_STATUS', 'ORDER_PAYMENT')),
           max(a.created_date)
    FROM warehouse_activity a
    WHERE a.tenant_id = p_tenant AND a.actor_type = 'EMPLOYEE' AND a.created_date >= p_since
    GROUP BY a.employee_id
    ORDER BY max(a.created_date) DESC
$$;

CREATE OR REPLACE FUNCTION warehouse_open_order_counts(p_tenant UUID)
RETURNS TABLE (warehouse_id UUID, open_orders BIGINT) LANGUAGE sql STABLE AS $$
    SELECT o.fulfillment_warehouse_id, count(*) FROM orders o
    WHERE o.tenant_id = p_tenant AND o.fulfillment_warehouse_id IS NOT NULL AND o.status IN ('PENDING', 'PROCESSING')
    GROUP BY o.fulfillment_warehouse_id
$$;

-- These take a tenant id as a plain argument, so only the backend (service role) may call them - never a browser.
REVOKE ALL ON FUNCTION adjust_inventory(UUID, UUID, UUID, INTEGER, INTEGER, TEXT, TEXT, UUID, UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION allocate_order_stock(UUID, UUID, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION release_order_stock(UUID, UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION move_order_to_warehouse(UUID, UUID, UUID, BOOLEAN, UUID, BOOLEAN, TEXT, UUID, UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION employee_activity_summary(UUID, TIMESTAMP WITH TIME ZONE) FROM PUBLIC;
REVOKE ALL ON FUNCTION warehouse_open_order_counts(UUID) FROM PUBLIC;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON FUNCTION adjust_inventory(UUID, UUID, UUID, INTEGER, INTEGER, TEXT, TEXT, UUID, UUID, TEXT) FROM anon, authenticated;
        REVOKE ALL ON FUNCTION allocate_order_stock(UUID, UUID, JSONB) FROM anon, authenticated;
        REVOKE ALL ON FUNCTION release_order_stock(UUID, UUID, TEXT) FROM anon, authenticated;
        REVOKE ALL ON FUNCTION move_order_to_warehouse(UUID, UUID, UUID, BOOLEAN, UUID, BOOLEAN, TEXT, UUID, UUID, TEXT, TEXT) FROM anon, authenticated;
        REVOKE ALL ON FUNCTION employee_activity_summary(UUID, TIMESTAMP WITH TIME ZONE) FROM anon, authenticated;
        REVOKE ALL ON FUNCTION warehouse_open_order_counts(UUID) FROM anon, authenticated;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        GRANT EXECUTE ON FUNCTION adjust_inventory(UUID, UUID, UUID, INTEGER, INTEGER, TEXT, TEXT, UUID, UUID, TEXT) TO service_role;
        GRANT EXECUTE ON FUNCTION allocate_order_stock(UUID, UUID, JSONB) TO service_role;
        GRANT EXECUTE ON FUNCTION release_order_stock(UUID, UUID, TEXT) TO service_role;
        GRANT EXECUTE ON FUNCTION move_order_to_warehouse(UUID, UUID, UUID, BOOLEAN, UUID, BOOLEAN, TEXT, UUID, UUID, TEXT, TEXT) TO service_role;
        GRANT EXECUTE ON FUNCTION employee_activity_summary(UUID, TIMESTAMP WITH TIME ZONE) TO service_role;
        GRANT EXECUTE ON FUNCTION warehouse_open_order_counts(UUID) TO service_role;
    END IF;
END $$;
