import { redirect } from "next/navigation";
import { createClient } from "@/shared/lib/supabase/server";
import { AUTH_ROUTES } from "@/modules/auth/constants";
import { AnalyticsClient } from "./analytics-client";

// Server-side auth gate — defense in depth on top of RLS. Unauthenticated
// requests get bounced to login before any analytics chrome renders.
export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(AUTH_ROUTES.LOGIN);

  return <AnalyticsClient />;
}
