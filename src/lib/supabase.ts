import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ─── Lazy singleton for public (anon-key) client ────────────────────────────
// Called only at runtime from client components, never at build time.
let _supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (_supabaseClient) return _supabaseClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
    );
  }

  _supabaseClient = createClient(url, anonKey);
  return _supabaseClient;
}

// ─── Server-side privileged client (service_role key) ───────────────────────
// Only ever called inside API Route Handlers (server-side), never at build time.
export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.'
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// ─── Legacy named export kept for any future client components ───────────────
// Use getSupabaseClient() in client components instead of this direct export.
export const supabase = {
  get client() {
    return getSupabaseClient();
  },
};
