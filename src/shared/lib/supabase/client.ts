import { createBrowserClient } from "@supabase/ssr";

// Placeholders let the build succeed when env vars aren't set (e.g. CI without
// secrets, or a fresh checkout). API calls fall through to a network error
// at the placeholder host — that's the intended signal. Don't make the key
// look like a JWT here; secret scanners will flag it as a leak.
const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_KEY = "missing-supabase-anon-key";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || PLACEHOLDER_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || PLACEHOLDER_KEY,
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
