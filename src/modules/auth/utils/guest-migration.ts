"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { TASKS_STORAGE_KEY, DEFAULT_COLUMNS } from "@/modules/tasks/constants";
import { STORAGE_KEYS as TIMER_KEYS } from "@/modules/timer/constants";
import type { BoardState } from "@/modules/tasks/types";
import type { CompletedSession } from "@/modules/timer/types";
import { ensureDefaultColumns } from "@/shared/lib/supabase/queries/tasks";

const MIGRATION_FLAG = "zone-guest-migrated";

interface MigrationResult {
  tasksMigrated: number;
  sessionsMigrated: number;
  skipped: boolean;
}

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function migrateGuestData(
  supabase: SupabaseClient,
  userId: string,
): Promise<MigrationResult> {
  if (typeof window === "undefined") {
    return { tasksMigrated: 0, sessionsMigrated: 0, skipped: true };
  }
  if (window.localStorage.getItem(MIGRATION_FLAG)) {
    return { tasksMigrated: 0, sessionsMigrated: 0, skipped: true };
  }

  // Set the flag IMMEDIATELY (best-effort). If the migration crashes mid-way
  // (network drop, browser closed), re-mounting won't replay the loop and
  // double-insert tags/tasks. The cost is that a partial migration leaves
  // some local data orphaned — but that's strictly better than duplicates,
  // and re-mounting fetches the canonical server state anyway.
  window.localStorage.setItem(MIGRATION_FLAG, new Date().toISOString());

  await ensureDefaultColumns(supabase, userId);

  const board = readJSON<BoardState>(TASKS_STORAGE_KEY, {
    columns: DEFAULT_COLUMNS,
    tasks: [],
    tags: [],
  });
  const sessions = readJSON<CompletedSession[]>(
    TIMER_KEYS.COMPLETED_SESSIONS,
    [],
  );

  let tasksMigrated = 0;
  let sessionsMigrated = 0;

  // Insert tags first to get IDs we can reference.
  const tagIdMap = new Map<string, string>();
  for (const tag of board.tags) {
    const { data, error } = await supabase
      .from("tags")
      .insert({ user_id: userId, name: tag.name, color: tag.color })
      .select("id")
      .single();
    if (!error && data) tagIdMap.set(tag.id, data.id as string);
  }

  // Fetch the user's columns (default columns just got seeded).
  const { data: columns } = await supabase
    .from("columns")
    .select("id,status")
    .eq("user_id", userId);
  const columnByStatus = new Map<string, string>();
  for (const c of (columns ?? []) as { id: string; status: string }[]) {
    columnByStatus.set(c.status, c.id);
  }

  // Tasks — map onto the seeded default columns by status.
  for (const task of board.tasks) {
    const targetCol =
      columnByStatus.get(task.status) ??
      columnByStatus.values().next().value;
    if (!targetCol) continue;

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: userId,
        column_id: targetCol,
        title: task.title,
        note: task.note,
        status: task.status,
        priority: task.priority,
        due_date: task.dueDate,
        position: task.position,
        completed: task.completed,
      })
      .select("id")
      .single();

    if (error || !data) continue;
    tasksMigrated += 1;

    const newTaskId = data.id as string;
    const tagLinks = task.tagIds
      .map((id) => tagIdMap.get(id))
      .filter((id): id is string => Boolean(id))
      .map((tag_id) => ({ task_id: newTaskId, tag_id }));
    if (tagLinks.length > 0) {
      await supabase.from("task_tags").insert(tagLinks);
    }

    // Migrate the task's per-task time log entries as zone_sessions.
    if (task.timeLog.length > 0) {
      const rows = task.timeLog.map((log) => ({
        user_id: userId,
        task_id: newTaskId,
        started_at: log.startedAt,
        ended_at: log.endedAt,
        duration_seconds: log.durationSeconds,
        mode: "stopwatch" as const,
        completed: true,
      }));
      await supabase.from("zone_sessions").insert(rows);
      sessionsMigrated += rows.length;
    }
  }

  // Untethered sessions (not linked to any task)
  if (sessions.length > 0) {
    const rows = sessions.map((s) => ({
      user_id: userId,
      task_id: null,
      started_at: s.startedAt,
      ended_at: s.endedAt,
      duration_seconds: Math.round(s.duration / 1000),
      mode: s.mode,
      completed: s.completed,
    }));
    await supabase.from("zone_sessions").insert(rows);
    sessionsMigrated += rows.length;
  }

  return { tasksMigrated, sessionsMigrated, skipped: false };
}
