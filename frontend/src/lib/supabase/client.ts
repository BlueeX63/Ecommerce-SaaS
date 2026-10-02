import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('Missing Supabase environment variables in browser client');
    // Return a dummy client to prevent crashes during UI development
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: "Supabase keys missing" } }),
        signUp: async () => ({ data: { user: null, session: null }, error: { message: "Supabase keys missing" } }),
        signInWithOAuth: async () => ({ data: { provider: 'google', url: '' }, error: { message: "Supabase keys missing" } }),
        signOut: async () => ({ error: null }),
      },
      from: () => ({ select: () => ({ data: [], error: null }) })
    } as any;
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
