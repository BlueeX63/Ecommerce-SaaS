-- Migration: 017_user_sessions
-- Description: Create user_sessions table for stateful session management

CREATE TABLE IF NOT EXISTS public.user_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenant(tenant_id) ON DELETE CASCADE,
    ip_address TEXT,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    logout_time TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own sessions
CREATE POLICY "Users can view their own sessions" ON public.user_sessions
    FOR SELECT USING (auth.uid() = user_id);
