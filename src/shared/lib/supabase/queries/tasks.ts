import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Column,
  Priority,
  Tag,
  Task,
  TaskStatus,
  TimeLogEntry,
} from "@/modules/tasks/types";

interface TaskRow {
  id: string;
  user_id: string;
  column_id: string;
  title: string;
  note: string | null;
  status: TaskStatus;
  priority: Priority;
  due_date: string | null;
  position: number;
  completed: boolean | null;
  created_at: string;
  updated_at: string;
}

interface ColumnRow {
  id: string;
  user_id: string;
  name: string;
  status: TaskStatus;
  position: number;
  is_default: boolean;
}

interface TagRow {
  id: string;
  user_id: string;
  name: string;
  color: string;
}

function rowToTask(row: TaskRow, tagIds: string[]): Task {
  return {
    id: row.id,
    columnId: row.column_id,
    title: row.title,
    note: row.note ?? "",
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    tagIds,
    position: row.position,
    timeLog: [],
    completed: row.completed ?? row.status === "done",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

interface SessionRow {
  id: string;
  task_id: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
}

export async function fetchBoardState(supabase: SupabaseClient): Promise<{
  columns: Column[];
  tasks: Task[];
  tags: Tag[];
}> {
  const [columnsRes, tasksRes, tagsRes, taskTagsRes, sessionsRes] =
    await Promise.all([
      supabase
        .from("columns")
        .select("*")
        .order("position", { ascending: true }),
      supabase.from("tasks").select("*").order("position"),
      supabase.from("tags").select("*"),
      supabase.from("task_tags").select("task_id,tag_id"),
      supabase
        .from("zone_sessions")
        .select("id,task_id,started_at,ended_at,duration_seconds")
        .not("task_id", "is", null)
        .not("ended_at", "is", null),
    ]);

  if (columnsRes.error) throw columnsRes.error;
  if (tasksRes.error) throw tasksRes.error;
  if (tagsRes.error) throw tagsRes.error;
  if (taskTagsRes.error) throw taskTagsRes.error;
  if (sessionsRes.error) throw sessionsRes.error;

  const tagsByTask = new Map<string, string[]>();
  for (const link of (taskTagsRes.data ?? []) as {
    task_id: string;
    tag_id: string;
  }[]) {
    const list = tagsByTask.get(link.task_id) ?? [];
    list.push(link.tag_id);
    tagsByTask.set(link.task_id, list);
  }

  const logsByTask = new Map<string, TimeLogEntry[]>();
  for (const row of (sessionsRes.data ?? []) as SessionRow[]) {
    if (!row.task_id || !row.ended_at) continue;
    const list = logsByTask.get(row.task_id) ?? [];
    list.push({
      id: row.id,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      durationSeconds: row.duration_seconds,
    });
    logsByTask.set(row.task_id, list);
  }

  const columns: Column[] = ((columnsRes.data ?? []) as ColumnRow[]).map(
    (c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      position: c.position,
      isDefault: c.is_default,
    }),
  );
  const tags: Tag[] = ((tagsRes.data ?? []) as TagRow[]).map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color,
  }));
  const tasks: Task[] = ((tasksRes.data ?? []) as TaskRow[]).map((row) => {
    const task = rowToTask(row, tagsByTask.get(row.id) ?? []);
    task.timeLog = logsByTask.get(row.id) ?? [];
    return task;
  });

  return { columns, tasks, tags };
}

export async function insertTaskRow(
  supabase: SupabaseClient,
  userId: string,
  task: Task,
) {
  const { error } = await supabase.from("tasks").insert({
    id: task.id,
    user_id: userId,
    column_id: task.columnId,
    title: task.title,
    note: task.note,
    status: task.status,
    priority: task.priority,
    due_date: task.dueDate,
    position: task.position,
    completed: task.completed,
  });
  if (error) throw error;

  if (task.tagIds.length > 0) {
    const links = task.tagIds.map((tag_id) => ({ task_id: task.id, tag_id }));
    const { error: linkErr } = await supabase.from("task_tags").insert(links);
    if (linkErr) throw linkErr;
  }
}

export async function updateTaskRow(
  supabase: SupabaseClient,
  taskId: string,
  patch: {
    title?: string;
    note?: string;
    status?: TaskStatus;
    priority?: Priority;
    due_date?: string | null;
    column_id?: string;
    position?: number;
    completed?: boolean;
  },
) {
  const { error } = await supabase.from("tasks").update(patch).eq("id", taskId);
  if (error) throw error;
}

export async function deleteTaskRow(
  supabase: SupabaseClient,
  taskId: string,
) {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw error;
}

export async function replaceTaskTags(
  supabase: SupabaseClient,
  taskId: string,
  tagIds: string[],
) {
  const { error: delErr } = await supabase
    .from("task_tags")
    .delete()
    .eq("task_id", taskId);
  if (delErr) throw delErr;
  if (tagIds.length === 0) return;
  const rows = tagIds.map((tag_id) => ({ task_id: taskId, tag_id }));
  const { error: insErr } = await supabase.from("task_tags").insert(rows);
  if (insErr) throw insErr;
}

export async function reindexTaskPositions(
  supabase: SupabaseClient,
  rows: { id: string; columnId: string; position: number }[],
) {
  if (rows.length === 0) return;
  const payload = rows.map((r) => ({
    id: r.id,
    column_id: r.columnId,
    position: r.position,
  }));
  const { error } = await supabase.rpc("reindex_task_positions", { payload });
  if (error) throw error;
}

export async function insertColumnRow(
  supabase: SupabaseClient,
  userId: string,
  column: Column,
) {
  const { error } = await supabase.from("columns").insert({
    id: column.id,
    user_id: userId,
    name: column.name,
    status: column.status,
    position: column.position,
    is_default: column.isDefault,
  });
  if (error) throw error;
}

export async function updateColumnRow(
  supabase: SupabaseClient,
  columnId: string,
  patch: { name?: string; position?: number; status?: TaskStatus },
) {
  const { error } = await supabase
    .from("columns")
    .update(patch)
    .eq("id", columnId);
  if (error) throw error;
}

export async function deleteColumnRow(
  supabase: SupabaseClient,
  columnId: string,
) {
  const { error } = await supabase
    .from("columns")
    .delete()
    .eq("id", columnId);
  if (error) throw error;
}

export async function reindexColumnPositions(
  supabase: SupabaseClient,
  rows: { id: string; position: number }[],
) {
  if (rows.length === 0) return;
  const { error } = await supabase.rpc("reindex_column_positions", {
    payload: rows,
  });
  if (error) throw error;
}

export async function insertTagRow(
  supabase: SupabaseClient,
  userId: string,
  tag: Tag,
) {
  const { error } = await supabase.from("tags").insert({
    id: tag.id,
    user_id: userId,
    name: tag.name,
    color: tag.color,
  });
  if (error) throw error;
}

export async function deleteTagRow(supabase: SupabaseClient, tagId: string) {
  const { error } = await supabase.from("tags").delete().eq("id", tagId);
  if (error) throw error;
}

export async function insertTimeLogRow(
  supabase: SupabaseClient,
  userId: string,
  taskId: string,
  entry: TimeLogEntry,
) {
  const { error } = await supabase.from("zone_sessions").insert({
    id: entry.id,
    user_id: userId,
    task_id: taskId,
    started_at: entry.startedAt,
    ended_at: entry.endedAt,
    duration_seconds: entry.durationSeconds,
    mode: "stopwatch",
    completed: true,
  });
  if (error) throw error;
}

export async function ensureDefaultColumns(
  supabase: SupabaseClient,
  _userId: string,
) {
  const { error } = await supabase.rpc("seed_default_columns");
  if (error && !error.message.includes("does not exist")) {
    throw error;
  }
}
