import type { SupabaseClient } from "@supabase/supabase-js";
import type { CompletedSession } from "@/modules/timer/types";

interface SessionRow {
  id: string;
  user_id: string;
  task_id: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  mode: "stopwatch" | "pomodoro";
  completed: boolean;
}

export async function insertCompletedSession(
  supabase: SupabaseClient,
  userId: string,
  session: CompletedSession,
) {
  const { error } = await supabase.from("zone_sessions").insert({
    user_id: userId,
    task_id: session.taskId ?? null,
    started_at: session.startedAt,
    ended_at: session.endedAt,
    duration_seconds: Math.round(session.duration / 1000),
    mode: session.mode,
    completed: session.completed,
  });
  if (error) throw error;
}

export async function fetchRecentSessions(
  supabase: SupabaseClient,
  limit = 100,
): Promise<CompletedSession[]> {
  const { data, error } = await supabase
    .from("zone_sessions")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as SessionRow[]).map((row) => ({
    startedAt: row.started_at,
    endedAt: row.ended_at ?? row.started_at,
    duration: row.duration_seconds * 1000,
    mode: row.mode,
    completed: row.completed,
    taskId: row.task_id ?? undefined,
  }));
}
