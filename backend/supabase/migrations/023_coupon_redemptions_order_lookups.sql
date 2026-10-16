-- 023_coupon_redemptions_order_lookups.sql
-- * A shopper can use a given promo code only once. Enforced by a UNIQUE constraint (so two simultaneous checkouts
--   cannot both succeed), not just by a check in the application.
-- * Indexes for finding a customer's / an address's / a neighbourhood's orders quickly.
-- Idempotent: safe to run more than once.

CREATE TABLE IF NOT EXISTS coupon_redemptions (
    redemption_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id) ON DELETE CASCADE,
    coupon_id UUID NOT NULL REFERENCES coupons(coupon_id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    -- The order that used the code. Freed again if that order is cancelled (the shopper never got the discount).
    order_id UUID REFERENCES orders(order_id) ON DELETE SET NULL,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (coupon_id, customer_id)
);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_order ON coupon_redemptions(order_id) WHERE order_id IS NOT NULL;

ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for coupon_redemptions" ON coupon_redemptions;
CREATE POLICY "Tenant isolation for coupon_redemptions" ON coupon_redemptions
    USING (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid) WITH CHECK (tenant_id = (SELECT auth.jwt()->>'tenant_id')::uuid);

-- Codes already used before this rule existed count as used. Checkout wrote "Coupon applied: CODE (-amount)" into
-- the order's notes, which is what we read back here (cancelled / refunded orders do not count).
INSERT INTO coupon_redemptions (tenant_id, coupon_id, customer_id, order_id, created_date)
SELECT DISTINCT ON (c.coupon_id, o.customer_id) o.tenant_id, c.coupon_id, o.customer_id, o.order_id, o.created_date
FROM orders o
JOIN coupons c ON c.tenant_id = o.tenant_id
 AND upper(c.code) = upper(substring(o.notes from 'Coupon applied: ([^ (\r\n]+)'))
WHERE o.customer_id IS NOT NULL AND o.notes LIKE '%Coupon applied:%' AND o.status NOT IN ('CANCELLED', 'REFUNDED')
ORDER BY c.coupon_id, o.customer_id, o.created_date
ON CONFLICT (coupon_id, customer_id) DO NOTHING;

-- Order look-ups for "same person", "same address" and "nearby" in the dashboard.
CREATE INDEX IF NOT EXISTS idx_orders_tenant_customer ON orders(tenant_id, customer_id, created_date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_postal ON orders(tenant_id, shipping_postal_code);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_geo ON orders(tenant_id, shipping_latitude, shipping_longitude) WHERE shipping_latitude IS NOT NULL;

-- Orders list: how many orders sit in each state, in one query (drives the filter chips and their counts).
-- "Delayed" = promised delivery date has passed and the order is still on its way (not delivered / cancelled / returned).
CREATE INDEX IF NOT EXISTS idx_orders_tenant_status_date ON orders(tenant_id, status, created_date DESC);

CREATE OR REPLACE FUNCTION order_filter_counts(p_tenant UUID)
RETURNS TABLE (status TEXT, payment_status TEXT, delayed BOOLEAN, n BIGINT) LANGUAGE sql STABLE AS $$
    SELECT o.status::TEXT, o.payment_status::TEXT,
           (o.estimated_delivery_date IS NOT NULL AND o.estimated_delivery_date < now() AND o.status IN ('PENDING', 'PROCESSING', 'SHIPPED')) AS delayed,
           count(*)
    FROM orders o
    WHERE o.tenant_id = p_tenant
    GROUP BY 1, 2, 3
$$;

REVOKE ALL ON FUNCTION order_filter_counts(UUID) FROM PUBLIC;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON FUNCTION order_filter_counts(UUID) FROM anon, authenticated;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        GRANT EXECUTE ON FUNCTION order_filter_counts(UUID) TO service_role;
    END IF;
END $$;
