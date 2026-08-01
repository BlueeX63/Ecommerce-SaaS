import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { Database } from './types';

// Wrapper around Supabase server client to provide typed access
export async function getDbClient() {
  const supabase = await createSupabaseServerClient();
  return supabase as unknown as {
    from: (table: string) => any;
    rpc: (fn: string, args?: any) => any;
  }; // typed wrapper
}
