import type { SupabaseClient } from "@supabase/supabase-js";

export interface UsageState {
  date: string;
  count: number;
}

function todayKey(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

export async function getOrCreateUsage(
  supabase: SupabaseClient,
  userId: string,
): Promise<UsageState> {
  const date = todayKey();
  const { data, error } = await supabase
    .from("assistant_usage")
    .select("date,message_count")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { date, count: 0 };
  return { date: data.date, count: data.message_count };
}

// Atomic in a single round trip: the RPC does INSERT..ON CONFLICT DO UPDATE
// SET message_count = message_count + 1 RETURNING message_count, so two
// concurrent calls can't both read the old count and both write count+1.
export async function incrementUsage(
  supabase: SupabaseClient,
  _userId: string,
): Promise<UsageState> {
  const date = todayKey();
  const { data, error } = await supabase.rpc("increment_assistant_usage", {
    target_date: date,
  });
  if (error) throw error;
  return { date, count: (data as number) ?? 0 };
}

export async function appendMessage(
  supabase: SupabaseClient,
  userId: string,
  role: "user" | "assistant",
  content: string,
) {
  const { error } = await supabase
    .from("assistant_messages")
    .insert({ user_id: userId, role, content });
  if (error) throw error;
}
