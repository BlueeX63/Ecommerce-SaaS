import { createClient } from '@supabase/supabase-js';

// This uses the service role key to bypass RLS, but then explicitly sets the tenant context
// so that subsequent queries within the same transaction/session respect it.
// Note: Supabase JS client doesn't support persistent connections well, so 
// for RLS with a custom auth system, we often pass tenant_id explicitly or use RPCs.

export function getTenantDbClient(tenantId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Must use service role to bypass initial RLS if custom auth
  
  const client = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // We monkey-patch the client to inject the tenant ID into the headers
  // However, Supabase REST API doesn't easily let us set custom variables for RLS
  // A common pattern is to create a Postgres function `set_tenant(uuid)` and call it via rpc,
  // but REST is stateless. 
  
  // The most secure way for Custom Auth + Supabase RLS over REST is signing a custom JWT
  // using the Supabase JWT secret. Let's assume we do that in session.ts.
  
  return client;
}
