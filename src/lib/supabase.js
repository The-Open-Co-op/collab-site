import { createClient } from "@supabase/supabase-js";

// Server-side client using service role key (full access, no RLS)
// Lazy-initialised to avoid crashing during build when env vars aren't set
let _supabase;
export function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        global: {
          fetch: (url, options = {}) =>
            fetch(url, { ...options, cache: "no-store" }),
        },
      }
    );
  }
  return _supabase;
}

// Convenience getter matching existing `supabase` import name
export const supabase = new Proxy(
  {},
  {
    get(_, prop) {
      return getSupabase()[prop];
    },
  }
);

// Client-side client using anon key (for real-time subscriptions only)
// Singleton to avoid multiple GoTrueClient instances
let _browserClient;
export function createBrowserClient() {
  if (!_browserClient) {
    _browserClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }
  return _browserClient;
}
