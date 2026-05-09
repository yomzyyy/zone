import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Same placeholders as the browser client. Don't make the key look like a
// JWT — secret scanners flag any JWT pattern in source control.
const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_KEY = "missing-supabase-anon-key";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || PLACEHOLDER_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || PLACEHOLDER_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll is called from Server Components where cookies can't
            // be set. Middleware handles cookie writes there.
          }
        },
      },
    },
  );
}
