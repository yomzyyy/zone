import { redirect } from "next/navigation";
import { createClient } from "@/shared/lib/supabase/server";
import { AUTH_ROUTES } from "@/modules/auth/constants";
import { AnalyticsClient } from "./analytics-client";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(AUTH_ROUTES.LOGIN);

  return <AnalyticsClient />;
}
