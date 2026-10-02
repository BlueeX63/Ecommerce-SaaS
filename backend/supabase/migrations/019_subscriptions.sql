-- 019_subscriptions.sql
-- Add subscriptions table to correctly map Stripe subscriptions to users

CREATE TABLE subscriptions (
    subscription_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255) UNIQUE,
    plan_id VARCHAR(150),
    status VARCHAR(50) NOT NULL DEFAULT 'incomplete',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Add RLS policy allowing a user to read their own subscription
CREATE POLICY "Users can read own subscriptions" ON subscriptions
    FOR SELECT USING (user_id = (SELECT auth.jwt()->>'sub')::uuid);

-- Service role will bypass RLS for webhook updates.
