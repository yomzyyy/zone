import { createBrowserClient } from "@supabase/ssr";

// Creates a Supabase client for use in React components (browser-side).
// This client automatically manages auth cookies using document.cookie.
// It's a singleton — calling this multiple times returns the same instance.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
